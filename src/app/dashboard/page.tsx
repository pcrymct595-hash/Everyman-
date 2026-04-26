import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const myClubs = await prisma.clubMember.findMany({
    where: { userId: session.user.id },
    include: { club: { include: { _count: { select: { members: true, posts: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const discoverClubs = await prisma.club.findMany({
    where: {
      isPublic: true,
      members: { none: { userId: session.user.id } },
    },
    include: { _count: { select: { members: true } } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-400">🎬 Everyman Film Club</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{session.user.name ?? session.user.email}</span>
          <Link href="/clubs/new" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors">
            + New Club
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-400 hover:text-white">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">My Clubs</h2>
          {myClubs.length === 0 ? (
            <p className="text-gray-500">You haven&#39;t joined any clubs yet. Discover clubs below or create one!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myClubs.map(({ club, role }) => (
                <Link key={club.id} href={`/clubs/${club.id}`}
                  className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{club.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${role === "ADMIN" ? "bg-amber-900 text-amber-300" : "bg-gray-800 text-gray-400"}`}>
                      {role}
                    </span>
                  </div>
                  {club.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{club.description}</p>}
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>👥 {club._count.members} members</span>
                    <span>💬 {club._count.posts} posts</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Discover Clubs</h2>
          {discoverClubs.length === 0 ? (
            <p className="text-gray-500">No other public clubs yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {discoverClubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`}
                  className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors">
                  <h3 className="font-semibold text-white mb-1">{club.name}</h3>
                  {club.description && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{club.description}</p>}
                  <div className="text-xs text-gray-500">👥 {club._count.members} members</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
