import mongoose from "mongoose";

export interface IRefreshToken extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken: any =
  mongoose.models.RefreshToken || mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
