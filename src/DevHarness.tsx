import { useState } from "react";
import App from "./App";
import DevPanel from "./DevPanel";

interface DevHarnessProps {
  url: string;
  title: string;
}

// Dev-mode wrapper used when running in a normal browser tab. Applying the dev
// panel remounts App from scratch, just like opening the extension popup.
function DevHarness({ url, title }: DevHarnessProps) {
  const [session, setSession] = useState({ id: 0, url, title });

  return (
    <div className="min-h-screen bg-neutral-50 p-3">
      <DevPanel
        initialUrl={url}
        initialTitle={title}
        onApply={(url, title) =>
          setSession((prev) => ({ id: prev.id + 1, url, title }))
        }
      />
      <App key={session.id} url={session.url} title={session.title} />
    </div>
  );
}

export default DevHarness;
