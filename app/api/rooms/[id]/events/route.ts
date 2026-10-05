import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { getPusherServer } from "@/src/lib/pusherServer";

export async function POST(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const { event, data, socketId } = body || {};

    if (!event || !["cursor:update", "draft:update"].includes(event)) {
      return NextResponse.json({ message: "Invalid event type" }, { status: 400 });
    }

    const pusher = getPusherServer();
    if (pusher) {
      const options = socketId ? { socket_id: socketId } : undefined;
      await pusher.trigger(
        `presence-room-${id}`,
        event,
        { ...data, userId: user._id.toString() },
        options
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to broadcast event" },
      { status: 400 }
    );
  }
}
