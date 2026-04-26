import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WatchPartyChat from "./WatchPartyChat";

function getYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

export default async function WatchPartyPage({ params }: { params: Promise<{ id: string; wpId: string }> }) {
  const { id, wpId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const wp = await prisma.watchParty.findUnique({ where: { id: wpId } });
  if (!wp) return <div className="p-8 text-gray-400">Watch party not found</div>;

  const ytId = wp.url ? getYouTubeId(wp.url) : null;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <Link href={`/clubs/${id}`} className="text-amber-400 hover:underline text-sm">← Club</Link>
        <span className="text-gray-600">/</span>
        <h1 className="font-bold text-white">{wp.title}</h1>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{wp.type}</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {ytId ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden mb-4">
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${ytId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen className="w-full h-full"
              />
            </div>
          ) : wp.url ? (
            <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 mb-4">
              <p className="text-sm text-gray-400 mb-2">Watch party link:</p>
              <a href={wp.url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline break-all">
                {wp.url}
              </a>
            </div>
          ) : (
            <div className="p-6 bg-gray-900 rounded-xl border border-gray-800 mb-4 text-center">
              <p className="text-4xl mb-2">🎬</p>
              <p className="text-gray-400">{wp.type === "IN_PERSON" ? "In-person event" : "No media URL set"}</p>
              {wp.scheduledAt && (
                <p className="text-amber-400 mt-2">{new Date(wp.scheduledAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {wp.scheduledAt && (
            <p className="text-sm text-gray-400 mb-4">
              Scheduled: <span className="text-amber-400">{new Date(wp.scheduledAt).toLocaleString()}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col h-[70vh]">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Live Chat</h2>
          <WatchPartyChat watchPartyId={wpId} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
