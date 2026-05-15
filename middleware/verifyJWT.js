const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER VERIFY", authHeader);
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    console.log(authHeader); //Bearer token
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        console.log(decoded);
        req.user = decoded.user;

        next();
    });
}

module.exports = verifyJWT;