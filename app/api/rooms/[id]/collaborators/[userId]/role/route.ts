import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import { updateCollaboratorRole } from "@/src/services/RoomService";

export async function PATCH(request, context) {
  try {
    const user = await requireAuth(request);
    const { id, userId } = await context.params;
    const body = await request.json();
    const { role } = body || {};

    const room = await updateCollaboratorRole(id, user._id, userId, role);
    return NextResponse.json(room, { status: 200 });
  } catch (error) {
    const status = error.message?.includes("owner") ? 403 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
