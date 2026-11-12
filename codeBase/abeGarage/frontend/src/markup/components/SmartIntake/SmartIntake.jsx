import { useState } from "react";
import { Button, Form, Badge } from "react-bootstrap";
import { draftJobCard } from "../../../services/ai.service";
import { useAuth } from "../../../Context/AuthContext";
import { formatPrice } from "../../../util/money";

const URGENCY_STYLE = { high: "danger", medium: "warning", low: "secondary" };

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

  if (!aiStatus) return null; // feature off or not allowed for this role

  const maxChars = aiStatus.max_input_chars;
  const paused = !aiStatus.available;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
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

  return (
    <div className="selected-customer mb-4" data-testid="smart-intake">
      <h3>
        Smart job intake <Badge bg="info">AI draft</Badge>
      </h3>
      {paused ? (
        <p className="text-muted" role="status">
          Smart intake has reached today&apos;s limit and is paused. Please fill in the order manually; it will be back tomorrow.
        </p>
      ) : (
        <Form onSubmit={submit}>
          <Form.Group className="mb-2">
            <Form.Label>Customer&apos;s complaint, in their words</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="complaint"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder='e.g. "car shakes above 80 and there is a grinding noise when braking"'
            />
            <Form.Text muted>
              {Array.from(complaint).length}/{maxChars} characters; longer text is shortened.
            </Form.Text>
            <Form.Text as="p" muted className="mb-0" data-testid="ai-privacy-note">
              {aiStatus.external
                ? "The complaint text is sent to a third-party AI service (Google Gemini) to draft the job card. "
                : ""}
              Don&apos;t enter names, phone numbers or other personal details. The text itself is not stored.
            </Form.Text>
          </Form.Group>
          <Button type="submit" disabled={busy || !complaint.trim()}>
            {busy ? "Drafting..." : "Draft job card"}
          </Button>
        </Form>
      )}

      {error && (
        <p className="text-danger mt-2" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-3" data-testid="ai-draft">
          <p className="text-muted mb-2">
            This is a suggestion. Check it before using it; nothing is saved until the order is submitted.
          </p>
          {result.meta.truncated && (
            <p className="text-warning">The complaint was long and only its first {maxChars} characters were used.</p>
          )}
          <p>
            Urgency: <Badge bg={URGENCY_STYLE[result.draft.urgency]}>{result.draft.urgency}</Badge>{" "}
            · Confidence: {Math.round(result.draft.confidence * 100)}%
          </p>
          <p>
            Suspected systems:{" "}
            {result.draft.suspected_systems.length
              ? result.draft.suspected_systems.map((s) => <Badge key={s} bg="light" text="dark" className="me-1">{s.replace("_", " ")}</Badge>)
              : "none identified"}
          </p>
          <div>
            <strong>Suggested services (from your catalog)</strong>
            {result.draft.suggested_services.length === 0 && <p className="mb-1">None. Choose services manually.</p>}
            {result.draft.suggested_services.map((s) => (
              <Form.Check
                key={s.service_id}
                type="checkbox"
                id={`ai-service-${s.service_id}`}
                checked={checked.includes(s.service_id)}
                onChange={() => toggle(s.service_id)}
                label={`${s.service_name} (${formatPrice(s.service_price)})${s.reason ? `: ${s.reason}` : ""}`}
              />
            ))}
            {result.meta.dropped_services.length > 0 && (
              <p className="text-warning mb-1" data-testid="ai-dropped">
                {result.meta.dropped_services.length} suggestion(s) were not in the service catalog and were left out.
              </p>
            )}
          </div>
          {result.draft.questions_to_ask_customer.length > 0 && (
            <div className="mt-2">
              <strong>Questions to ask the customer</strong>
              <ul>
                {result.draft.questions_to_ask_customer.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {onApply && (
            <Button variant="success" className="me-2" onClick={() => onApply(checked)} disabled={checked.length === 0}>
              Add checked services to this order
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setResult(null)}>
            Discard draft
          </Button>
          <p className="text-muted small mt-2 mb-0">
            Drafted by {result.meta.provider}
            {result.meta.model ? ` (${result.meta.model})` : ""} in {(result.meta.latency_ms / 1000).toFixed(1)} s.
          </p>
        </div>
      )}
    </div>
  );
}

export default SmartIntake;
