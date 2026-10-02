import Pusher from "pusher-js";
import { getAuthToken } from "./api";

let pusherInstance = null;

export const getPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!key) {
    return null;
  }

  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    auth: {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    },
  });

  return pusherInstance;
};

export const connectRoomRealtime = (roomId, currentUser, handlers = {}) => {
  const pusher = getPusherClient();
  if (!pusher) {
    // If Pusher is not configured, trigger local fallback
    handlers.onConnectionStateChange?.("disconnected");
    return {
      channel: null,
      emitCursor: () => {},
      emitDraft: () => {},
      disconnect: () => {},
      getSocketId: () => null,
    };
  }

  // Update auth headers with the latest token
  pusher.config.auth = {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };

  const channelName = `presence-room-${roomId}`;
  const channel = pusher.subscribe(channelName);

  handlers.onConnectionStateChange?.("connecting");

  pusher.connection.bind("connected", () => {
    handlers.onConnectionStateChange?.("connected");
  });

  pusher.connection.bind("disconnected", () => {
    handlers.onConnectionStateChange?.("disconnected");
  });

  pusher.connection.bind("error", (err) => {
    handlers.onError?.(err);
  });

  channel.bind("pusher:subscription_succeeded", (members) => {
    handlers.onConnectionStateChange?.("connected");
    handlers.onSubscribed?.(members);
  });

  channel.bind("pusher:subscription_error", (error) => {
    handlers.onConnectionStateChange?.("disconnected");
    handlers.onError?.(error);
  });

  channel.bind("pusher:member_added", (member) => {
    handlers.onMemberJoined?.(member);
  });

  channel.bind("pusher:member_removed", (member) => {
    handlers.onMemberLeft?.(member);
  });

  // Ephemeral events (client events & server-fallback triggers)
  channel.bind("client-cursor-move", (data) => {
    handlers.onCursorUpdate?.(data);
  });
  channel.bind("cursor:update", (data) => {
    handlers.onCursorUpdate?.(data);
  });

  channel.bind("client-draft-stream", (data) => {
    handlers.onDraftUpdate?.(data);
  });
  channel.bind("draft:update", (data) => {
    handlers.onDraftUpdate?.(data);
  });

  channel.bind("yjs:update", (data) => {
    handlers.onYjsUpdate?.(data);
  });

  channel.bind("canvas:update", (data) => {
    handlers.onCanvasUpdate?.(data);
  });

  channel.bind("room:deleted", () => {
    handlers.onRoomDeleted?.();
  });

  return {
    channel,
    getSocketId: () => pusher.connection.socket_id,
    emitCursor: (point) => {
      if (!channel?.subscribed) return;
      channel.trigger("client-cursor-move", {
        userId: currentUser?._id || currentUser?.id,
        point,
        name: currentUser?.name || "Anonymous",
        color: currentUser?.avatarColor || "#DC2626",
      });
    },
    emitDraft: (draft) => {
      if (!channel?.subscribed) return;
      channel.trigger("client-draft-stream", {
        userId: currentUser?._id || currentUser?.id,
        name: currentUser?.name || "Anonymous",
        color: currentUser?.avatarColor || "#DC2626",
        draft,
      });
    },
    disconnect: () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    },
  };
};
