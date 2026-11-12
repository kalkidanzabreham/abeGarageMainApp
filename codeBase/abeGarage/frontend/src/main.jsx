import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// self-hosted fonts (no request to a font CDN)
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
// Bootstrap 5.3 (React-Bootstrap 2 is written for it), then the GarageHub
// design system on top
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/theme.css";
import "./styles/layout.css";

import App from "./App.jsx";
import { Authprovider } from "./Context/AuthContext.jsx";
import { ThemeProvider } from "./Context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <ThemeProvider>
        <Authprovider>
          <App />
        </Authprovider>
      </ThemeProvider>
    </StrictMode>
  </BrowserRouter>
);
