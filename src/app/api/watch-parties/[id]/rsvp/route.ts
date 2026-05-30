import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set(["GOING", "MAYBE", "NOT_GOING"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const party = await prisma.watchParty.findUnique({
    where: { id },
    select: { clubId: true },
  });
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: party.clubId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const rsvp = await prisma.watchPartyRSVP.upsert({
    where: { userId_watchPartyId: { userId: session.user.id, watchPartyId: id } },
    update: { status },
    create: { userId: session.user.id, watchPartyId: id, status },
  });

  return NextResponse.json(rsvp);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.watchPartyRSVP.deleteMany({
    where: { userId: session.user.id, watchPartyId: id },
  });
  return NextResponse.json({ ok: true });
}
