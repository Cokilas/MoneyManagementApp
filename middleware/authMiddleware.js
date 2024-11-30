const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // If no token is provided access is denied
    if (!token){
        return res.status(401).json({message: 'Access denied. No token provided.'});
    }

    // Verift token using key and add user to the request obj and handles invalid tokens
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({message: 'Invalid token.'});
    }
};

module.exports = authenticateToken;