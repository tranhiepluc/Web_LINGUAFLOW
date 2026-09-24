/**
 * Audio service — cách ly toàn bộ logic phát âm khỏi UI.
 * Fallback mặc định: browser SpeechSynthesis (không cần API key).
 */

import { isBrowser } from "./utils";

export type SpeechLanguage = "english" | "chinese";

const SPEECH_LANG: Record<SpeechLanguage, string> = {
  english: "en-US",
  chinese: "zh-CN",
};

const VOICE_PREFERENCE: Record<SpeechLanguage, string[]> = {
  english: ["en-US", "en-GB", "en"],
  chinese: ["zh-CN", "zh-TW", "zh"],
};

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: () => void;
}

export function isSpeechSupported(): boolean {
  return isBrowser() && "speechSynthesis" in window;
}

function pickVoice(lang: SpeechLanguage): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefs = VOICE_PREFERENCE[lang];
  for (const pref of prefs) {
    const exact = voices.find((v) => v.lang === pref);
    if (exact) return exact;
  }
  for (const pref of prefs) {
    const partial = voices.find((v) => v.lang.toLowerCase().startsWith(pref.toLowerCase()));
    if (partial) return partial;
  }
  return null;
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speak(text: string, lang: SpeechLanguage, options: SpeakOptions = {}): boolean {
  if (!isSpeechSupported() || !text) {
    options.onError?.();
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[lang];
    const rate = options.rate ?? 1;
    utterance.rate = rate > 1.6 ? 1 : rate < 0.5 ? 0.6 : rate;
    utterance.pitch = options.pitch ?? 1;

    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onError?.();

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error("[audio] speech failed:", error);
    options.onError?.();
    return false;
  }
}

/** Tải danh sách voice (gọi 1 lần ở client để giọng đọc sẵn sàng). */
export function warmupVoices(): void {
  if (!isSpeechSupported()) return;
  const load = () => window.speechSynthesis.getVoices();
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

export function speakEnglish(text: string, options?: SpeakOptions): boolean {
  return speak(text, "english", options);
}

export function speakChinese(text: string, options?: SpeakOptions): boolean {
  return speak(text, "chinese", options);
}

/** Tự chọn ngôn ngữ theo từ vựng. */
export function speakWord(
  text: string,
  lang: SpeechLanguage,
  options?: SpeakOptions,
): boolean {
  return speak(text, lang, options);
}
