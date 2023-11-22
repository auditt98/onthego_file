import React from "react";
import ReactDOM from "react-dom/client";
import { Theme, ThemePanel } from "@radix-ui/themes";

import Home from "./pages/home.tsx";
import "@radix-ui/themes/styles.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme
      appearance="light"
      accentColor="orange"
      panelBackground="solid"
      radius="none"
      style={{
        height: "100%",
      }}
    >
      <Home />
    </Theme>
  </React.StrictMode>
);
