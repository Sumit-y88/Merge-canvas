import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import TokenBlacklist from '../models/TokenBlacklist.model.js';

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== "access" || !decoded.jti || await TokenBlacklist.exists({ jti: decoded.jti })) {
            return res.status(401).json({ message: "Not authorized, token revoked" });
        }
        const user = await User.findById(
            decoded.id
        ).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
}

export default protect;
