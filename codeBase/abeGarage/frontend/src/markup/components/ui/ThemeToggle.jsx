import { LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "../../../Context/ThemeContext";

// One button: switches between light and dark. (Until the first click the
// app follows the operating system's setting.)
export default function ThemeToggle({ className = "" }) {
  const { resolved, setMode } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={`gh-icon-btn ${className}`}
      onClick={() => setMode(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {resolved === "dark" ? <LuSun /> : <LuMoon />}
    </button>
  );
}
