import { useState } from "react";

function App() {
  return (
    <div className="App">
      Extension will go here
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
