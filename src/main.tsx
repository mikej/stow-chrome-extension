import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

interface TabInfo {
  url: string;
  title: string;
}

async function getActiveTab(): Promise<TabInfo> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    url: tab?.url ?? "",
    title: tab?.title ?? "",
  };
}

async function init() {
  const tabInfo = await getActiveTab();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App url={tabInfo.url} title={tabInfo.title} />
    </StrictMode>,
  );
}

init();
