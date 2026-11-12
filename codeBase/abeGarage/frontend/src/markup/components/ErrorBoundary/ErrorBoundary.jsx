import React from "react";

// Catches render errors below it so one broken component shows a message
// instead of React unmounting the whole app (which left a blank page).
// The layouts key it by route, so navigating elsewhere recovers.
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
        <div className="container py-5">
          <div className="gh-card text-center mx-auto" role="alert" style={{ maxWidth: 520 }}>
            <h2 className="h4">Something went wrong on this page</h2>
            <p className="gh-muted mb-0">Try reloading, or go back and try again.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
