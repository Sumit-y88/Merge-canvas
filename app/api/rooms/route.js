import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { createRoom, getUserRooms } from "@/src/services/RoomService";

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    const rooms = await getUserRooms(user._id);
    return NextResponse.json(rooms, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to load rooms" },
      { status: error.statusCode || 400 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { name } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Room name is required" },
        { status: 400 }
      );
    }

    const room = await createRoom(name.trim(), user._id);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to create room" },
      { status: error.statusCode || 400 }
    );
  }
}
