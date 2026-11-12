import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import DevHarness from "./DevHarness.tsx";
import { getDevTabInfo } from "./devTabInfo";
import {
  getActiveTabInfo,
  isExtensionEnvironment,
  type TabInfo,
} from "./platform";

function render(node: ReactNode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>{node}</StrictMode>,
  );
}

async function init() {
  if (!isExtensionEnvironment) {
    const tabInfo = getDevTabInfo();
    render(<DevHarness url={tabInfo.url} title={tabInfo.title} />);
    return;
  }

  let tabInfo: TabInfo;
  try {
    tabInfo = await getActiveTabInfo();
  } catch (error) {
    // still show the popup so the bookmark can be entered by hand
    console.error("Unable to read the active tab", error);
    tabInfo = { url: "", title: "" };
  }

  render(
    <App
      url={tabInfo.url}
      title={tabInfo.title}
      onClose={() => window.close()}
    />,
  );
}

init();
