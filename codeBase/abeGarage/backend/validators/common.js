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
  .transform((v) => (v === true || v === 1 || v === "1" ? 1 : 0));

const roleId = z.coerce
  .number()
  .int()
  .refine((v) => Object.values(ROLES).includes(v), "Unknown role");

// "" or null -> null; anything else must parse as a date
const optionalDate = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.coerce.date().nullable()
);

module.exports = { z, id, idParam, email, requiredText, optionalText, flag, roleId, optionalDate };
