import { apiFetch } from "./api";

// null when the feature is switched off (the API has no /api/ai routes)
const getAiStatus = async () => {
  const res = await apiFetch("/ai/status", { method: "GET" });
  if (res.status === 404 || res.status === 403) return null;
  return res.json();
};

// -> { ok, status, body }; body is { draft, meta } or { code, message }
const draftJobCard = async (complaint) => {
  const res = await apiFetch("/ai/intake", { method: "POST", body: JSON.stringify({ complaint }) });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
};

export { getAiStatus, draftJobCard };
