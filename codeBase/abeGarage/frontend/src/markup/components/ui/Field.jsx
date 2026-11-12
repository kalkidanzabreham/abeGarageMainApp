// A labelled form field with an optional hint and inline error.
// `as` = "input" (default), "textarea" or "select"; other props go to the
// control. The id defaults to the name, so the label is always linked.
export default function Field({ label, name, id, error, hint, as: Control = "input", className = "", children, ...props }) {
  const fieldId = id || name;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  const controlClass = Control === "select" ? "form-select" : "form-control";
  return (
    <div className={`gh-field ${className}`}>
      <label htmlFor={fieldId} className="form-label">
        {label}
      </label>
      <Control
        id={fieldId}
        name={name}
        className={`${controlClass} ${error ? "is-invalid" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </Control>
      {hint && !error && (
        <div id={`${fieldId}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${fieldId}-error`} className="gh-field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// A form in a card, with a footer row for the buttons.
export function FormCard({ onSubmit, children, footer, className = "" }) {
  return (
    <form onSubmit={onSubmit} noValidate className={`gh-card gh-form-card ${className}`}>
      <div className="gh-form-grid">{children}</div>
      {footer && <div className="gh-form-footer">{footer}</div>}
    </form>
  );
}
