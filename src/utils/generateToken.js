import crypto from "crypto";
import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
    return {
        token: jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, {
            expiresIn,
            jwtid: crypto.randomUUID(),
        }),
        expiresIn,
    };
};

export const generateRefreshToken = () => crypto.randomBytes(64).toString("base64url");
