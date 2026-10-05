import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/lib/authMiddleware";
import { getPusherServer } from "@/src/lib/pusherServer";
import Room from "@/src/models/Room.model";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { message: "Pusher is not configured on the server" },
        { status: 500 }
      );
    }

    let socketId;
    let channelName;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      socketId = body.socket_id;
      channelName = body.channel_name;
    } else {
      const formData = await request.formData();
      socketId = formData.get("socket_id");
      channelName = formData.get("channel_name");
    }

    if (!socketId || !channelName) {
      return NextResponse.json(
        { message: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Verify room access if it's a presence-room- channel
    if (channelName.startsWith("presence-room-")) {
      const roomId = channelName.replace("presence-room-", "");
      const room = await Room.findById(roomId).select("collaborators isPublic");
      if (!room) {
        return NextResponse.json({ message: "Room not found" }, { status: 404 });
      }

      const isMember = room.collaborators.some(
        (c) => c.user.toString() === user._id.toString()
      );
      if (!isMember && !room.isPublic) {
        return NextResponse.json(
          { message: "You are not a member of this room" },
          { status: 403 }
        );
      }
    }

    const presenceData = {
      user_id: user._id.toString(),
      user_info: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    };

    const authResponse = pusher.authorizeChannel(
      socketId,
      channelName,
      presenceData
    );

    return NextResponse.json(authResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Pusher authorization failed" },
      { status: 400 }
    );
  }
}
