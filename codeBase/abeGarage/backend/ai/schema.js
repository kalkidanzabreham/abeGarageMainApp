// The job-card draft the model must return. Everything the model says is
// validated against this before anyone sees it; nothing here is written to
// the database (the person creating the order decides what to save).
const { z } = require("zod");

// Fixed vocabulary so drafts can be compared and evaluated.
const SYSTEMS = Object.freeze([
  "brakes", "suspension", "steering", "tires_wheels", "engine", "transmission",
  "electrical", "battery", "cooling", "exhaust", "fuel", "hvac", "body", "other",
]);
const URGENCY = Object.freeze(["low", "medium", "high"]);

const JobDraft = z
  .object({
    suspected_systems: z.array(z.enum(SYSTEMS)).max(6),
    suggested_services: z
      .array(
        z
          .object({
            service_id: z.number().int().positive(),
            reason: z.string().max(300),
          })
          .strict()
      )
      .max(8),
    urgency: z.enum(URGENCY),
    questions_to_ask_customer: z.array(z.string().min(1).max(300)).max(5),
    confidence: z.number().min(0).max(1),
  })
  .strict();

// JSON Schema handed to providers that support constrained decoding.
// Only the structural parts: some providers reject numeric/length limits,
// which are enforced by JobDraft afterwards anyway.
const JOB_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["suspected_systems", "suggested_services", "urgency", "questions_to_ask_customer", "confidence"],
  properties: {
    suspected_systems: { type: "array", items: { type: "string", enum: [...SYSTEMS] } },
    suggested_services: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["service_id", "reason"],
        properties: { service_id: { type: "integer" }, reason: { type: "string" } },
      },
    },
    urgency: { type: "string", enum: [...URGENCY] },
    questions_to_ask_customer: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
};

module.exports = { JobDraft, JOB_DRAFT_JSON_SCHEMA, SYSTEMS, URGENCY };
