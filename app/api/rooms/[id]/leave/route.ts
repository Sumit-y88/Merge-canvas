import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { leaveRoom } from "@/src/services/RoomService";

export async function POST(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    await leaveRoom(id, user._id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
