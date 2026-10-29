import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { login } from "../../../services/login.service";

const WAKE_MESSAGE_AFTER_MS = 5000;

function LoginForm() {
  const [email_error, set_email] = useState("");
  const [server_error, set_server_error] = useState("");
  const [password_error, set_password] = useState("");
  const [succes_message, set_succes_message] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // shown when the API is slow to answer: a free-tier host that went to
  // sleep can take about a minute to start again
  const [waking, setWaking] = useState(false);
  const location = useLocation();
  // ProtectedRoute sends users here with state.from = the page they wanted
  const redirect = location.state?.from?.pathname || "/admin";

  // **Handle Normal Login**
  const handleSubmit = async (e) => {
    e.preventDefault();
    set_email("");
    set_server_error("");
    set_password("");

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    let valid = true;

    const email_regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (!data.employee_email) {
      set_email("Email is required");
      valid = false;
    } else if (!email_regex.test(data.employee_email)) {
      set_email("Email is invalid");
      valid = false;
    }

    if (!data.employee_password) {
      set_password("Password is required");
      valid = false;
    } else if (data.employee_password.length < 6) {
      set_password("Password must be at least 6 characters");
      valid = false;
    }

    if (!valid) return;

    setSubmitting(true);
    const wakeTimer = setTimeout(() => setWaking(true), WAKE_MESSAGE_AFTER_MS);
    try {
      const response = await login(data);
      if (response.status === "success") {
        set_succes_message(true);
        localStorage.setItem("Our-token", JSON.stringify(response.token));
        // full reload so AuthContext re-reads the new token
        window.location.replace(redirect);
      } else {
        set_server_error(response.message);
      }
    } catch (error) {
      set_server_error("Login failed. Please try again.");
    } finally {
      clearTimeout(wakeTimer);
      setWaking(false);
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-section">
      <div className="auto-container">
        <div className="contact-title">
          <h2>Login to your account</h2>
        </div>
        <div className="row clearfix">
          <div className="form-column col-lg-7">
            <div className="inner-column">
              <div className="contact-form">
                <form onSubmit={handleSubmit}>
                  <div className="row clearfix">
                    <div className="form-group col-md-12">
                      {server_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {server_error}
                        </div>
                      )}
                      <input
                        type="email"
                        name="employee_email"
                        placeholder="Email"
                      />
                      {email_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {email_error}
                        </div>
                      )}
                    </div>
                    <div className="form-group col-md-12">
                      <input
                        type="password"
                        name="employee_password"
                        placeholder="Password"
                      />
                      {password_error && (
                        <div
                          className="validation_error"
                          style={{ color: "red" }}
                        >
                          {password_error}
                        </div>
                      )}
                    </div>
                    <div className="d-flex">
                      <div className="form-group col-md-12 d-flex">
                        <button
                          className="theme-btn btn-style-one w-100"
                          type="submit"
                          disabled={submitting}
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                {waking && (
                  <div className="text-muted mt-2" role="status">
                    Waking up the demo server, this can take up to a minute
                  </div>
                )}
                {succes_message && (
                  <div className="success_message">
                    Employee logged in successfully!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoginForm;
