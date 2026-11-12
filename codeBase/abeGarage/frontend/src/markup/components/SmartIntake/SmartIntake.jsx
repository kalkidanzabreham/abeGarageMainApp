import { useState } from "react";
import { LuCircleAlert, LuMessageSquareText, LuPlus, LuSparkles, LuTrash2 } from "react-icons/lu";
import { draftJobCard } from "../../../services/ai.service";
import { useAuth } from "../../../Context/AuthContext";
import { formatPrice } from "../../../util/money";
import { GearSpinner } from "../ui/garage";

const URGENCY_PILL = { high: "gh-pill-red", medium: "gh-pill-amber", low: "" };

// Smart job intake: a customer's complaint -> a DRAFT job card.
// The AI only suggests; a person reviews it, ticks the services to keep and
// (in New Order) adds them to the order, which is saved by the normal
// Submit button. With no onApply (the try-it page) nothing can be saved.
function SmartIntake({ onApply }) {
  const { aiStatus, refreshAiStatus } = useAuth();
  const [complaint, setComplaint] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { draft, meta }
  const [checked, setChecked] = useState([]);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  if (!aiStatus) return null; // feature off or not allowed for this role

  const maxChars = aiStatus.max_input_chars;
  const paused = !aiStatus.available;
  const length = Array.from(complaint).length;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setApplied(false);
    setBusy(true);
    try {
      const { ok, status, body } = await draftJobCard(complaint);
      if (ok) {
        setResult(body);
        setChecked(body.draft.suggested_services.map((s) => s.service_id));
      } else {
        setError(body.message || "Smart intake is not available right now. Please fill in the order manually.");
        // the daily cap pauses the panel; "busy" (AI_BUSY) is temporary
        if (status === 503 && body.code === "AI_DAILY_CAP_REACHED") refreshAiStatus();
      }
    } catch {
      setError("Smart intake is not available right now. Please fill in the order manually.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const confidence = result ? Math.round(result.draft.confidence * 100) : 0;

  return (
    <section className="gh-card gh-intake" data-testid="smart-intake" aria-labelledby="intake-title">
      <div className="gh-intake-head">
        <span className="gh-icon-tile">
          <LuSparkles aria-hidden="true" />
        </span>
        <div>
          <h2 id="intake-title" className="h5 m-0">
            Smart job intake <span className="gh-pill gh-pill-amber ms-1">AI draft</span>
          </h2>
          <p className="gh-muted small m-0">Paste the customer&apos;s words; get suggested services from your catalog.</p>
        </div>
      </div>

      {paused ? (
        <div className="gh-alert gh-alert-amber mt-3 mb-0" role="status">
          Smart intake has reached today&apos;s limit and is paused. Please fill in the order manually; it will be back tomorrow.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3">
          <label htmlFor="intake-complaint" className="form-label">
            Customer&apos;s complaint, in their words
          </label>
          <div className="gh-intake-input">
            <LuMessageSquareText aria-hidden="true" />
            <textarea
              id="intake-complaint"
              rows={3}
              name="complaint"
              className="form-control"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="e.g. “car shakes above 80 and there is a grinding noise when braking”"
            />
          </div>
          <div className="d-flex flex-wrap justify-content-between gap-2 mt-1">
            <span className={`form-text m-0 ${length > maxChars ? "text-warning" : ""}`}>
              {length}/{maxChars} characters; longer text is shortened.
            </span>
          </div>
          <p className="gh-privacy" data-testid="ai-privacy-note">
            {aiStatus.external ? "The complaint text is sent to a third-party AI service (Google Gemini) to draft the job card. " : ""}
            Don&apos;t enter names, phone numbers or other personal details. The text itself is not stored.
          </p>
          <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy || !complaint.trim()}>
            {busy ? <GearSpinner /> : <LuSparkles aria-hidden="true" />}
            {busy ? "Drafting..." : "Draft job card"}
          </button>
        </form>
      )}

      {error && (
        <div className="gh-alert gh-alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="gh-draft gh-page" data-testid="ai-draft">
          <div className="gh-draft-banner">
            <LuCircleAlert aria-hidden="true" /> This is a suggestion. Check it before using it; nothing is saved until the order is submitted.
          </div>
          {result.meta.truncated && (
            <div className="gh-alert gh-alert-amber">The complaint was long and only its first {maxChars} characters were used.</div>
          )}

          <div className="gh-draft-meta">
            <p className="m-0">
              Urgency: <span className={`gh-pill ${URGENCY_PILL[result.draft.urgency] || ""}`}>{result.draft.urgency}</span>
            </p>
            <div className="gh-confidence">
              <span>Confidence: {confidence}%</span>
              <span className="gh-confidence-bar" aria-hidden="true">
                <span style={{ width: `${confidence}%` }} />
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="gh-draft-label">Suspected systems</div>
            {result.draft.suspected_systems.length ? (
              <div className="d-flex flex-wrap gap-1">
                {result.draft.suspected_systems.map((s) => (
                  <span key={s} className="gh-chip">
                    {s.replace("_", " ")}
                  </span>
                ))}
              </div>
            ) : (
              <span className="gh-muted">none identified</span>
            )}
          </div>

          <div className="mt-3">
            <div className="gh-draft-label">Suggested services (from your catalog)</div>
            {result.draft.suggested_services.length === 0 && <p className="gh-muted m-0">None. Choose services manually.</p>}
            <div className="gh-service-pick">
              {result.draft.suggested_services.map((s) => (
                <label key={s.service_id} htmlFor={`ai-service-${s.service_id}`} className={`gh-service-option ${checked.includes(s.service_id) ? "is-checked" : ""}`}>
                  <input id={`ai-service-${s.service_id}`} type="checkbox" className="form-check-input" checked={checked.includes(s.service_id)} onChange={() => toggle(s.service_id)} />
                  <span className="gh-service-option-main">
                    <strong>
                      {s.service_name} ({formatPrice(s.service_price)})
                    </strong>
                    {s.reason && <span className="gh-muted small">{s.reason}</span>}
                  </span>
                </label>
              ))}
            </div>
            {result.meta.dropped_services.length > 0 && (
              <p className="gh-alert gh-alert-amber mt-2 mb-0" data-testid="ai-dropped">
                {result.meta.dropped_services.length} suggestion(s) were not in the service catalog and were left out.
              </p>
            )}
          </div>

          {result.draft.questions_to_ask_customer.length > 0 && (
            <div className="mt-3">
              <div className="gh-draft-label">Questions to ask the customer</div>
              <ul className="gh-questions">
                {result.draft.questions_to_ask_customer.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="d-flex flex-wrap gap-2 mt-3">
            {onApply && (
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-2"
                onClick={() => {
                  onApply(checked);
                  setApplied(true);
                }}
                disabled={checked.length === 0}
              >
                <LuPlus aria-hidden="true" /> Add checked services to this order
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={() => setResult(null)}>
              <LuTrash2 aria-hidden="true" /> Discard draft
            </button>
          </div>
          {applied && (
            <p className="gh-muted small mt-2 mb-0" role="status">
              Added to the services below. Review them, then submit the order.
            </p>
          )}
          <p className="gh-muted small mt-2 mb-0">
            Drafted by {result.meta.provider}
            {result.meta.model ? ` (${result.meta.model})` : ""} in {(result.meta.latency_ms / 1000).toFixed(1)} s.
          </p>
        </div>
      )}
    </section>
  );
}

export default SmartIntake;
