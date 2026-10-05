import mongoose from "mongoose";

export interface ICollaborator {
  user: mongoose.Types.ObjectId;
  role: "owner" | "editor" | "viewer";
}

export interface IRoom extends mongoose.Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  collaborators: ICollaborator[];
  inviteCode: string;
  isPublic: boolean;
  defaultJoinRole: "editor" | "viewer";
  yjsState: Buffer | null;
  lastSyncedAt: Date | null;
  canvasData: any;
  canvasSavedAt: Date | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
      type: String,
      required: true,
      unique: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    defaultJoinRole: {
      type: String,
      enum: ["editor", "viewer"],
      default: "editor",
    },
    yjsState: {
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
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Room: any = mongoose.models.Room || mongoose.model("Room", roomSchema);
export default Room;
