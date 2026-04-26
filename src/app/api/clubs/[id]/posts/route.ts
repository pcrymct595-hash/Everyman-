import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await prisma.post.findMany({
    where: { clubId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const post = await prisma.post.create({
    data: { content, userId: session.user.id, clubId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(post, { status: 201 });
}
