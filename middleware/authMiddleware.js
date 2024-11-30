const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
	// Get token from header
	const authHeader = req.header('Authorization');

	// If no token is provided, deny access
	if (!authHeader) {
		return res
			.status(401)
			.json({ message: 'Access denied. No token provided.' });
	}

	// Split the header and check for Bearer prefix
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return res.status(401).json({ message: 'Invalid token format.' });
	}

	const token = parts[1];

	// Verify token using key and add user to the request obj and handles invalid tokens
	try {
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		next();
	} catch (err) {
		res.status(400).json({ message: 'Invalid token.', error: err.message });
	}
};

module.exports = authenticateToken;