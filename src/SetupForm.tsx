import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SetupApiKeyResult = "saved" | "invalid-token";

interface SetupFormProps {
  onSave: (apiKey: string) => Promise<SetupApiKeyResult>;
}

function SetupForm({ onSave }: SetupFormProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="w-[336px] rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
          const result = await onSave(apiKey.trim());

          if (result === "invalid-token") {
            setError("API token incorrect.");
          }
        } catch {
          setError("Unable to check the API token. Try again.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <div className="mb-3 border-b border-neutral-100 pb-2">
        <h1 className="text-sm font-semibold leading-5 text-neutral-950">
          Connect Stow
        </h1>
        <p className="text-xs leading-4 text-neutral-500">
          Enter an API token to get started.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="api-token">API token</Label>
        <Input
          id="api-token"
            type="text"
            value={apiKey}
          placeholder="stow_..."
            onChange={(e) => setApiKey(e.target.value)}
          />
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
        <Button type="submit" disabled={isSaving}>
        {isSaving ? "Checking..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}

export default SetupForm;
