// Title row at the top of every staff page: heading, optional subtitle,
// optional actions (buttons) on the right.
export default function PageHeader({ title, subtitle, eyebrow, actions }) {
  return (
    <div className="gh-page-header">
      <div>
        {eyebrow && <div className="gh-eyebrow mb-1">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
