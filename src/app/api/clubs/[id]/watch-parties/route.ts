import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parties = await prisma.watchParty.findMany({
    where: { clubId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(parties);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { title, type, url, scheduledAt } = await req.json();
  if (!title || !type) return NextResponse.json({ error: "Title and type required" }, { status: 400 });

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: id } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const party = await prisma.watchParty.create({
    data: { title, type, url, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, clubId: id },
  });
  return NextResponse.json(party, { status: 201 });
}
