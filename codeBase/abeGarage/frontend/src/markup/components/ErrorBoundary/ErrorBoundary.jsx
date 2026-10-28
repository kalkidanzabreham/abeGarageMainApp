import React from "react";

// Catches render errors below it so one broken component shows a message
// instead of React unmounting the whole app (which left a blank page).
// App.jsx keys it by route, so navigating elsewhere recovers.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error caught by ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="contact-section">
          <div className="auto-container" role="alert">
            <h2>Something went wrong on this page</h2>
            <p>Try reloading, or go back and try again.</p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
