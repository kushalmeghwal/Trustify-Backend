import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: false, error: "Unauthorized, please provide a valid token" });
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ status: false, error: "Unauthorized please login and retry with token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ status: false, error: "Invalid Token" });
    }
};

