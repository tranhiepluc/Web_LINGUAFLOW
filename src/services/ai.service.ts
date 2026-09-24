import { prisma } from "@/lib/db";
import { openAiChat } from "@/lib/ai-client";
import { rateLimit } from "@/lib/rate-limit";
import { stripDiacritics } from "@/lib/utils";
import { chineseMini, englishMini, isChineseText } from "@/lib/mini-dictionary";
import type { AnalyzedWord, VocabLanguage } from "@/types";
import type { Vocabulary } from "@prisma/client";

// ==================== CHAT ====================

export interface AiChatResult {
  conversationId: string;
  reply: string;
  provider: "openai" | "mock";
}

const CJK_RE = /[\u4e00-\u9fff]+/g;
const LATIN_RE = /[a-zA-Z][a-zA-Z'-]{2,}/g;

function extractTarget(message: string): { lang: VocabLanguage; word: string } | null {
  const cjk = message.match(CJK_RE);
  if (cjk) {
    const longMatch = cjk.find((c) => c.length >= 2);
    return { lang: "chinese", word: longMatch ?? cjk[0] };
  }

  const latinMatches = message
    .match(LATIN_RE)
    ?.map((w) => w.toLowerCase())
    .filter((w) => !["nghia", "cua", "cach", "the", "dung", "lam", "mot", "theo", "cho", "ban", "biet", "ngu", "phap", "bao", "nhieu", "khi", "giup", "tu"].includes(w));

  if (!latinMatches?.length) return null;
  return { lang: "english", word: latinMatches[0] };
}

async function findWord(lang: VocabLanguage, word: string): Promise<Vocabulary | null> {
  if (lang === "chinese") {
    return prisma.vocabulary.findFirst({
      where: { language: "chinese", word },
    });
  }
  return prisma.vocabulary.findFirst({
    where: { language: "english", normalizedWord: word },
  });
}

function mockWordReply(v: Vocabulary): string {
  const lines: string[] = [];
  const head = v.language === "chinese" ? `${v.word} (${v.pinyin ?? "?"})` : v.word;
  lines.push(`## 📖 ${head}`);
  lines.push("");

  if (v.pronunciation) lines.push(`**Phát âm:** /${v.pronunciation.replace(/[/]/g, "")}/`);
  if (v.pinyin) lines.push(`**Pinyin:** ${v.pinyin}`);
  lines.push(`**Từ loại:** ${v.partOfSpeech ?? "—"}`);
  lines.push(`**Nghĩa:** ${v.meaningVi}`);
  if (v.charAnalysis) lines.push(`**Phân tích chữ:** ${v.charAnalysis}`);
  lines.push("");
  if (v.exampleSentence) {
    lines.push(`**Ví dụ:**`);
    lines.push(`- ${v.exampleSentence}`);
    if (v.exampleTranslation) lines.push(`- Dịch: ${v.exampleTranslation}`);
    lines.push("");
  }

  lines.push(`**Cách ghi nhớ:**`);
  lines.push(`- Liên tưởng: mỗi lần gặp từ "${v.word}", hãy nghĩ ngay đến "từ bỏ".`);
  lines.push(`- Đặt câu riêng: dùng từ này viết 1 câu tiếng ${v.language === "chinese" ? "Trung" : "Anh"} hôm nay.`);
  lines.push("");

  const quizLine = v.language === "chinese"
    ? `- "Từ nào có nghĩa là '${v.meaningVi}'?" → Đáp án: ${v.word}`
    : `- "Từ nào có nghĩa là '${v.meaningVi}'?" → Đáp án: ${v.word}`;
  lines.push(`**🎯 Mini quiz:** ${quizLine}`);
  lines.push("");
  lines.push(`Để luyện tập thêm, vào mục **Luyện tập** hoặc bấm ⭐ **Lưu** để ôn tập theo lịch thông minh.`);

  return lines.join("\n");
}

function mockGenericReply(message: string): string {
  const lower = stripDiacritics(message.toLowerCase());
  if (lower.includes("ngu phap") || lower.includes("grammar") || lower.includes("gram")) {
    return [
      "## 📘 Mẹo ngữ pháp nhanh",
      "",
      "Hãy học ngữ pháp qua **câu mẫu thực tế** thay vì quy tắc khô khan:",
      "",
      "- Tiếng Anh: *\"I decided to study every day.\"* (quyết định + to + động từ nguyên mẫu)",
      "- Tiếng Trung: 我每天学习。 (chủ ngữ + thời gian + động từ)",
      "",
      "Viết cho mình 3 câu mẫu, sau đó nhờ AI Tutor sửa và nhận xét nhé!",
    ].join("\n");
  }
  return [
    "## 🤖 AI Tutor (chế độ demo)",
    "",
    "Hệ thống đang chạy ở **chế độ demo** (chưa cấu hình OPENAI_API_KEY). Mình có thể giúp bạn:",
    "",
    "- Giải thích nghĩa của một từ cụ thể, ví dụ: \"Tôi không hiểu từ **negotiate**\"",
    "- Xem tiếng Trung: \"Giải thích từ **谈判**\"",
    "- Tạo quiz, gợi ý cách ghi nhớ từ",
    "",
    `Bạn vừa hỏi: *"${message.slice(0, 120)}"*`,
    "",
    "🏗️ Thử nhập một từ vựng cụ thể để mình phân tích chi tiết nhé!",
  ].join("\n");
}

export async function aiChat(
  userId: string,
  message: string,
  existingConversationId?: string,
): Promise<AiChatResult> {
  const rl = rateLimit(`ai:chat:${userId}`, { limit: 15, windowMs: 60_000 });
  if (!rl.success) throw new Error("RATE_LIMIT");

  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  let conversationId = existingConversationId;

  if (conversationId) {
    const conv = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) conversationId = undefined;
  }

  if (!conversationId) {
    const conv = await prisma.aIConversation.create({
      data: {
        userId,
        provider: hasOpenAi ? "openai" : "mock",
        title: message.slice(0, 40),
      },
    });
    conversationId = conv.id;
  }

  await prisma.aIMessage.create({
    data: { conversationId, role: "user", content: message },
  });

  let reply: string;
  let provider: "openai" | "mock" = "mock";

  if (hasOpenAi) {
    const history = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 16,
    });

    const aiReply = await openAiChat(
      [
        {
          role: "system",
          content:
            "Bạn là AI Tutor dạy từ vựng tiếng Anh và tiếng Trung cho người Việt. Trả lời bằng tiếng Việt, rõ ràng, có cấu trúc (nghĩa, phát âm, ví dụ, mẹo ghi nhớ, mini quiz). Hãy thân thiện, ngắn gọn, dạy theo kiểu thực hành.",
        },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      { temperature: 0.7, maxTokens: 700 },
    );

    if (aiReply) {
      reply = aiReply;
      provider = "openai";
    } else {
      const target = extractTarget(message);
      const word = target ? await findWord(target.lang, target.word) : null;
      reply = word ? mockWordReply(word) : mockGenericReply(message);
    }
  } else {
    const target = extractTarget(message);
    const word = target ? await findWord(target.lang, target.word) : null;
    reply = word ? mockWordReply(word) : mockGenericReply(message);
  }

  await prisma.aIMessage.create({
    data: { conversationId, role: "assistant", content: reply },
  });

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return { conversationId, reply, provider };
}

