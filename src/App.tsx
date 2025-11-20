import { useEffect, useState } from "react";

function App() {
  const [storedApiKey, setStoredApiKey] = useState<string | undefined>();

  useEffect(() => {
    const loadApiKey = async () => {
      const result = (await chrome.storage.local.get("apiKey")) as {
        apiKey?: string;
      };
      setStoredApiKey(result.apiKey);
    };

    loadApiKey();
  }, []);

  function saveApiKey(apiKey: string) {
    chrome.storage.local.set({ apiKey });
    setStoredApiKey(apiKey);
  }

  return (
    <div className="App">
      {storedApiKey ? (
        <div>Ready to go!</div>
      ) : (
        <SetupForm onSave={saveApiKey} />
      )}
    </div>
  );
}

interface SetupFormProps {
  onSave: (apiKey: string) => void;
}

function SetupForm({ onSave }: SetupFormProps) {
  const [apiKey, setApiKey] = useState("");

  return (
    <form>
      <div>Enter your API key to get started.</div>
      <div>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <button onClick={() => onSave(apiKey)}>Continue</button>
    </form>
  );
}

export default App;
