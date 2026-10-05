import Pusher from "pusher-js";
import api, { getAuthToken } from "./api";

let pusherInstance: Pusher | null = null;

export interface RealtimeHandlers {
  onConnectionStateChange?: (state: string) => void;
  onError?: (err: any) => void;
  onSubscribed?: (members?: any) => void;
  onMemberJoined?: (member: any) => void;
  onMemberLeft?: (member: any) => void;
  onCursorUpdate?: (data: any) => void;
  onDraftUpdate?: (data: any) => void;
  onYjsUpdate?: (data: any) => void;
  onCanvasUpdate?: (data: any) => void;
  onRoomDeleted?: () => void;
  [key: string]: any;
}

export interface RealtimeConnection {
  channel: any;
  clientId: string;
  getSocketId: () => string | undefined;
  emitCursor: (point: { x: number; y: number }) => void;
  emitDraft: (draft: any) => void;
  disconnect: () => void;
}

export const getPusherClient = (): Pusher | null => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

  if (!key) {
    return null;
  }

  if (pusherInstance) return pusherInstance;

  pusherInstance = new Pusher(key, {
    cluster,
    channelAuthorization: {
      transport: "ajax",
      endpoint: "/api/pusher/auth",
      customHandler: ({ socketId, channelName }, callback) => {
        api
          .post("/pusher/auth", {
            socket_id: socketId,
            channel_name: channelName,
          })
          .then((res) => callback(null, res.data))
          .catch((err) => {
            console.error(
              "[Pusher] Authorization failed:",
              err?.response?.data?.message || err?.message || err
            );
            callback(err, null);
          });
      },
    },
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: (err: any, data: any) => void) => {
        api
          .post("/pusher/auth", {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((res) => callback(null, res.data))
          .catch((err) => {
            console.error(
              "[Pusher] Authorizer failed:",
              err?.response?.data?.message || err?.message || err
            );
            callback(err, null);
          });
      },
    }),
  });

  return pusherInstance;
};

export const connectRoomRealtime = (
  roomId: string,
  currentUser: any,
  handlers: RealtimeHandlers = {}
): RealtimeConnection => {
  const clientId = `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
  const pusher = getPusherClient();

  if (!pusher) {
    handlers.onConnectionStateChange?.("disconnected");
    return {
      channel: null,
      clientId,
      emitCursor: () => {},
      emitDraft: () => {},
      disconnect: () => {},
      getSocketId: () => undefined,
    };
  }

  if (pusher.connection.state === "disconnected" || pusher.connection.state === "failed") {
    pusher.connect();
  }

  const channelName = `presence-room-${roomId}`;
  const channel = pusher.subscribe(channelName);

  handlers.onConnectionStateChange?.("connecting");

  pusher.connection.bind("connected", () => {
    handlers.onConnectionStateChange?.("connected");
  });

  pusher.connection.bind("disconnected", () => {
    handlers.onConnectionStateChange?.("disconnected");
  });

  pusher.connection.bind("error", (err: any) => {
    console.error("[Pusher] Connection error:", err);
    handlers.onError?.(err);
  });

  if (channel.subscribed) {
    handlers.onConnectionStateChange?.("connected");
    handlers.onSubscribed?.((channel as any).members);
  }

  channel.bind("pusher:subscription_succeeded", (members: any) => {
    handlers.onConnectionStateChange?.("connected");
    handlers.onSubscribed?.(members);
  });

  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("[Pusher] Subscription error:", error);
    handlers.onConnectionStateChange?.("disconnected");
    handlers.onError?.(error);
  });

  channel.bind("pusher:member_added", (member: any) => {
    handlers.onMemberJoined?.(member);
  });

  channel.bind("pusher:member_removed", (member: any) => {
    handlers.onMemberLeft?.(member);
  });

  channel.bind("client-cursor-move", (data: any) => {
    handlers.onCursorUpdate?.(data);
  });
  channel.bind("cursor:update", (data: any) => {
    handlers.onCursorUpdate?.(data);
  });

  channel.bind("client-draft-stream", (data: any) => {
    handlers.onDraftUpdate?.(data);
  });
  channel.bind("draft:update", (data: any) => {
    handlers.onDraftUpdate?.(data);
  });

  channel.bind("yjs:update", (data: any) => {
    handlers.onYjsUpdate?.(data);
  });

  channel.bind("canvas:update", (data: any) => {
    handlers.onCanvasUpdate?.(data);
  });

  channel.bind("room:deleted", () => {
    handlers.onRoomDeleted?.();
  });

  let cursorInFlight = false;
  let nextCursorPoint: { x: number; y: number } | null = null;

  const sendCursor = (point: { x: number; y: number }) => {
    cursorInFlight = true;
    const payload = {
      clientId,
      userId: (currentUser?.id || currentUser?._id)?.toString(),
      point,
      name: currentUser?.name || "Collaborator",
      color: currentUser?.avatarColor || "#DC2626",
    };

    // If client events are explicitly enabled via env flag, use direct websocket trigger
    if (process.env.NEXT_PUBLIC_ENABLE_PUSHER_CLIENT_EVENTS === "true" && channel?.subscribed) {
      channel.trigger("client-cursor-move", payload);
      cursorInFlight = false;
      return;
    }

    // Default safe broadcast route: server endpoint (avoids Pusher client-event disabled errors)
    api
      .post(`/rooms/${roomId}/events`, {
        event: "cursor:update",
        socketId: pusher.connection.socket_id,
        data: payload,
      })
      .catch(() => {})
      .finally(() => {
        cursorInFlight = false;
        if (nextCursorPoint) {
          const p = nextCursorPoint;
          nextCursorPoint = null;
          sendCursor(p);
        }
      });
  };

  let draftInFlight = false;
  let nextDraft: any = null;

  const sendDraft = (draft: any) => {
    draftInFlight = true;
    const payload = {
      clientId,
      userId: (currentUser?.id || currentUser?._id)?.toString(),
      name: currentUser?.name || "Collaborator",
      color: currentUser?.avatarColor || "#DC2626",
      draft,
    };

    if (process.env.NEXT_PUBLIC_ENABLE_PUSHER_CLIENT_EVENTS === "true" && channel?.subscribed) {
      channel.trigger("client-draft-stream", payload);
      draftInFlight = false;
      return;
    }

    api
      .post(`/rooms/${roomId}/events`, {
        event: "draft:update",
        socketId: pusher.connection.socket_id,
        data: payload,
      })
      .catch(() => {})
      .finally(() => {
        draftInFlight = false;
        if (nextDraft !== null) {
          const d = nextDraft;
          nextDraft = null;
          sendDraft(d);
        }
      });
  };

  return {
    channel,
    clientId,
    getSocketId: () => pusher.connection.socket_id,
    emitCursor: (point: { x: number; y: number }) => {
      if (cursorInFlight) {
        nextCursorPoint = point;
        return;
      }
      sendCursor(point);
    },
    emitDraft: (draft: any) => {
      if (draftInFlight) {
        nextDraft = draft;
        return;
      }
      sendDraft(draft);
    },
    disconnect: () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    },
  };
};
