/**
 * Authentication Middleware
 * Verifies JWT tokens and user permissions
 */

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }

        // TODO: Verify JWT token
        // TODO: Extract user information
        // TODO: Attach user to request object

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error.message,
        });
    }
};

const authorizeRole = (roles = []) => {
    return (req, res, next) => {
        try {
            // TODO: Check if user role is in allowed roles
            next();
        } catch (error) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized',
                error: error.message,
            });
        }
    };
};

module.exports = {
    verifyToken,
    authorizeRole,
};
