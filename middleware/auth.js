// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate user middleware
exports.authenticateUser = async (req, res, next) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required. Please log in.' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || "a6c3157c166681b32be2f0d6b97c734471f6a1bb69f322e7e71d36bb363863fe"
        );
        
        // Find user
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found or token is invalid' 
            });
        }
        
        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please log in again.' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token. Please log in again.' 
            });
        }
        
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    // If you don't have an isAdmin field in your User model,
    // you'll need to add it or use another approach
    if (!req.user.isAdmin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Admin privileges required.' 
        });
    }
    next();
};