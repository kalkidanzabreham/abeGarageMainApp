import { forwardRef, useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

// A password field with a show/hide button. The button is type="button" so
// it never submits the form, and it says what it will do for screen readers.
const PasswordInput = forwardRef(function PasswordInput({ id, className = "", invalid = false, ...inputProps }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="gh-password">
      <input
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        className={`form-control ${invalid ? "is-invalid" : ""} ${className}`}
        {...inputProps}
      />
      <button
        type="button"
        className="gh-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? <LuEyeOff /> : <LuEye />}
      </button>
    </div>
  );
});

export default PasswordInput;
