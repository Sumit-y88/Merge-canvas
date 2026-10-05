import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { saveRoomCanvas } from "@/src/services/RoomService";
import { validateCanvasData } from "@/src/utils/payloadValidation";
import { getPusherServer } from "@/src/lib/pusherServer";

export async function PUT(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const { canvasData, socketId } = body || {};

    validateCanvasData(canvasData);
    const result = await saveRoomCanvas(id, user._id, canvasData);

    const pusher = getPusherServer();
    if (pusher) {
      const options = socketId ? { socket_id: socketId } : undefined;
      pusher
        .trigger(
          `presence-room-${id}`,
          "canvas:update",
          { canvasData, userId: user._id.toString() },
          options
        )
        .catch(() => {});
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const status = error.message?.includes("permission") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
