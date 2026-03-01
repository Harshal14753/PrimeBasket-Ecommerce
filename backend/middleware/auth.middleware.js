import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import ENV from '../lib/env.js'

export const authUser = async (req, res, next) => {
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
    
    if (!token){
        return res.status(401).json({ message: 'Unauthorized', code: 'NO_TOKEN' });
    }

    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.log('JWT verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Unauthorized', code: 'INVALID_TOKEN' });
    }
}

// ─────────────────────────────────────────────
// Allow only customers
// ─────────────────────────────────────────────
export const authCustomer = (req, res, next) => {
    if (req.user?.role !== 'customer') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Customers only.'
        });
    }
    next();
}

// ─────────────────────────────────────────────
// Allow only sellers (must also be verified by admin)
// ─────────────────────────────────────────────
export const authSeller = (req, res, next) => {
    if (req.user?.role !== 'seller') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Sellers only.'
        });
    }
    if (!req.user?.isVerified) {
        return res.status(403).json({
            success: false,
            message: 'Your seller account is pending admin approval.'
        });
    }
    next();
}

// ─────────────────────────────────────────────
// Allow only admins
// ─────────────────────────────────────────────
export const authAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admins only.'
        });
    }
    next();
}