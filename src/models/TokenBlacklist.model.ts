import mongoose from "mongoose";

export interface ITokenBlacklist extends mongoose.Document {
  jti: string;
  expiresAt: Date;
  reason?: string;
}

const tokenBlacklistSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  reason: { type: String, default: "revoked" },
});

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist: any =
  mongoose.models.TokenBlacklist || mongoose.model("TokenBlacklist", tokenBlacklistSchema);
export default TokenBlacklist;
