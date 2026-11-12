import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuCarFront,
  LuCircleCheck,
  LuClipboardList,
  LuLink,
  LuMessageSquareText,
  LuMoon,
  LuShieldCheck,
  LuSparkles,
  LuUserCheck,
} from "react-icons/lu";
import useReveal from "../../util/useReveal";
import { Gauge, GearCluster, Plate } from "../components/ui/garage";

const FEATURES = [
  {
    icon: LuSparkles,
    title: "Smart job intake",
    text: "Paste what the customer said. An AI drafts the job card: likely systems, services from your own catalog, urgency and questions to ask.",
  },
  {
    icon: LuClipboardList,
    title: "Orders from start to finish",
    text: "Received, in progress, completed. Mechanics tick off services as they go; totals always come from catalog prices.",
  },
  {
    icon: LuCarFront,
    title: "Customers and their vehicles",
    text: "Search by name, email or phone. Every vehicle and its order history on one profile.",
  },
  {
    icon: LuLink,
    title: "A tracking link for customers",
    text: "Customers check their order's progress with a private link or their email or phone. No account needed.",
  },
  {
    icon: LuShieldCheck,
    title: "Access by role",
    text: "Admins, managers and mechanics each see what their job needs. The API enforces the same rules.",
  },
  {
    icon: LuMoon,
    title: "Built for every screen",
    text: "Works on a phone at the counter or a desktop in the office, in light or dark mode.",
  },
];

const STEPS = [
  {
    icon: LuMessageSquareText,
    title: "The customer explains",
    text: "“Grinding noise when I brake, and the car shakes above 80.”",
  },
  {
    icon: LuSparkles,
    title: "GarageHub drafts the job card",
    text: "Suggested services come only from your catalog, with an urgency level and questions for the customer.",
  },
  {
    icon: LuUserCheck,
    title: "A person confirms",
    text: "Untick what doesn't fit, add it to the order and submit. Nothing is saved until someone decides.",
  },
];

// A miniature of the real Smart intake draft, drawn with HTML and CSS
// (no screenshot, so it follows the theme and needs no image download).
function IntakePreview() {
  return (
    <div className="gh-hero-visual" aria-hidden="true">
      <GearCluster className="gh-hero-gears" size={240} />
      <div className="gh-mock gh-mock-gauge">
        <Gauge value={0.68} size={84} />
        <div>
          <div className="gh-mock-label mb-1">Bay 2 · in progress</div>
          <Plate>KIA 4521</Plate>
        </div>
      </div>
      <div className="gh-mock gh-mock-complaint">
        <div className="gh-mock-label">Customer&apos;s complaint</div>
        <p>Grinding noise when I brake, and the car shakes above 80.</p>
      </div>
      <div className="gh-mock gh-mock-draft">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="gh-mock-title">
            <LuSparkles /> Draft job card
          </div>
          <span className="gh-pill gh-pill-red">high</span>
        </div>
        <div className="gh-mock-label">Suggested services</div>
        <ul className="gh-mock-services">
          <li>
            <LuCircleCheck /> Brake pad replacement <span>$149.00</span>
          </li>
          <li>
            <LuCircleCheck /> Wheel balancing <span>$39.00</span>
          </li>
        </ul>
        <div className="gh-mock-label mt-3">Ask the customer</div>
        <p className="gh-mock-question">Does the shaking come through the steering wheel?</p>
        <div className="gh-mock-actions">
          <span className="gh-mock-btn">Add to order</span>
          <span className="gh-mock-btn gh-mock-btn-ghost">Discard</span>
        </div>
      </div>
    </div>
  );
}

function Home() {
  useReveal();
  return (
    <>
      <section className="gh-hero">
        <div className="container gh-hero-grid">
          <div className="gh-hero-copy gh-stagger">
            <span className="gh-hero-badge">
              <LuSparkles aria-hidden="true" /> Workshop management with an AI assistant
            </span>
            <h1>
              Run your garage <span className="gh-gradient-text">without the paperwork.</span>
            </h1>
            <p className="gh-hero-lead">
              GarageHub keeps customers, vehicles and orders in one place, and turns a customer&apos;s description of a
              problem into a draft job card your team confirms.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/login" className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2">
                Try the live demo <LuArrowRight aria-hidden="true" />
              </Link>
              <Link to="/customer_info" className="btn btn-outline-secondary btn-lg">
                Track an order
              </Link>
            </div>
            <p className="gh-hero-note">The demo uses fictional customers. First load can take a minute while the server wakes up.</p>
          </div>
          <IntakePreview />
        </div>
      </section>

      <section id="features" className="gh-section">
        <div className="container">
          <div className="gh-section-head">
            <span className="gh-eyebrow">Features</span>
            <h2>Everything the front desk and the workshop share</h2>
            <p>One system from the moment a customer walks in to the moment they drive away.</p>
          </div>
          <div className="gh-feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="gh-card gh-card-hover gh-feature gh-reveal">
                <span className="gh-icon-tile">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="gh-section gh-section-alt">
        <div className="container">
          <div className="gh-section-head">
            <span className="gh-eyebrow">How it works</span>
            <h2>From a complaint to a confirmed job card</h2>
            <p>The AI suggests; your team decides. Every draft is checked by a person before it reaches an order.</p>
          </div>
          <ol className="gh-steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="gh-step gh-reveal">
                <span className="gh-step-num">{i + 1}</span>
                <span className="gh-icon-tile">
                  <Icon aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="gh-section">
        <div className="container">
          <div className="gh-cta">
            <div className="gh-hazard-bar gh-cta-hazard" aria-hidden="true" />
            <GearCluster className="gh-cta-gears" size={220} />
            <div className="gh-cta-copy">
              <h2>See it with real screens</h2>
              <p>Log in with the read-only demo account to look around and try Smart intake.</p>
            </div>
            <Link to="/login" className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2">
              Open the demo <LuArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
