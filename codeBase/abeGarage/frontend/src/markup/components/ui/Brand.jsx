import { Link } from "react-router-dom";

// The GarageHub mark: a gauge needle in an amber tile. Inline SVG, so it
// needs no image request and follows the theme.
export function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#F59E0B" />
      <path d="M8 21.5a8 8 0 1 1 16 0" fill="none" stroke="#1C1F24" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16 21.5 20.6 13.6" stroke="#1C1F24" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="21.5" r="2.4" fill="#1C1F24" />
    </svg>
  );
}

export default function Brand({ to = "/", light = false, size = 32 }) {
  return (
    <Link to={to} className={`gh-brand ${light ? "gh-brand-light" : ""}`} aria-label="GarageHub home">
      <BrandMark size={size} />
      <span>
        Garage<b>Hub</b>
      </span>
    </Link>
  );
}
