import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { getActiveTabInfo } from "./platform";

async function init() {
  const tabInfo = await getActiveTabInfo();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App url={tabInfo.url} title={tabInfo.title} />
    </StrictMode>,
  );
}

init();
