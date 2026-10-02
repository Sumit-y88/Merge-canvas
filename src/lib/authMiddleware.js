import jwt from "jsonwebtoken";
import connectDB from "./db.js";
import User from "../models/User.model.js";
import TokenBlacklist from "../models/TokenBlacklist.model.js";

export const getAuthenticatedUser = async (request) => {
  await connectDB();

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (
      decoded.type !== "access" ||
      !decoded.jti ||
      (await TokenBlacklist.exists({ jti: decoded.jti }))
    ) {
      return null;
    }

    const user = await User.findById(decoded.id).select("-password");
    return user || null;
  } catch {
    return null;
  }
};

export const requireAuth = async (request) => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    const error = new Error("Not authorized");
    error.statusCode = 401;
    throw error;
  }
  return user;
};
