import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DevPanelProps {
  initialUrl: string;
  initialTitle: string;
  onApply: (url: string, title: string) => void;
}

function DevPanel({ initialUrl, initialTitle, onApply }: DevPanelProps) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);

  return (
    <form
      className="mb-3 w-[336px] rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        const trimmedUrl = url.trim();
        setTitle(trimmedTitle);
        setUrl(trimmedUrl);
        onApply(trimmedUrl, trimmedTitle);
      }}
    >
      <div className="mb-3 border-b border-neutral-100 pb-2">
        <h1 className="text-sm font-semibold leading-5 text-neutral-950">
          Dev mode
        </h1>
        <p className="text-xs leading-4 text-neutral-500">
          Chrome APIs unavailable. Optional query params: `?url=...&title=...`.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dev-title">Title:</Label>
          <Input
            id="dev-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Example title"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dev-url">URL:</Label>
          <Input
            id="dev-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </div>
    </form>
  );
}

export default DevPanel;
