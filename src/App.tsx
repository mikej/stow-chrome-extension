import { useEffect, useState } from "react";
import {
  apiKeyStorage,
  isExtensionEnvironment,
  maybeCloseWindow,
} from "./platform";

interface AppProps {
  url: string;
  title: string;
}

function App({ title, url }: AppProps) {
  const [storedApiKey, setStoredApiKey] = useState<string | undefined>();
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentUrl, setCurrentUrl] = useState(url);

  useEffect(() => {
    const loadApiKey = async () => {
      const apiKey = await apiKeyStorage.get();
      setStoredApiKey(apiKey);
    };

    loadApiKey();
  }, []);

  function saveApiKey(apiKey: string) {
    void apiKeyStorage.set(apiKey).then(() => setStoredApiKey(apiKey));
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

    maybeCloseWindow();
  }

  return (
    <div className="App">
      {!isExtensionEnvironment ? (
        <DevPanel
          currentTitle={currentTitle}
          currentUrl={currentUrl}
          onChangeTitle={setCurrentTitle}
          onChangeUrl={setCurrentUrl}
          onApply={() => {
            setCurrentTitle(currentTitle.trim());
            setCurrentUrl(currentUrl.trim());
          }}
        />
      ) : null}
      {storedApiKey ? (
        <BookmarkForm
          tabTitle={currentTitle}
          tabUrl={currentUrl}
          onSave={saveBookmark}
        />
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

interface BookmarkFormProps {
  tabUrl: string;
  tabTitle: string;
  onSave: (url: string, title: string, description: string) => void;
}

function BookmarkForm({ tabUrl, tabTitle, onSave }: BookmarkFormProps) {
  const [title, setTitle] = useState(tabTitle);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(tabUrl);

  useEffect(() => {
    setTitle(tabTitle);
  }, [tabTitle]);

  useEffect(() => {
    setUrl(tabUrl);
  }, [tabUrl]);

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

interface DevPanelProps {
  currentTitle: string;
  currentUrl: string;
  onChangeTitle: (value: string) => void;
  onChangeUrl: (value: string) => void;
  onApply: () => void;
}

function DevPanel({
  currentTitle,
  currentUrl,
  onChangeTitle,
  onChangeUrl,
  onApply,
}: DevPanelProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div>
        Dev mode: chrome APIs unavailable. Optional query params: `?url=...&title=...`.
      </div>
      <div>
        <label>
          Title:
          <input
            type="text"
            value={currentTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Example title"
          />
        </label>
      </div>
      <div>
        <label>
          URL:
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </label>
      </div>
      <button type="submit">Apply</button>
    </form>
  );
}
