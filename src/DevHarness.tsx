import { useState } from "react";
import App from "./App";
import DevPanel from "./DevPanel";
import { Button } from "@/components/ui/button";

interface DevHarnessProps {
  url: string;
  title: string;
}

// Dev-mode wrapper used when running in a normal browser tab. It simulates
// the extension popup's lifecycle: applying the dev panel or reopening after
// a save mounts App from scratch, just like opening the popup.
function DevHarness({ url, title }: DevHarnessProps) {
  const [session, setSession] = useState({ id: 0, url, title, closed: false });

  function open(url: string, title: string) {
    setSession((prev) => ({ id: prev.id + 1, url, title, closed: false }));
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-3">
      <DevPanel initialUrl={url} initialTitle={title} onApply={open} />
      {session.closed ? (
        <div
          className="flex w-[336px] items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          role="status"
        >
          <p className="text-xs text-neutral-500">Popup closed.</p>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-3"
            autoFocus
            onClick={() => open(session.url, session.title)}
          >
            Open again
          </Button>
        </div>
      ) : (
        <App
          key={session.id}
          url={session.url}
          title={session.title}
          onClose={() => setSession((prev) => ({ ...prev, closed: true }))}
        />
      )}
    </div>
  );
}

export default DevHarness;
