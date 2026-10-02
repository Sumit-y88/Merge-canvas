import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { removeCollaborator } from "@/src/services/RoomService";

export async function DELETE(request, context) {
  try {
    const user = await requireAuth(request);
    const { id, userId } = await context.params;
    const room = await removeCollaborator(id, user._id, userId);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
