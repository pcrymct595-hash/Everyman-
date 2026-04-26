import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clubs = await prisma.club.findMany({
    where: { isPublic: true },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, isPublic } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const club = await prisma.club.create({
    data: {
      name,
      description,
      isPublic: isPublic ?? true,
      members: { create: { userId: session.user.id, role: "ADMIN" } },
    },
  });
  return NextResponse.json(club, { status: 201 });
}
