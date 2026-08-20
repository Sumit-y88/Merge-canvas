
import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        role: {
            type: String,
            enum: ["owner", "editor", "viewer"],
            default: "editor",
        },
    },
    { _id: false }
);

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Room name is required"],
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        collaborators: [collaboratorSchema],
        inviteCode: {
            // shareable code/link identifier
            type: String,
            required: true,
            unique: true,
        },
        isPublic: {
            // if true, anyone with the link can join as viewer/editor
            type: Boolean,
            default: false,
        },
        defaultJoinRole: {
            type: String,
            enum: ["editor", "viewer"],
            default: "editor",
        },

        // --- Yjs / CRDT state persistence ---
        yjsState: {
            // stores the serialized Yjs document as a binary snapshot
            type: Buffer,
            default: null,
        },
        lastSyncedAt: {
            type: Date,
            default: null,
        },
        canvasData: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
        canvasSavedAt: {
            type: Date,
            default: null,
        },

        thumbnailUrl: {
            // optional: preview image of canvas for dashboard room cards
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Fast lookup by invite code when someone joins via link

const Room = mongoose.model("Room", roomSchema);
export default Room;
