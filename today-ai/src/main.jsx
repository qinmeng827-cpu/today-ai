import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Today AI render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell app-error">
          <span className="section-kicker">Today AI</span>
          <h1>页面加载异常</h1>
          <p>请刷新页面；如果仍然出现，请稍后再试。</p>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
