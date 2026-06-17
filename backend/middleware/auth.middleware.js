import jwt from 'jsonwebtoken';
import redisClient from '../services/redis.service.js';
import userModel from '../models/user.model.js';

export const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // 🚀 Extract token directly from header safely
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : null;

        if (!token) {
            return res.status(401).send({ error: 'Unauthorized User - Token Missing' });
        }

        // Check if token is blacklisted (with graceful Redis error handling)
        let isBlackListed = false;
        try {
            isBlackListed = await redisClient.get(token);
        } catch (redisErr) {
            console.log('🟡 Redis unavailable, skipping blacklist check');
            // Continue without blacklist check if Redis is down
        }

        if (isBlackListed) {
            return res.status(401).send({ error: 'Unauthorized User - Blacklisted Token' });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch full user from database
        const user = await userModel.findById(decoded._id);
        
        if (!user) {
            return res.status(401).send({ error: 'Unauthorized User - User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.log("🔐 Token verification error:", error.message);
        res.status(401).send({ error: 'Unauthorized User - Invalid Token' });
    }
}
