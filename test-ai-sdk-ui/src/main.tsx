import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";

const entryPoint = document.getElementById("root");

if (!entryPoint) {
  throw new Error("Failed to find root element");
}

createRoot(entryPoint).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
