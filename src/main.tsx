import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global image protection: prevent right-click & drag on all images
document.addEventListener("contextmenu", (e) => {
  if (e.target instanceof HTMLImageElement) {
    e.preventDefault();
  }
});
document.addEventListener("dragstart", (e) => {
  if (e.target instanceof HTMLImageElement) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
