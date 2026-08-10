import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env and set a strong secret.");
  }
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
function getSession(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  return verifyToken(token);
}
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return verifyToken(authHeader.slice(7));
  }
  const token = req.cookies?.token;
  if (token) return verifyToken(token);
  return null;
}
const isProd = process.env.NODE_ENV === "production";
// Cross-origin frontend/API (e.g. Vercel + Railway) needs SameSite=None; Secure
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 60 * 60 * 24 * 7 * 1e3,
  path: "/"
};
export {
  cookieOptions,
  getSession,
  getTokenFromRequest,
  signToken
};