// ==================== PHÂN TÍCH ĐOẠN VĂN ====================

export interface AnalyzeResult {
  language: VocabLanguage | "vietnamese";
  words: AnalyzedWord[];
  totalTokens: number;
  knownCount: number;
  unknownFromDict: number;
  stopwordCount: number;
}

const ENGLISH_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "by", "for", "with", "from",
  "as", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "i", "we", "you", "he", "she", "it", "they", "this", "that", "these", "those", "what", "which",
  "who", "whom", "when", "where", "why", "how", "not", "no", "so", "if", "then", "than", "too",
  "very", "just", "also", "will", "would", "can", "could", "should", "may", "might", "must", "there",
  "here", "my", "your", "his", "her", "our", "their", "its", "me", "him", "us", "them", "now", "out",
  "up", "down", "all", "any", "one", "two", "about", "into", "over", "after", "before", "while",
]);

const VIETNAMESE_HINTS = new Set([
  "là", "của", "và", "không", "tôi", "bạn", "nhưng", "được", "có", "một", "những", "các",
  "này", "đó", "với", "cho", "cũng", "đang", "đã", "sẽ", "thì", "mà", "trong", "trên", "dưới",
]);

function tokenizeEnglish(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-zA-Z][a-zA-Z'-]{2,}/g);
  if (!matches) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

export async function analyzeText(userId: string, text: string): Promise<AnalyzeResult> {
  const rl = rateLimit(`ai:analyze:${userId}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) throw new Error("RATE_LIMIT");

  const trimmed = text.replace(/\s+/g, " ").trim();

  if (isChineseText(trimmed)) {
    return analyzeChinese(trimmed);
  }

  // Detect tiếng Việt
  const words = trimmed.toLowerCase().split(/\s+/);
  const viCount = words.filter((w) => VIETNAMESE_HINTS.has(w)).length;
  if (viCount >= 2 && words.length > 4) {
    // Có thể là EN chứa from/for... kiểm tra thêm tỷ lệ latin đơn lẻ
    const latinRatio = words.filter((w) => /^[a-zA-Z]+$/.test(w)).length / words.length;
    if (latinRatio < 0.6) {
      return {
        language: "vietnamese",
        words: [],
        totalTokens: words.length,
        knownCount: 0,
        unknownFromDict: 0,
        stopwordCount: 0,
      };
    }
  }

  return analyzeEnglish(userId, trimmed);
}

async function analyzeEnglish(userId: string, text: string): Promise<AnalyzeResult> {
  const tokens = tokenizeEnglish(text);
  const stopwordCount = tokens.filter((t) => ENGLISH_STOPWORDS.has(t)).length;
  const contentTokens = tokens.filter((t) => !ENGLISH_STOPWORDS.has(t));

  const dbRows = await prisma.vocabulary.findMany({ where: { language: "english" } });
  const dbMap = new Map<string, Vocabulary>();
  for (const row of dbRows) dbMap.set(row.normalizedWord, row);

  const results: AnalyzedWord[] = [];
  let knownCount = 0;

  for (const token of contentTokens) {
    const db = dbMap.get(token);
    if (db) {
      knownCount += 1;
      results.push({
        word: db.word,
        language: "english",
        meaningVi: db.meaningVi,
        partOfSpeech: db.partOfSpeech ?? undefined,
        difficulty: db.difficulty,
        level: db.level ?? undefined,
        example: db.exampleSentence ?? undefined,
        vocabularyId: db.id,
        known: true,
      });
      continue;
    }

    const mini = englishMini[token];
    if (mini) {
      results.push({
        word: token,
        language: "english",
        meaningVi: mini.m,
        partOfSpeech: mini.p,
        difficulty: mini.d ?? 3,
        known: false,
      });
      continue;
    }

    results.push({
      word: token,
      language: "english",
      meaningVi: "",
      partOfSpeech: undefined,
      difficulty: token.length > 8 ? 4 : 3,
      known: false,
    });
  }

  const unknown = results.filter((w) => !w.known && !w.meaningVi);
  if (unknown.length && process.env.OPENAI_API_KEY) {
    try {
      const enriched = await enrichEnglishWords(userId, unknown.map((w) => w.word), text);
      const map = new Map(enriched.map((w) => [w.word.toLowerCase(), w]));
      for (const r of results) {
        const e = map.get(r.word.replace(/'/g, "").toLowerCase());
        if (e && !r.meaningVi) {
          r.meaningVi = e.meaningVi;
          r.partOfSpeech = e.partOfSpeech;
          r.difficulty = e.difficulty;
        }
      }
    } catch (error) {
      console.error("[ai] enrich failed:", error);
    }
  }

  return {
    language: "english",
    words: results,
    totalTokens: tokens.length,
    knownCount,
    unknownFromDict: unknown.length,
    stopwordCount,
  };
}

interface EnrichedWord {
  word: string;
  meaningVi: string;
  partOfSpeech?: string;
  difficulty: number;
  level?: string;
}

async function enrichEnglishWords(
  userId: string,
  tokens: string[],
  context: string,
): Promise<EnrichedWord[]> {
  const result = await openAiChat(
    [
      {
        role: "system",
        content:
          'Bạn trả về JSON với format: {"words":[{"word":"...","meaningVi":"nghĩa tiếng Việt","partOfSpeech":"noun|verb|adjective...","difficulty":1-5}]}. Chỉ trả về những từ được yêu cầu. Ý nghĩa dựa theo ngữ cảnh đoạn văn.',
      },
      {
        role: "user",
        content: `Đoạn văn: "${context}"\nCác từ cần dịch: ${tokens.join(", ")}`,
      },
    ],
    { json: true, temperature: 0.3, maxTokens: 800 },
  );

  if (!result) return [];
  try {
    const parsed = JSON.parse(result) as { words?: EnrichedWord[] };
    return Array.isArray(parsed.words) ? parsed.words : [];
  } catch {
    return [];
  }
}

async function analyzeChinese(text: string): Promise<AnalyzeResult> {
  const dbRows = await prisma.vocabulary.findMany({ where: { language: "chinese" } });
  const dbByWord = new Map(dbRows.map((r) => [r.word, r]));
  const dbByLength = [...dbByWord.entries()]
    .map(([word, v]) => ({ word, v, len: word.length }))
    .sort((a, b) => b.len - a.len);

  const clean = text.replace(/[\s，。！？、；：,.!?;:"']/g, "");
  const matched: { word: string; v: Vocabulary }[] = [];
  let i = 0;
  const covered = new Set<string>();

  while (i < clean.length) {
    let hit: { word: string; v: Vocabulary } | null = null;
    for (const entry of dbByLength) {
      if (clean.startsWith(entry.word, i)) {
        hit = { word: entry.word, v: entry.v };
        break;
      }
    }

    if (hit) {
      matched.push(hit);
      const start = i;
      for (let j = 0; j < hit.word.length; j++) covered.add(String(start + j));
      i += hit.word.length;
    } else {
      i += 1;
    }
  }

  const deduped = new Map<string, { word: string; v: Vocabulary }>();
  for (const m of matched) {
    if (!deduped.has(m.word)) deduped.set(m.word, m);
  }

  const words: AnalyzedWord[] = [];
  for (const { word, v } of deduped.values()) {
    words.push({
      word,
      language: "chinese",
      pinyin: v.pinyin ?? undefined,
      meaningVi: v.meaningVi,
      partOfSpeech: v.partOfSpeech ?? undefined,
      difficulty: v.difficulty,
      level: v.level ?? undefined,
      example: v.exampleSentence ?? undefined,
      vocabularyId: v.id,
      known: true,
    });
  }

  // Các ký tự chưa khớp → cố gắng tra mini dict
  for (let j = 0; j < clean.length; j++) {
    if (covered.has(String(j))) continue;
    const ch = clean[j];
    const mini = chineseMini[ch];
    if (mini && !words.some((w) => w.word === ch)) {
      words.push({
        word: ch,
        language: "chinese",
        pinyin: undefined,
        meaningVi: mini.m,
        partOfSpeech: mini.p,
        difficulty: mini.d ?? 3,
        known: false,
      });
    }
  }

  return {
    language: "chinese",
    words,
    totalTokens: clean.length,
    knownCount: deduped.size,
    unknownFromDict: clean.length - covered.size,
    stopwordCount: 0,
  };
}