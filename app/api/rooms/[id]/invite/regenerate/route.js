import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { regenerateInviteCode } from "@/src/services/RoomService";

export async function POST(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const room = await regenerateInviteCode(id, user._id);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
