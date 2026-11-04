// Turns raw model text into a validated JobDraft.
//
// 1. Strict: JSON.parse + schema. Accepted as-is.
// 2. Bounded repair: a fixed list of text fixes, then value fixes, each
//    applied at most once and recorded with a reason code. No eval, no
//    guessing of missing data: a missing required field is not invented.
// 3. If it still doesn't validate: a failure with a reason code. The caller
//    decides whether to retry.
const { JobDraft, SYSTEMS, URGENCY } = require("./schema");

const MAX_OUTPUT_CHARS = 20000;

// Reason codes (counted in logs and the eval report).
const REPAIR = Object.freeze({
  STRIPPED_CODE_FENCE: "STRIPPED_CODE_FENCE",
  EXTRACTED_OBJECT: "EXTRACTED_OBJECT",
  SMART_QUOTES: "SMART_QUOTES",
  TRAILING_COMMAS: "TRAILING_COMMAS",
  CLOSED_TRUNCATED_JSON: "CLOSED_TRUNCATED_JSON",
  UNWRAPPED_KEY: "UNWRAPPED_KEY",
  DROPPED_EXTRA_KEYS: "DROPPED_EXTRA_KEYS",
  NORMALIZED_URGENCY: "NORMALIZED_URGENCY",
  CONFIDENCE_PERCENT: "CONFIDENCE_PERCENT",
  CONFIDENCE_STRING: "CONFIDENCE_STRING",
  STRING_TO_ARRAY: "STRING_TO_ARRAY",
  NORMALIZED_SYSTEMS: "NORMALIZED_SYSTEMS",
  UNKNOWN_SYSTEM_DROPPED: "UNKNOWN_SYSTEM_DROPPED",
  SERVICE_ID_STRING: "SERVICE_ID_STRING",
  SERVICES_AS_IDS: "SERVICES_AS_IDS",
  SERVICE_MATCHED_BY_NAME: "SERVICE_MATCHED_BY_NAME",
  MISSING_REASON: "MISSING_REASON",
  TRIMMED_LIST: "TRIMMED_LIST",
});
const FAILURE = Object.freeze({
  EMPTY_OUTPUT: "EMPTY_OUTPUT",
  OUTPUT_TOO_LARGE: "OUTPUT_TOO_LARGE",
  NO_JSON_OBJECT: "NO_JSON_OBJECT",
  INVALID_JSON: "INVALID_JSON",
  SCHEMA_MISMATCH: "SCHEMA_MISMATCH",
});

const EXPECTED_KEYS = ["suspected_systems", "suggested_services", "urgency", "questions_to_ask_customer", "confidence"];
const LIST_LIMITS = { suspected_systems: 6, suggested_services: 8, questions_to_ask_customer: 5 };
const SYSTEM_SYNONYMS = {
  brake: "brakes", tire: "tires_wheels", tires: "tires_wheels", tyre: "tires_wheels", tyres: "tires_wheels",
  wheels: "tires_wheels", wheel: "tires_wheels", tires_and_wheels: "tires_wheels", ac: "hvac",
  air_conditioning: "hvac", heating: "hvac", electrics: "electrical", engine_cooling: "cooling",
};

// ---------- text-level helpers ----------

// Index of the brace that closes the object starting at `start`, or -1
// (string-aware, so braces inside strings don't count).
const matchingBrace = (text, start) => {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
};

// Remove commas directly before } or ] (outside strings).
const removeTrailingCommas = (text) => {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i] ?? "";
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    if (c === ",") {
      const rest = text.slice(i + 1).trimStart();
      if (rest.startsWith("}") || rest.startsWith("]")) continue;
    }
    out += c;
  }
  return out;
};

// Close an object that was cut off mid-way (unterminated string, then the
// open arrays/objects in reverse order). Drops a dangling key or comma.
const closeTruncated = (text) => {
  const stack = [];
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") stack.pop();
  }
  if (!inString && stack.length === 0) return text;
  let out = inString ? `${text}"` : text;
  out = out.replace(/,\s*$/, "").replace(/,\s*"[^"]*"\s*:?\s*$/, "").replace(/:\s*$/, ": null");
  return out + stack.reverse().join("");
};

// ---------- value-level helpers ----------

const normalizeSystem = (value) => {
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/&/g, "and");
  return SYSTEM_SYNONYMS[key] || key;
};

