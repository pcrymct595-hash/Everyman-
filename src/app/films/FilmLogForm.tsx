"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FilmLogForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [director, setDirector] = useState("");
  const [rating, setRating] = useState(4);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/films", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        year: year || null,
        director: director || null,
        rating,
        review: review || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to log film");
      return;
    }
    setTitle("");
    setYear("");
    setDirector("");
    setRating(4);
    setReview("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Film title"
        required
        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year"
          inputMode="numeric"
          className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 outline-none"
        />
        <input
          value={director}
          onChange={(e) => setDirector(e.target.value)}
          placeholder="Director"
          className="px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 outline-none"
        />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1.5">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-2xl transition-colors ${n <= rating ? "text-amber-400" : "text-gray-700"}`}
              aria-label={`Rate ${n} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Quick thoughts (optional)"
        rows={3}
        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:border-amber-500 outline-none resize-none"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !title}
        className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black text-sm font-semibold rounded-lg transition-colors"
      >
        {submitting ? "Logging…" : "Log film"}
      </button>
    </form>
  );
}
