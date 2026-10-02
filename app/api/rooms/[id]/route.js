import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import {
  getRoomById as getRoomByIdService,
  updateRoomSettings,
  deleteRoom as deleteRoomService,
} from "@/src/services/RoomService";
import { getPusherServer } from "@/src/lib/pusherServer";

export async function GET(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const room = await getRoomByIdService(id, user._id);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    const status =
      error.message === "Not authorized to view this room" ? 403 : 404;
    return NextResponse.json({ message: error.message }, { status });
  }
}

export async function PATCH(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const room = await updateRoomSettings(id, user._id, body);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}

export async function DELETE(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    await deleteRoomService(id, user._id);

    const pusher = getPusherServer();
    if (pusher) {
      pusher.trigger(`presence-room-${id}`, "room:deleted", {}).catch(() => {});
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