const repairValues = (input, catalog, repairs) => {
  let obj = input;
  const note = (code) => !repairs.includes(code) && repairs.push(code);
  const dropped = { systems: [], services: [] };

  // {"job_card": {...}} -> {...}
  const keys = Object.keys(obj);
  if (keys.length === 1 && obj[keys[0]] && typeof obj[keys[0]] === "object" && !Array.isArray(obj[keys[0]])) {
    const inner = obj[keys[0]];
    if (EXPECTED_KEYS.some((k) => k in inner)) {
      obj = inner;
      note(REPAIR.UNWRAPPED_KEY);
    }
  }
  obj = { ...obj };

  const extra = Object.keys(obj).filter((k) => !EXPECTED_KEYS.includes(k));
  if (extra.length) {
    for (const k of extra) delete obj[k];
    note(REPAIR.DROPPED_EXTRA_KEYS);
  }

  for (const field of ["suspected_systems", "questions_to_ask_customer", "suggested_services"]) {
    if (typeof obj[field] === "string") {
      obj[field] = obj[field].trim() ? [obj[field]] : [];
      note(REPAIR.STRING_TO_ARRAY);
    }
  }

  if (typeof obj.urgency === "string") {
    const u = obj.urgency.trim().toLowerCase();
    if (u !== obj.urgency && URGENCY.includes(u)) {
      obj.urgency = u;
      note(REPAIR.NORMALIZED_URGENCY);
    }
  }

  if (typeof obj.confidence === "string" && obj.confidence.trim() !== "") {
    const n = Number(obj.confidence.trim().replace(/%$/, ""));
    if (Number.isFinite(n)) {
      obj.confidence = obj.confidence.trim().endsWith("%") ? n / 100 : n;
      note(REPAIR.CONFIDENCE_STRING);
    }
  }
  if (typeof obj.confidence === "number" && obj.confidence > 1 && obj.confidence <= 100) {
    obj.confidence = obj.confidence / 100;
    note(REPAIR.CONFIDENCE_PERCENT);
  }

  if (Array.isArray(obj.suspected_systems)) {
    const out = [];
    for (const s of obj.suspected_systems) {
      if (typeof s !== "string") continue;
      const n = normalizeSystem(s);
      if (n !== s) note(REPAIR.NORMALIZED_SYSTEMS);
      if (SYSTEMS.includes(n)) {
        if (!out.includes(n)) out.push(n);
      } else {
        dropped.systems.push(s);
        note(REPAIR.UNKNOWN_SYSTEM_DROPPED);
      }
    }
    obj.suspected_systems = out;
  }

  if (Array.isArray(obj.suggested_services)) {
    const byName = new Map((catalog || []).map((c) => [c.service_name.trim().toLowerCase(), c.service_id]));
    const out = [];
    for (let item of obj.suggested_services) {
      if (typeof item === "number" || (typeof item === "string" && /^\d+$/.test(item.trim()))) {
        item = { service_id: Number(item), reason: "" };
        note(REPAIR.SERVICES_AS_IDS);
      }
      if (!item || typeof item !== "object") continue;
      const entry = { ...item };
      if (typeof entry.service_id === "string" && /^\d+$/.test(entry.service_id.trim())) {
        entry.service_id = Number(entry.service_id);
        note(REPAIR.SERVICE_ID_STRING);
      }
      if (entry.service_id === undefined) {
        const name = entry.service_name ?? entry.name;
        const id = typeof name === "string" ? byName.get(name.trim().toLowerCase()) : undefined;
        if (id === undefined) {
          dropped.services.push({ value: name ?? null, reason: "unknown service name" });
          continue;
        }
        entry.service_id = id;
        note(REPAIR.SERVICE_MATCHED_BY_NAME);
      }
      if (typeof entry.reason !== "string") {
        entry.reason = "";
        note(REPAIR.MISSING_REASON);
      }
      out.push({ service_id: entry.service_id, reason: entry.reason });
    }
    obj.suggested_services = out;
  }

  for (const [field, max] of Object.entries(LIST_LIMITS)) {
    if (Array.isArray(obj[field]) && obj[field].length > max) {
      obj[field] = obj[field].slice(0, max);
      note(REPAIR.TRIMMED_LIST);
    }
  }
  return { obj, dropped };
};

const schemaIssues = (error) => error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);

// Main entry. catalog: [{ service_id, service_name }] (used only to resolve
// services the model named instead of numbering).
const parseModelOutput = (raw, { catalog } = {}) => {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { ok: false, code: FAILURE.EMPTY_OUTPUT, repairs: [] };
  }
  if (raw.length > MAX_OUTPUT_CHARS) {
    return { ok: false, code: FAILURE.OUTPUT_TOO_LARGE, repairs: [] };
  }

  // 1. strict
  try {
    const strict = JobDraft.safeParse(JSON.parse(raw));
    if (strict.success) {
      return { ok: true, stage: "strict", draft: strict.data, repairs: [], dropped: { systems: [], services: [] } };
    }
  } catch {
    // not JSON as-is; fall through to repair
  }

  // 2. bounded repair
  const repairs = [];
  let text = raw.trim();

  const fenced = text.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
  if (fenced) {
    text = fenced[1].trim();
    repairs.push(REPAIR.STRIPPED_CODE_FENCE);
  }

  const start = text.indexOf("{");
  if (start === -1) {
    return { ok: false, code: FAILURE.NO_JSON_OBJECT, repairs };
  }
  const end = matchingBrace(text, start);
  const objectText = end === -1 ? text.slice(start) : text.slice(start, end + 1);
  if (objectText.length !== text.length) repairs.push(REPAIR.EXTRACTED_OBJECT);
  text = objectText;

  const unquoted = text.replace(/[“”„‟]/g, '"').replace(/[‘’]/g, "'");
  if (unquoted !== text) {
    text = unquoted;
    repairs.push(REPAIR.SMART_QUOTES);
  }

  const noTrailing = removeTrailingCommas(text);
  if (noTrailing !== text) {
    text = noTrailing;
    repairs.push(REPAIR.TRAILING_COMMAS);
  }

  if (end === -1) {
    const closed = closeTruncated(text);
    if (closed !== text) {
      text = closed;
      repairs.push(REPAIR.CLOSED_TRUNCATED_JSON);
    }
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch (err) {
    return { ok: false, code: FAILURE.INVALID_JSON, repairs, detail: err.message.slice(0, 200) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, code: FAILURE.SCHEMA_MISMATCH, repairs, detail: "top level is not an object" };
  }

  const { obj, dropped } = repairValues(value, catalog, repairs);
  const result = JobDraft.safeParse(obj);
  if (!result.success) {
    return { ok: false, code: FAILURE.SCHEMA_MISMATCH, repairs, detail: schemaIssues(result.error).join("; ") };
  }
  return { ok: true, stage: "repaired", draft: result.data, repairs, dropped };
};

module.exports = { parseModelOutput, REPAIR, FAILURE, MAX_OUTPUT_CHARS };
