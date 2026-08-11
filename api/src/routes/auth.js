import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { users } from "../lib/schema.js";
import { signToken, cookieOptions, getSession } from "../lib/auth.js";
import { apiSuccess, apiError, createRouter } from "../lib/api.js";
import { formatUser } from "../lib/serialize.js";

const router = createRouter();

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return apiError(res, "Email and password are required");
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  if (!user) return apiError(res, "Invalid credentials", 401);
  if (!user.isActive) return apiError(res, "Account is deactivated", 403);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return apiError(res, "Invalid credentials", 401);
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  res.cookie("token", token, cookieOptions);
  return apiSuccess(res, { user: formatUser(user), token });
});

router.post("/register", async (req, res) => {
  const body = req.body ?? {};
  const { name, email, password, phone, agencyName } = body;
  const role = body.role || "customer";
  if (!name || !email || !password) return apiError(res, "Name, email, and password are required");
  if (password.length < 6) return apiError(res, "Password must be at least 6 characters");
  if (role === "admin") return apiError(res, "Cannot self-register as admin");
  if (role === "agency" && !agencyName) return apiError(res, "Agency name is required for agency registration");
  const existing = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  if (existing) return apiError(res, "Email already registered", 409);
  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      password: hashed,
      phone,
      role,
      agencyName,
      isActive: role === "customer",
    })
    .returning();
  const formatted = formatUser(user);
  if (!user.isActive) {
    return apiSuccess(res, { user: formatted, pendingApproval: true }, 201);
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  res.cookie("token", token, cookieOptions);
  return apiSuccess(res, { user: formatUser(user), token }, 201);
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const session = getSession(req);
  if (!session) return apiError(res, "Not authenticated", 401);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user) return apiError(res, "User not found", 404);
  return apiSuccess(res, formatUser(user));
});

export default router;
