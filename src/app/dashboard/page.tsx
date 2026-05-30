import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [myClubs, discoverClubs, upcomingParties, recentPosts, myRatings, counts] = await Promise.all([
    prisma.clubMember.findMany({
      where: { userId },
      include: { club: { include: { _count: { select: { members: true, posts: true } } } } },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.club.findMany({
      where: { isPublic: true, members: { none: { userId } } },
      include: { _count: { select: { members: true } } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.watchParty.findMany({
      where: {
        club: { members: { some: { userId } } },
        OR: [{ scheduledAt: { gte: new Date() } }, { scheduledAt: null }],
      },
      include: {
        club: { select: { id: true, name: true } },
        rsvps: { where: { userId }, select: { status: true } },
        _count: { select: { rsvps: true } },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.post.findMany({
      where: { club: { members: { some: { userId } } } },
      include: {
        user: { select: { name: true, email: true } },
        club: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.filmRating.findMany({
      where: { userId },
      include: { film: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.$transaction([
      prisma.clubMember.count({ where: { userId } }),
      prisma.post.count({ where: { userId } }),
      prisma.watchPartyRSVP.count({ where: { userId, status: "GOING" } }),
      prisma.filmRating.count({ where: { userId } }),
    ]),
  ]);

  const [clubCount, postCount, rsvpCount, filmCount] = counts;
  const displayName = session.user.name ?? session.user.email ?? "there";

  const stats = [
    { label: "Clubs", value: clubCount, icon: "🎭" },
    { label: "Posts", value: postCount, icon: "💬" },
    { label: "Going to", value: rsvpCount, icon: "🍿" },
    { label: "Films logged", value: filmCount, icon: "🎞️" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-400">🎬 Everyman Film Club</h1>
        <div className="flex items-center gap-4">
          <Link href="/films" className="text-sm text-gray-400 hover:text-amber-400">Films</Link>
          <span className="text-sm text-gray-400 hidden sm:inline">{displayName}</span>
          <Link href="/clubs/new" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg transition-colors">
            + New Club
          </Link>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-400 hover:text-white">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {displayName.split(" ")[0]}</h2>
          <p className="text-gray-400 text-sm">Here&apos;s what&apos;s on at your cinema club.</p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-3xl font-bold text-amber-400">{s.value}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">Upcoming watch parties</h2>
              </div>
              {upcomingParties.length === 0 ? (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl text-gray-500 text-sm">
                  Nothing scheduled. Open a club to host one.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingParties.map((wp) => {
                    const rsvped = wp.rsvps[0]?.status === "GOING";
                    return (
                      <Link
                        key={wp.id}
                        href={`/clubs/${wp.club.id}/watch-party/${wp.id}`}
                        className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{wp.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {wp.club.name} · {wp.type}
                            {wp.scheduledAt ? ` · ${formatDate(wp.scheduledAt)}` : " · unscheduled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-gray-500">{wp._count.rsvps} going</span>
                          {rsvped && (
                            <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded">RSVP&apos;d</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Recent activity</h2>
              {recentPosts.length === 0 ? (
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl text-gray-500 text-sm">
                  No recent posts in your clubs.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPosts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/clubs/${p.club.id}`}
                      className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-amber-300">{p.user.name ?? p.user.email}</span>
                        <span className="text-xs text-gray-500">
                          {p.club.name} · {timeAgo(p.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{p.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-4">My Clubs</h2>
              {myClubs.length === 0 ? (
                <p className="text-gray-500 text-sm">You haven&apos;t joined any clubs yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClubs.map(({ club, role }) => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.id}`}
                      className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white">{club.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            role === "ADMIN" ? "bg-amber-900 text-amber-300" : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {role}
                        </span>
                      </div>
                      {club.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{club.description}</p>
                      )}
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>👥 {club._count.members} members</span>
                        <span>💬 {club._count.posts} posts</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">My films</h2>
                <Link href="/films" className="text-xs text-amber-400 hover:underline">
                  Log a film →
                </Link>
              </div>
              {myRatings.length === 0 ? (
                <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl text-gray-500 text-sm">
                  Log films you&apos;ve watched to track your year.
                </div>
              ) : (
                <ul className="space-y-2">
                  {myRatings.map((r) => (
                    <li key={r.id} className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {r.film.title}
                          {r.film.year ? ` (${r.film.year})` : ""}
                        </p>
                        <span className="text-amber-400 text-sm shrink-0 ml-2">
                          {"★".repeat(r.rating)}
                          <span className="text-gray-700">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                        </span>
                      </div>
                      {r.review && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.review}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Discover clubs</h2>
              {discoverClubs.length === 0 ? (
                <p className="text-gray-500 text-sm">No other public clubs yet.</p>
              ) : (
                <div className="space-y-3">
                  {discoverClubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.id}`}
                      className="block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-colors"
                    >
                      <h3 className="font-semibold text-white text-sm mb-1">{club.name}</h3>
                      {club.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{club.description}</p>
                      )}
                      <div className="text-xs text-gray-500">👥 {club._count.members} members</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
