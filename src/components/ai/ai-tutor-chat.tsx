"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, SendHorizonal, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toVietnameseMessage } from "@/lib/errors";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Giải thích cụm từ \"break the ice\" với ví dụ",
  "Học 学习 / xuéxí và 5 từ đồng nghĩa gần nhất",
  "Mini quiz 3 câu về động từ bất quy tắc",
  "So sánh \"affect\" và \"effect\"",
];

export function AiTutorChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Xin chào! 👋 Mình là AI Tutor của LINGUAFLOW (chạy bằng OpenAI khi có API key, ngược lại dùng trợ lý offline trong từ điển nội bộ). Hỏi mình bất cứ điều gì về từ vựng tiếng Anh hoặc tiếng Trung nhé!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversationId: conversationId.current }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI_ERROR");
      conversationId.current = json.data.conversationId;
      setMessages((m) => [...m, { role: "assistant", content: json.data.reply }]);
    } catch (error) {
      toast.error(toVietnameseMessage(error));
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, có lỗi xảy ra. Bạn thử lại sau giây lát nhé." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Trợ lý AI</h2>
          <p className="text-xs text-muted-foreground">Giải thích từ, cụm từ, so sánh từ dễ nhầm, mini quiz...</p>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                  m.role === "user" ? "bg-primary text-white" : "bg-secondary text-primary"
                }`}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary text-white" : "bg-secondary/70"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-primary">
                <Bot className="size-4" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl bg-secondary/70 px-4 py-2.5">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">đang suy nghĩ...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Hỏi về từ vựng tiếng Anh / tiếng Trung..."
            disabled={loading}
          />
          <Button type="button" onClick={() => send()} disabled={loading || !input.trim()} aria-label="Gửi">
            <SendHorizonal />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => send(s)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}