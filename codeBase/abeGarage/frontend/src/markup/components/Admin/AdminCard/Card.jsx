import { Link } from "react-router";
const Card = ({ title, link }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <Link to={link}>View More →</Link>
    </div>
  );
};
export default Card