import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClubFeed from "./ClubFeed";

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      watchParties: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!club) return <div className="p-8 text-gray-400">Club not found</div>;

  const membership = club.members.find((m) => m.userId === session.user?.id);
  const isMember = !!membership;
  const isAdmin = membership?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-amber-400 hover:underline text-sm">← Dashboard</Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-bold text-white">{club.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded ${club.isPublic ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"}`}>
            {club.isPublic ? "Public" : "Private"}
          </span>
        </div>
        {isAdmin && (
          <Link href={`/clubs/${id}/watch-party/new`}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors">
            + Watch Party
          </Link>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {club.description && (
            <p className="text-gray-400 mb-6">{club.description}</p>
          )}

          {!isMember && club.isPublic && (
            <JoinButton clubId={id} />
          )}

          {/* Watch Parties */}
          {club.watchParties.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-200">Watch Parties</h2>
              <div className="space-y-3">
                {club.watchParties.map((wp) => (
                  <Link key={wp.id} href={`/clubs/${id}/watch-party/${wp.id}`}
                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors">
                    <div>
                      <p className="font-medium text-white">{wp.title}</p>
                      <p className="text-xs text-gray-500">{wp.type}{wp.scheduledAt ? ` · ${new Date(wp.scheduledAt).toLocaleDateString()}` : ""}</p>
                    </div>
                    <span className="text-amber-400 text-sm">Watch →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Club Feed */}
          <ClubFeed clubId={id} isMember={isMember} currentUserId={session.user.id} />
        </div>

        {/* Sidebar: Members */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Members ({club.members.length})</h2>
          <div className="space-y-2">
            {club.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-300">{m.user.name ?? m.user.email}</span>
                {m.role === "ADMIN" && (
                  <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function JoinButton({ clubId }: { clubId: string }) {
  return (
    <form action={`/api/clubs/${clubId}/members`} method="post" className="mb-6">
      <button
        type="submit"
        className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
      >
        Join Club
      </button>
    </form>
  );
}
