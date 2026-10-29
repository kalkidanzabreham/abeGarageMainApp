const { z } = require("zod");
const { ROLES } = require("../config/roles");

// path ids arrive as strings ("12"); coerce, then require a positive integer
const id = z.coerce.number().int().positive();
const idParam = (name = "id") => z.object({ [name]: id });

const email = z.string().trim().email().max(255);
const requiredText = (max = 255) => z.string().trim().min(1).max(max);
const optionalText = (max = 255) => z.string().trim().max(max).default("");

// HTML forms send checkboxes/flags as true/false, 0/1 or "0"/"1"
const flag = z
  .union([z.boolean(), z.literal(0), z.literal(1), z.enum(["0", "1"])])
  .transform((v) => (v === true || v === 1 || v === "1" ? 1 : 0))
  .meta({ description: "1 = yes, 0 = no (true/false and \"1\"/\"0\" are accepted)" });

const roleId = z.coerce
  .number()
  .int()
  .refine((v) => Object.values(ROLES).includes(v), "Unknown role");

// "" or null -> null; anything else must parse as a date
const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.coerce.date().nullable()
).meta({ description: "Date-time such as 2026-11-03T15:30; empty or null for none" });

// ?page=&page_size=&q= plus endpoint-specific filters. Strict: unknown
// query parameters are still rejected.
const listQuery = (filters = {}) =>
  z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      page_size: z.coerce.number().int().min(1).max(100).default(20),
      q: z.string().trim().min(1).max(100).optional(),
      ...filters,
    })
    .strict();

module.exports = { z, id, idParam, listQuery, email, requiredText, optionalText, flag, roleId, optionalDate };
