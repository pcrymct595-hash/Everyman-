import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await prisma.watchPartyMessage.findMany({
    where: { watchPartyId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const msg = await prisma.watchPartyMessage.create({
    data: { content, userId: session.user.id, watchPartyId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(msg, { status: 201 });
}
