import { useState } from "react";

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
      <div>Enter your API key to get started.</div>
      <div>
        <label>
          API key:
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
      </div>
      {error ? <div role="alert">{error}</div> : null}
      <button type="submit" disabled={isSaving}>
        {isSaving ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}

export default SetupForm;
