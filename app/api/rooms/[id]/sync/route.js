import { NextResponse } from "next/server";
import * as Y from "yjs";
import { requireAuth } from "@/src/lib/authMiddleware";
import { getRoomDoc, applyAndPersistUpdate } from "@/src/lib/yjsServer";
import { validateYjsUpdate } from "@/src/utils/payloadValidation";
import { getPusherServer } from "@/src/lib/pusherServer";

export async function GET(request, context) {
  try {
    await requireAuth(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const stateVector = searchParams.get("stateVector");

    const doc = await getRoomDoc(id);
    let missingUpdate = null;

    if (stateVector) {
      missingUpdate = Y.encodeStateAsUpdate(
        doc,
        Buffer.from(stateVector, "base64")
      );
    } else {
      missingUpdate = Y.encodeStateAsUpdate(doc);
    }

    return NextResponse.json(
      {
        ok: true,
        update: Buffer.from(missingUpdate).toString("base64"),
        stateVector: Buffer.from(Y.encodeStateVector(doc)).toString("base64"),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "Sync failed" },
      { status: 400 }
    );
  }
}

export async function POST(request, context) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const { update, socketId } = body || {};

    if (!update || typeof update !== "string") {
      return NextResponse.json(
        { ok: false, message: "Yjs update string is required" },
        { status: 400 }
      );
    }

    validateYjsUpdate(update);
    const result = await applyAndPersistUpdate(id, user._id, update);

    const pusher = getPusherServer();
    if (pusher) {
      const options = socketId ? { socket_id: socketId } : undefined;
      pusher
        .trigger(
          `presence-room-${id}`,
          "yjs:update",
          { update, userId: user._id.toString() },
          options
        )
        .catch(() => {});
    }

    return NextResponse.json(
      { ok: true, savedAt: result.savedAt },
      { status: 200 }
    );
  } catch (error) {
    const status = error.message?.includes("permission") ? 403 : 400;
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to apply update" },
      { status }
    );
  }
}
