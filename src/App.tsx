import { useEffect, useState } from "react";

interface AppProps {
  url: string;
  title: string;
}

function App({ title, url }: AppProps) {
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

  async function saveBookmark(url: string, title: string, description: string) {
    callStowApi(storedApiKey!, url, title, description);
  }

  async function callStowApi(
    apiKey: string,
    url: string,
    title: string,
    description: string,
  ) {
    const payload = { url, title, description };

    const response = await fetch("https://stow.is/v1/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = `Request failed: ${response.status}`;
      window.alert(error);
      throw new Error(error);
    }

    window.close();
  }

  return (
    <div className="App">
      {storedApiKey ? (
        <BookmarkForm tabTitle={title} tabUrl={url} onSave={saveBookmark} />
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

interface BookmarkFormProps {
  tabUrl: string;
  tabTitle: string;
  onSave: (url: string, title: string, description: string) => void;
}

function BookmarkForm({ tabUrl, tabTitle, onSave }: BookmarkFormProps) {
  const [title, setTitle] = useState(tabTitle);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(tabUrl);

  return (
    <form>
      <input
        type="text"
        value={title}
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
      />
      <br />
      <textarea onChange={(e) => setDescription(e.target.value)}>
        {description}
      </textarea>
      <br />
      URL:
      <input
        type="text"
        value={url}
        placeholder="https://example.com"
        onChange={(e) => setUrl(e.target.value)}
      />
      <br />
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          onSave(url, title, description);
        }}
      >
        Save
      </button>
    </form>
  );
}

export default App;
