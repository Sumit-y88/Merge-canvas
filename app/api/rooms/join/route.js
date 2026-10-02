import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { joinRoom } from "@/src/services/RoomService";

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { inviteCode } = body || {};

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { message: "Invite code is required" },
        { status: 400 }
      );
    }

    const room = await joinRoom(inviteCode.trim(), user._id);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to join room" },
      { status: error.statusCode || 400 }
    );
  }
}
