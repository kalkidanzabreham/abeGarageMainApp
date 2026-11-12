import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { GearSpinner } from "../ui/garage";
import { login } from "../../../services/login.service";
import PasswordInput from "../ui/PasswordInput";

const WAKE_MESSAGE_AFTER_MS = 5000;
const DEMO_EMAIL = "demo@garagehub.test";

function LoginForm() {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // shown when the API is slow to answer: a free-tier host that went to
  // sleep can take about a minute to start again
  const [waking, setWaking] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const location = useLocation();
  // ProtectedRoute sends users here with state.from = the page they wanted
  const redirect = location.state?.from?.pathname || "/admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setServerError("");

    const data = Object.fromEntries(new FormData(e.target).entries());
    let valid = true;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!data.employee_email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!emailRegex.test(data.employee_email)) {
      setEmailError("Email is invalid");
      valid = false;
    }
    if (!data.employee_password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (data.employee_password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    const wakeTimer = setTimeout(() => setWaking(true), WAKE_MESSAGE_AFTER_MS);
    try {
      const response = await login(data);
      if (response.status === "success") {
        localStorage.setItem("Our-token", JSON.stringify(response.token));
        // full reload so AuthContext re-reads the new token
        window.location.replace(redirect);
        return;
      }
      setServerError(response.message);
    } catch {
      setServerError("Login failed. Please try again.");
    } finally {
      clearTimeout(wakeTimer);
      setWaking(false);
      setSubmitting(false);
    }
  };

  const useDemo = () => {
    emailRef.current.value = DEMO_EMAIL;
    setEmailError("");
    passwordRef.current.focus();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="gh-login-form">
      {serverError && (
        <div className="gh-alert gh-alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="employee_email" className="form-label">
          Email
        </label>
        <input
          ref={emailRef}
          id="employee_email"
          type="email"
          name="employee_email"
          autoComplete="username"
          placeholder="you@garage.com"
          className={`form-control ${emailError ? "is-invalid" : ""}`}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && (
          <div id="email-error" className="gh-field-error">
            {emailError}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="employee_password" className="form-label">
          Password
        </label>
        <PasswordInput
          ref={passwordRef}
          id="employee_password"
          name="employee_password"
          autoComplete="current-password"
          placeholder="Your password"
          invalid={Boolean(passwordError)}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "password-error" : undefined}
        />
        {passwordError && (
          <div id="password-error" className="gh-field-error">
            {passwordError}
          </div>
        )}
      </div>

      <button className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2 py-2" type="submit" disabled={submitting}>
        {submitting ? <GearSpinner /> : null}
        Log in
        {!submitting && <LuArrowRight aria-hidden="true" />}
      </button>

      {waking && (
        <div className="gh-muted small mt-3 text-center" role="status">
          Waking up the demo server, this can take up to a minute
        </div>
      )}

      <div className="gh-login-demo">
        <span>Exploring GarageHub?</span>
        <button type="button" className="btn btn-link p-0" onClick={useDemo}>
          Use the demo account
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
