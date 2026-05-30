import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ratings = await prisma.filmRating.findMany({
    where: { userId: session.user.id },
    include: { film: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ratings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, year, director, rating, review } = await req.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const parsedYear = year ? Number(year) : null;

  const film = await prisma.film.create({
    data: {
      title: String(title).trim(),
      year: parsedYear && Number.isInteger(parsedYear) ? parsedYear : null,
      director: director ? String(director).trim() : null,
      addedById: session.user.id,
    },
  });

  const filmRating = await prisma.filmRating.create({
    data: {
      filmId: film.id,
      userId: session.user.id,
      rating: parsedRating,
      review: review ? String(review).trim() : null,
    },
    include: { film: true },
  });

  return NextResponse.json(filmRating, { status: 201 });
}
