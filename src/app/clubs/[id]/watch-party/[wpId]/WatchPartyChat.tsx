"use client";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export default function WatchPartyChat({ watchPartyId, currentUserId }: { watchPartyId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    const res = await fetch(`/api/watch-parties/${watchPartyId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [watchPartyId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await fetch(`/api/watch-parties/${watchPartyId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    await loadMessages();
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.user.id === currentUserId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.user.id === currentUserId ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-200"}`}>
                {msg.user.id !== currentUserId && (
                  <p className="text-xs font-semibold mb-0.5 text-amber-300">{msg.user.name ?? msg.user.email}</p>
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text" value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Say something..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white text-sm"
        />
        <button
          type="submit" disabled={loading || !content.trim()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
