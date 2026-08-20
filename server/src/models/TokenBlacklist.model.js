import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema({
    jti: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    reason: { type: String, default: "revoked" },
});

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("TokenBlacklist", tokenBlacklistSchema);
