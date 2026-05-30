import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FilmLogForm from "./FilmLogForm";

export default async function FilmsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const ratings = await prisma.filmRating.findMany({
    where: { userId: session.user.id },
    include: { film: true },
    orderBy: { createdAt: "desc" },
  });

  const avg =
    ratings.length === 0
      ? null
      : (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-amber-400 hover:underline text-sm">← Dashboard</Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-bold text-white">My Films</h1>
        </div>
        <div className="text-sm text-gray-400">
          {ratings.length} logged{avg ? ` · ${avg}★ average` : ""}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Watched</h2>
          {ratings.length === 0 ? (
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl text-gray-500 text-sm">
              You haven&apos;t logged any films yet. Add one on the right.
            </div>
          ) : (
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {r.film.title}
                        {r.film.year ? <span className="text-gray-500"> ({r.film.year})</span> : null}
                      </p>
                      {r.film.director && <p className="text-xs text-gray-500">dir. {r.film.director}</p>}
                    </div>
                    <span className="text-amber-400 shrink-0">
                      {"★".repeat(r.rating)}
                      <span className="text-gray-700">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                    </span>
                  </div>
                  {r.review && <p className="text-sm text-gray-300 mt-3">{r.review}</p>}
                  <p className="text-xs text-gray-600 mt-2">
                    Logged {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Log a film</h2>
          <FilmLogForm />
        </aside>
      </main>
    </div>
  );
}
