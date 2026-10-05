import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import connectDB from "./db";
import User, { type IUser } from "../models/User.model";
import TokenBlacklist from "../models/TokenBlacklist.model";

export interface DecodedAccessToken extends JwtPayload {
  id?: string;
  type?: string;
  jti?: string;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message = "Not authorized", statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export const getAuthenticatedUser = async (
  request: Request | NextRequest | { headers: { get(name: string): string | null } }
): Promise<IUser | null> => {
  await connectDB();

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || ""
    ) as DecodedAccessToken;

    if (
      decoded.type !== "access" ||
      !decoded.jti ||
      !decoded.id ||
      (await TokenBlacklist.exists({ jti: decoded.jti }))
    ) {
      return null;
    }

    const user = await (User.findById(decoded.id) as any).select("-password");
    return user || null;
  } catch {
    return null;
  }
};

export const requireAuth = async (
  request: Request | NextRequest | { headers: { get(name: string): string | null } }
): Promise<IUser> => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new AuthError("Not authorized", 401);
  }
  return user;
};
