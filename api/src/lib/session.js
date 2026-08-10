import { eq } from "drizzle-orm";
import { getTokenFromRequest } from "./auth.js";
import { db } from "./db.js";
import { users } from "./schema.js";

async function resolveUser(req, allowedRoles) {
  const session = getTokenFromRequest(req);
  if (!session) return { error: "Unauthorized", status: 401 };
  const dbUser = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!dbUser) return { error: "User not found", status: 404 };
  if (!dbUser.isActive) {
    return {
      error: "Account is deactivated. Contact an administrator for access.",
      status: 403,
    };
  }
  if (allowedRoles && !allowedRoles.includes(dbUser.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return { session, dbUser };
}

export { resolveUser };
