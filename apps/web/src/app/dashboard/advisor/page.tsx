"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChatConversation,
  fetchChatMessages,
  sendChatMessage,
  fetchCompositeAlerts,
  enableNightRationing,
  turnOffAc,
  type ChatMessageRow,
  type CompositeAlert,
} from "@/lib/api";
import { Topbar } from "@/components/topbar";
import { BrandMark } from "@/components/brand-mark";

const QUICK_QUESTIONS = [
  "كيف حال الحمل الكهربائي؟",
  "هل توجد تنبؤات نشطة؟",
  "ما هي التنبيهات المفتوحة؟",
  "كيف حالة الطقس اليوم؟",
  "هل توجد مشاكل بالمستشعرات؟",
];

export default function AdvisorPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [composites, setComposites] = useState<CompositeAlert[] | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createChatConversation().then((c) => {
      setConversationId(c.id);
      fetchChatMessages(c.id).then(setMessages);
    });
    fetchCompositeAlerts().then(setComposites);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    if (!conversationId || !text.trim()) return;
    setSending(true);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "USER", content: text, createdAt: new Date().toISOString() },
    ]);
    try {
      const reply = await sendChatMessage(conversationId, text);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setSending(false);
    }
  }

  async function handleCompositeAction(composite: CompositeAlert) {
    if (!composite.actionType) return;
    setActingOn(composite.id);
    try {
      if (composite.actionType === "ENABLE_NIGHT_RATIONING") await enableNightRationing();
      if (composite.actionType === "TURN_OFF_AC") await turnOffAc();
      setComposites((prev) => prev?.filter((c) => c.id !== composite.id) ?? null);
    } finally {
      setActingOn(null);
    }
  }

  return (
    <>
      <Topbar title="المستشار الذكي" />
      <main className="flex flex-1 gap-6 overflow-hidden px-6 py-8">
        <div className="flex flex-1 flex-col rounded-[var(--radius-lg)] border border-border-subtle bg-raised shadow-card">
          <div className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <BrandMark className="h-8 w-8 text-brand" />
                <p className="text-sm text-text-tertiary">
                  اسأليني عن حالة الكهرباء أو الطقس أو التنبؤات أو التنبيهات أو المستشعرات.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "USER" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-[var(--radius-md)] px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "USER"
                        ? "bg-sunken text-text-primary"
                        : "bg-brand/10 text-text-primary"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-border-subtle p-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={sending}
                  className="rounded-full bg-sunken px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-60"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتبي سؤالك هنا..."
                className="flex-1 rounded-[var(--radius-sm)] border border-border-subtle bg-canvas px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-[var(--radius-sm)] bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
              >
                إرسال
              </button>
            </form>
          </div>
        </div>

        <aside className="hidden w-72 shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
          <h2 className="text-sm font-semibold text-text-primary">التحديد المتعدد اللحظي</h2>
          {composites && composites.length === 0 && (
            <p className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 text-xs text-text-tertiary shadow-card">
              لا توجد تنبيهات مركّبة حاليًا.
            </p>
          )}
          {composites?.map((c) => (
            <div key={c.id} className="rounded-[var(--radius-lg)] border border-border-subtle bg-raised p-4 shadow-card">
              <p className="text-sm font-semibold text-text-primary">{c.siteName}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {c.factors.map((f) => (
                  <li key={f} className="text-xs text-text-secondary">
                    • {f}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{c.recommendation}</p>
              {c.actionType && (
                <button
                  onClick={() => handleCompositeAction(c)}
                  disabled={actingOn === c.id}
                  className="mt-3 w-full rounded-[var(--radius-sm)] bg-brand px-3 py-2 text-xs font-medium text-white transition-all hover:brightness-110 disabled:opacity-60"
                >
                  {actingOn === c.id
                    ? "جارٍ التنفيذ..."
                    : c.actionType === "ENABLE_NIGHT_RATIONING"
                      ? "تفعيل الترشيد الليلي"
                      : "إيقاف كل التكييف الآن"}
                </button>
              )}
            </div>
          ))}
        </aside>
      </main>
    </>
  );
}
