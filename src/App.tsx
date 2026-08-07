import { useEffect, useState } from "react";
import {
  apiKeyStorage,
  isExtensionEnvironment,
  maybeCloseWindow,
} from "./platform";
import { getItemsApiUrl, getMeApiUrl } from "./config";
import DevPanel from "./DevPanel";
import SetupForm, { type SetupApiKeyResult } from "./SetupForm";

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

  async function saveApiKey(apiKey: string): Promise<SetupApiKeyResult> {
    const response = await fetch(getMeApiUrl(), {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    });

    console.log("Got response", response);

    if (response.status === 401) {
      return "invalid-token";
    }

    if (!response.ok) {
      const error = `Request failed: ${response.status}`;
      window.alert(error);
      throw new Error(error);
    }

    await apiKeyStorage.set(apiKey);
    setStoredApiKey(apiKey);
    return "saved";
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

    const response = await fetch(getItemsApiUrl(), {
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
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
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
