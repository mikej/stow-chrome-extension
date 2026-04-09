import { useState } from "react";

interface SetupFormProps {
  onSave: (apiKey: string) => void;
}

function SetupForm({ onSave }: SetupFormProps) {
  const [apiKey, setApiKey] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(apiKey);
      }}
    >
      <div>Enter your API key to get started.</div>
      <div>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <button type="submit">Continue</button>
    </form>
  );
}

export default SetupForm;
