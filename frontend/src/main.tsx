import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/variables.css";
import "./styles/tailwind.css";

const el = document.getElementById("root")!;
createRoot(el).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);