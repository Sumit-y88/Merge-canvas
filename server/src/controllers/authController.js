import { registerUser, loginUser, loginWithGoogle, refreshSession, revokeRefreshToken } from "../services/authService.js";
import { parseCookies, refreshCookieName } from "../utils/tokenUtils.js";
import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/TokenBlacklist.model.js";
import User from "../models/User.model.js";

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60 * 1000,
    path: "/api/auth",
});

const setRefreshCookie = (res, value, options = cookieOptions()) => {
    const parts = [`${refreshCookieName}=${encodeURIComponent(value)}`, `Path=${options.path}`, `Max-Age=${Math.floor(options.maxAge / 1000)}`, `SameSite=${options.sameSite}`];
    if (options.httpOnly) parts.push("HttpOnly");
    if (options.secure) parts.push("Secure");
    res.setHeader("Set-Cookie", parts.join("; "));
};

const sendSession = (res, session, status = 200) => {
    res.setHeader("Cache-Control", "no-store");
    setRefreshCookie(res, session.refreshToken);
    const { refreshToken, ...safeSession } = session;
    return res.status(status).json(safeSession);
};

const publicProfile = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
});

export const getProfile = async (req, res) => {
    res.status(200).json(publicProfile(req.user));
};

export const updateProfile = async (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const avatarColor = typeof req.body.avatarColor === "string" ? req.body.avatarColor.trim() : undefined;

    if (!name || name.length < 2 || name.length > 80) {
        return res.status(400).json({ message: "Name must be between 2 and 80 characters" });
    }
    if (avatarColor && !/^#[0-9a-f]{6}$/i.test(avatarColor)) {
        return res.status(400).json({ message: "Avatar color must be a valid hex color" });
    }

    req.user.name = name;
    if (avatarColor) req.user.avatarColor = avatarColor;
    await req.user.save();
    return res.status(200).json(publicProfile(req.user));
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
        return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
        return res.status(400).json({ message: "New password must be between 6 and 128 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !user.password || !(await user.comparePassword(currentPassword))) {
        return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
};

export const signup = async (req,res) => {
    const{name,email,password} = req.body;
    if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }
    try{
        const result = await registerUser(name,email,password);
        sendSession(res, result, 201);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req,res) => {
    const {email,password} = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }
    try{
        const result = await loginUser(email,password);
        sendSession(res, result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

export const googleLogin = async (req, res) => {
    const { credential } = req.body;
    if (typeof credential !== "string" || !credential) {
        return res.status(400).json({ message: "Google credential is required" });
    }

    try {
        const result = await loginWithGoogle(credential);
        return sendSession(res, result);
    } catch (error) {
        return res.status(401).json({ message: error.message || "Google login failed" });
    }
};

export const refresh = async (req, res) => {
    try {
        const token = parseCookies(req.headers.cookie)[refreshCookieName];
        sendSession(res, await refreshSession(token));
    } catch (error) {
        setRefreshCookie(res, "", { ...cookieOptions(), maxAge: 0 });
        res.status(401).json({ message: "Session expired" });
    }
};

export const logout = async (req, res) => {
    await revokeRefreshToken(parseCookies(req.headers.cookie)[refreshCookieName]);
    const accessToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
    if (accessToken) {
        try {
            const decoded = jwt.decode(accessToken);
            if (decoded?.jti && decoded.exp) await TokenBlacklist.updateOne({ jti: decoded.jti }, { jti: decoded.jti, expiresAt: new Date(decoded.exp * 1000), reason: "logout" }, { upsert: true });
        } catch { /* Logout remains successful even if the access token is malformed. */ }
    }
    setRefreshCookie(res, "", { ...cookieOptions(), maxAge: 0 });
    res.status(204).send();
};
