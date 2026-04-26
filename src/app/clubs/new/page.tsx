"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClubPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPublic }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create club");
      setLoading(false);
      return;
    }
    const club = await res.json();
    router.push(`/clubs/${club.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="text-amber-400 hover:underline text-sm mb-6 block">← Back to Dashboard</Link>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-amber-400 mb-6">Create a Film Club</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Club Name *</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nolan Fan Club"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this club about?"
                rows={3}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-300">
                Public club (anyone can discover and join)
              </label>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Club"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
