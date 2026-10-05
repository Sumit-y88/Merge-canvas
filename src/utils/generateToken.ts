import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

export const generateAccessToken = (userId: string) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  const secret = process.env.JWT_SECRET || "fallback_secret";
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    jwtid: crypto.randomUUID(),
  };

  return {
    token: jwt.sign({ id: userId, type: "access" }, secret, options),
    expiresIn,
  };
};

export const generateRefreshToken = (): string =>
  crypto.randomBytes(64).toString("base64url");
