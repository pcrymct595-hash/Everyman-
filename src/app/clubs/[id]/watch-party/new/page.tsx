"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const TYPES = ["YOUTUBE", "PODCAST", "IN_PERSON", "SOCIAL"];

export default function NewWatchPartyPage() {
  const params = useParams();
  const clubId = params.id as string;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("YOUTUBE");
  const [url, setUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/clubs/${clubId}/watch-parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, url: url || null, scheduledAt: scheduledAt || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create watch party");
      setLoading(false);
      return;
    }
    const wp = await res.json();
    router.push(`/clubs/${clubId}/watch-party/${wp.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <Link href={`/clubs/${clubId}`} className="text-amber-400 hover:underline text-sm mb-6 block">← Back to Club</Link>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-amber-400 mb-6">New Watch Party</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title *</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Oppenheimer Watch Night"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">URL (YouTube, podcast, etc.)</label>
              <input
                type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scheduled Date &amp; Time</label>
              <input
                type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Watch Party"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
