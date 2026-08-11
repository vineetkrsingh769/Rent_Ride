import { asc, eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { pricingCategories } from "../lib/schema.js";
import { apiSuccess, createRouter } from "../lib/api.js";
import { serializeId } from "../lib/serialize.js";

const router = createRouter();

router.get("/", async (_req, res) => {
  const categories = await db
    .select()
    .from(pricingCategories)
    .where(eq(pricingCategories.isActive, true))
    .orderBy(asc(pricingCategories.vehicleType), asc(pricingCategories.baseDailyRate));
  return apiSuccess(res, categories.map(serializeId));
});

export default router;
