"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Status = "GOING" | "MAYBE" | "NOT_GOING";

export default function RsvpButton({
  watchPartyId,
  initialStatus,
  goingCount,
}: {
  watchPartyId: string;
  initialStatus: Status | null;
  goingCount: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function setRsvp(next: Status) {
    setError(null);
    const previous = status;
    setStatus(next);
    const res = await fetch(`/api/watch-parties/${watchPartyId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setStatus(previous);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to RSVP");
      return;
    }
    startTransition(() => router.refresh());
  }

  const options: { value: Status; label: string }[] = [
    { value: "GOING", label: "Going" },
    { value: "MAYBE", label: "Maybe" },
    { value: "NOT_GOING", label: "Can't" },
  ];

  const goingAdjustment =
    status === "GOING" && initialStatus !== "GOING"
      ? 1
      : status !== "GOING" && initialStatus === "GOING"
      ? -1
      : 0;
  const displayGoing = goingCount + goingAdjustment;

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-200">RSVP</p>
        <p className="text-xs text-gray-500">{displayGoing} going</p>
      </div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            disabled={pending}
            onClick={() => setRsvp(opt.value)}
            className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              status === opt.value
                ? "bg-amber-500 text-black font-semibold"
                : "bg-gray-950 border border-gray-800 text-gray-300 hover:border-amber-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
