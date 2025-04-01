import React, { useState } from "react";
import iconBar from "../../../assets/icons/icon-bar.png";
import logo from "../../../assets/images/logo.png";
import { useAuth } from "../../../Context/AuthContext";
import { logout } from "../../../services/login.service";
import { Link } from "react-router";

function Header(props) {
  const { employee, isLoggedIn, setIsLoggedIn, isAdmin, isGuest } = useAuth();
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);

  const logOUt = () => {
    logout();
    setIsLoggedIn(false);
    window.location.replace("/");
    setIsMobileMenuVisible(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuVisible(!isMobileMenuVisible);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuVisible(false);
  };

  return (
    <header
      className={`main-header header-style-one ${
        isMobileMenuVisible ? "mobile-menu-visible" : ""
      }`}
    >
      {/* Header Top */}
      <div className="header-top">
        <div className="auto-container">
          <div className="inner-container">
            <div className="left-column">
              <div className="text">Enjoy the Beso while we fix your car</div>
              <div className="office-hour">
                Monday - Saturday 7:00AM - 6:00PM
              </div>
            </div>
            {isLoggedIn ? (
              <div className="right-column">
                <div
                  className="phone-number mr-5"
                  style={{ fontSize: "22px", fontWeight: "bold" }}
                >
                  Welcome : {employee.employee_first_name}
                </div>
              </div>
            ) : (
              <div className="right-column">
                <div className="phone-number mr-5">
                  Schedule Your Appointment Today :{" "}
                  <strong>1800 456 7890</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Upper */}
      <div className="header-upper">
        <div className="auto-container">
          <div className="inner-container">
            <div className="logo-box">
              <div className="logo">
                <a href="/">
                  <img src={logo} alt="" width={"210px"} />
                </a>
              </div>
            </div>
            <div className="right-column">
              <div className="nav-outer">
                {/* Mobile Menu Toggler */}
                <div className="mobile-nav-toggler" onClick={toggleMobileMenu}>
                  <img src={iconBar} alt="" />
                </div>

                {/* Main Navigation */}
                <nav className="main-menu navbar-expand-md navbar-light">
                  <div className="collapse navbar-collapse show clearfix">
                    <ul className="navigation">
                      <li>
                        <Link to="/">Home</Link>
                      </li>
                      <li>
                        <Link to="/about">About Us</Link>
                      </li>
                      <li>
                        <Link to="/services">Services</Link>
                      </li>
                      <li>
                        <Link to="/contact">Contact Us</Link>
                      </li>
                      {(isAdmin || isGuest) && (
                        <li>
                          <Link to="/admin">Admin</Link>
                        </li>
                      )}
                      <li>
                        <Link to="/customer_info">Orders</Link>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>

              {/* Login/Logout Button */}
              <div className="link-btn " >
                {isLoggedIn ? (
                  <Link
                    to="/"
                    className="theme-btn btn-style-one m-4"
                    onClick={logOUt}
                  >
                    Log Out
                  </Link>
                ) : (
                  <Link to="/login" className="theme-btn btn-style-one m-4">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuVisible && (
        <div className="mobile-menu">
          <div className="menu-backdrop" onClick={closeMobileMenu}></div>
          <div className="menu-box">
            <div className="close-btn" onClick={closeMobileMenu}>
              <span className="icon flaticon-remove"></span>
            </div>
            <nav className="menu-box">
              <div className="nav-logo">
                <a href="/">
                  <img src={logo} alt="Logo" />
                </a>
              </div>
              <div className="menu-outer">
                <ul className="navigation">
                  <li>
                    <Link to="/" onClick={closeMobileMenu}>
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" onClick={closeMobileMenu}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/services" onClick={closeMobileMenu}>
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" onClick={closeMobileMenu}>
                      Contact Us
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link to="/admin" onClick={closeMobileMenu}>
                        Admin
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to="/customer_info" onClick={closeMobileMenu}>
                      Orders
                    </Link>
                  </li>
                </ul>
              </div>
              {/* Login/Logout Button inside Mobile Menu */}
              <div className="mobile-menu-login m-4">
                {isLoggedIn ? (
                  <Link
                    to="/"
                    className="theme-btn btn-style-one ml-4"
                    onClick={logOUt}
                  >
                    Log Out
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="theme-btn btn-style-one ml-4"
                    onClick={closeMobileMenu}
                  >
                    Log in
                  </Link>
                )}
              </div>

              {/* Social Links */}
              <div className="social-links">
                <ul>
                  <li>
                    <a href="#">
                      <span className="fab fa-twitter"></span>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <span className="fab fa-facebook-square"></span>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <span className="fab fa-pinterest-p"></span>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <span className="fab fa-instagram"></span>
                    </a>
                  </li>
                  <li>
                    <a href="#">
                      <span className="fab fa-youtube"></span>
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="nav-overlay">
        <div className="cursor"></div>
        <div className="cursor-follower"></div>
      </div>
    </header>
  );
}

export default Header;
