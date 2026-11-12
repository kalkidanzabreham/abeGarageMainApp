import { Link } from "react-router-dom";
import { LuArrowLeft, LuClipboardList, LuShieldCheck, LuSparkles } from "react-icons/lu";
import LoginForm from "../components/LoginForm/LoginForm";
import Brand from "../components/ui/Brand";
import ThemeToggle from "../components/ui/ThemeToggle";

const POINTS = [
  { icon: LuSparkles, title: "AI-drafted job cards", text: "Turn a customer's words into suggested services you confirm." },
  { icon: LuClipboardList, title: "Every order in one place", text: "From received to completed, with a tracking link for the customer." },
  { icon: LuShieldCheck, title: "The right access for each role", text: "Admins, managers and mechanics see what their job needs." },
];

function Login() {
  return (
    <div className="gh-auth">
      <aside className="gh-auth-panel" aria-hidden="false">
        <div className="gh-auth-panel-inner">
          <Brand light />
          <div className="gh-auth-pitch">
            <h1>Run your workshop from one place.</h1>
            <ul className="gh-auth-points gh-stagger">
              {POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="gh-auth-point-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="gh-auth-panel-foot">Staff access only. Customers can track an order without logging in.</div>
        </div>
        <div className="gh-auth-glow" />
      </aside>

      <main className="gh-auth-main">
        <div className="gh-auth-top">
          <Link to="/" className="gh-back-link">
            <LuArrowLeft aria-hidden="true" /> Back to site
          </Link>
          <ThemeToggle />
        </div>
        <div className="gh-auth-card gh-page">
          <div className="d-lg-none mb-4">
            <Brand />
          </div>
          <h2>Welcome back</h2>
          <p className="gh-muted mb-4">Log in to your GarageHub account.</p>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}

export default Login;
