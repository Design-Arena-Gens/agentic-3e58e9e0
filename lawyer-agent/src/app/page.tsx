"use client";

import { useMemo, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  sources?: {
    id: string;
    title: string;
    summary: string;
    excerpt: string;
    citations: string[];
    sources: { label: string; url: string }[];
    score: number;
    highlights: string[];
    region: string;
    era: string;
    type: string;
  }[];
  followUps?: string[];
};

const EXAMPLE_QUERIES = [
  "Explain champerty and whether it's still enforceable.",
  "What does Black's Law Dictionary say about consideration?",
  "List obscure blue laws that remain active today.",
  "How is quo warranto used against public officials?",
];

let messageCounter = 0;

function nextMessageId() {
  messageCounter += 1;
  return `msg-${Date.now().toString(36)}-${messageCounter}`;
}

function createMessage(role: ChatRole, content: string, extras?: Partial<ChatMessage>): ChatMessage {
  return {
    id: nextMessageId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Welcome. I synthesize Black's Law Dictionary entries and lesser-known statutory artifacts to help with historical and doctrinal research. Ask about an obscure regulation, a classic doctrine, or a definition you want unpacked.",
    ),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.sources),
    [messages],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = createMessage("user", input.trim());
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input.trim() }),
      });

      if (!response.ok) {
        throw new Error("The assistant could not process that request.");
      }

      const data = await response.json();
      const assistantMessage = createMessage("assistant", data.answer, {
        sources: data.results,
        followUps: data.followUps,
      });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setInput("");
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Caldwell & Finch Research Lab
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Lawyer Agent Assistant for Obscure Law + Black&apos;s Dictionary Insights
            </h1>
            <p className="text-sm text-slate-600">
              Curated summaries from Black&apos;s Law Dictionary (11th ed.) and enduring yet overlooked statutes.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-700">Research Posture</p>
            <p>• Secondary sources only</p>
            <p>• Jurisdiction-aware heuristics</p>
            <p>• No legal advice provided</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex h-[520px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex flex-col gap-2 ${message.role === "assistant" ? "items-start" : "items-end"}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {message.role === "assistant" ? "Assistant" : "Researcher"} • {formatTime(message.timestamp)}
                  </span>
                  <p
                    className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === "assistant"
                        ? "bg-slate-50 text-slate-800"
                        : "bg-slate-900 text-slate-100"
                    }`}
                  >
                    {message.content}
                  </p>
                  {message.followUps && message.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.followUps.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50 p-4">
              {error && (
                <p className="mb-2 text-xs font-semibold text-rose-600">{error}</p>
              )}
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about an obscure doctrine, definition, or statutory relic..."
                  className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-inner focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  rows={3}
                  disabled={isLoading}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isLoading ? "Researching..." : "Send"}
                </button>
              </div>
            </form>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Quick Prompts
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => handleSuggestionClick(query)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Latest Sources
              </h2>
              {lastAssistantMessage?.sources ? (
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  {lastAssistantMessage.sources.map((source) => (
                    <li key={source.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{source.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{source.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {source.citations.join(" • ") || "Citation unavailable"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{source.type}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{source.region}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{source.era}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {source.sources.map((ref) => (
                          <a
                            key={ref.url}
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-700 underline-offset-2 hover:underline"
                          >
                            {ref.label}
                          </a>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Ask a question to surface cross-referenced dictionary entries and statutes.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Knowledge Base Coverage
          </h2>
          <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-4xl font-bold text-slate-900">11</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Curated Entries</p>
              <p className="mt-2 text-xs text-slate-500">
                Hand-selected definitions, doctrines, statutes, and precedents anchored in authoritative secondary sources.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-4xl font-bold text-slate-900">5</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Obscure Statutes</p>
              <p className="mt-2 text-xs text-slate-500">
                Includes blue laws, administrative curiosities, and jurisdiction-specific holdovers that remain formally active.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-4xl font-bold text-slate-900">100%</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Ethics Reminder</p>
              <p className="mt-2 text-xs text-slate-500">
                Outputs are educational; consult a licensed attorney for applied legal advice or jurisdiction-specific compliance.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Not legal advice. Content derived from secondary sources including Black&apos;s Law Dictionary and public statute compilations.
          </p>
          <p>
            For critical research, verify against primary authority and current statutory supplements.
          </p>
        </div>
      </footer>
    </div>
  );
}
