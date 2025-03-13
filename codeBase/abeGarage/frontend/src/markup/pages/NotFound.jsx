import React from 'react'
import darkTire from "../../assets/images/misc/dark_tire.png";
import { Link } from 'react-router-dom';
function NotFound() {
  return (
    <>
      <section
        class="error-section"
        style={{ backgroundImage: `url(${darkTire})` }}
      >
        <div class="auto-container">
          <div class="content">
            <h1>404</h1>
            <h2>Oops! That page can’t be found</h2>
            <div class="text">
              Sorry, but the page you are looking for does not existing
            </div>
            <Link to="/" class="theme-btn btn-style-one">
              Go to home page
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default NotFound