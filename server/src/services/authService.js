    import User from "../models/User.model.js";
    import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
    import RefreshToken from "../models/RefreshToken.model.js";
    import { hashToken } from "../utils/tokenUtils.js";
    import { OAuth2Client } from "google-auth-library";

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const refreshLifetimeMs = () => Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60 * 1000;

    export const createSession = async (userId) => {
        const refreshToken = generateRefreshToken();
        await RefreshToken.create({
            user: userId,
            tokenHash: hashToken(refreshToken),
            expiresAt: new Date(Date.now() + refreshLifetimeMs()),
        });
        return { refreshToken, access: generateAccessToken(userId) };
    };

    const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

    export const registerUser = async (name, email, password) => {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("User already exists");
        }

        // Password gets hashed automatically by the model's pre-save hook
        const user = await User.create({ name, email, password });

        const session = await createSession(user._id);
        return {
            accessToken: session.access.token,
            refreshToken: session.refreshToken,
            user: publicUser(user),
        };
    };

    export const loginUser = async (email, password) => {
        // .select("+password") needed since password is select:false by default
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            throw new Error("Invalid email or password");
        }

        const session = await createSession(user._id);
        return {
            accessToken: session.access.token,
            refreshToken: session.refreshToken,
            user: publicUser(user),
        };
    };

    export const loginWithGoogle = async (credential) => {
        if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Google authentication is not configured");

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            throw new Error("Google account could not be verified");
        }

        const email = payload.email.toLowerCase();
        let user = await User.findOne({ googleId: payload.sub });

        if (!user) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error("An account with this email already exists. Sign in with your password first.");
            }

            user = await User.create({
                googleId: payload.sub,
                name: payload.name || email.split("@")[0],
                email,
            });
        }

        const session = await createSession(user._id);
        return {
            accessToken: session.access.token,
            refreshToken: session.refreshToken,
            user: publicUser(user),
        };
    };

    export const refreshSession = async (rawToken) => {
        if (!rawToken) throw new Error("Refresh token is required");
        const current = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
        if (!current) throw new Error("Refresh token is invalid");

        if (current.revokedAt || current.expiresAt <= new Date()) {
            // A reused rotated token invalidates every outstanding session for this user.
            if (current.revokedAt) await RefreshToken.updateMany({ user: current.user, revokedAt: null }, { revokedAt: new Date() });
            throw new Error("Refresh token is invalid");
        }

        const nextRawToken = generateRefreshToken();
        const nextHash = hashToken(nextRawToken);
        current.revokedAt = new Date();
        current.replacedByHash = nextHash;
        await current.save();
        await RefreshToken.create({ user: current.user, tokenHash: nextHash, expiresAt: new Date(Date.now() + refreshLifetimeMs()) });
        const user = await User.findById(current.user).select("-password");
        if (!user) throw new Error("User not found");
        return { accessToken: generateAccessToken(user._id).token, refreshToken: nextRawToken, user: publicUser(user) };
    };

    export const revokeRefreshToken = async (rawToken) => {
        if (rawToken) await RefreshToken.updateOne({ tokenHash: hashToken(rawToken), revokedAt: null }, { revokedAt: new Date() });
    };
