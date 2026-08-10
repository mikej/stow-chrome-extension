import { useEffect, useState } from "react";
import {
  apiKeyStorage,
  isExtensionEnvironment,
  maybeCloseWindow,
} from "./platform";
import { getItemsApiUrl, getMeApiUrl } from "./config";
import DevPanel from "./DevPanel";
import SetupForm, { type SetupApiKeyResult } from "./SetupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkPlus } from "lucide-react";

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
    return callStowApi(storedApiKey!, url, title, description);
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
      throw new Error(error);
    }

    maybeCloseWindow();
  }

  return (
    <div className="min-h-full bg-neutral-50 p-3 text-neutral-950">
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
  onSave: (url: string, title: string, description: string) => Promise<void>;
}

function BookmarkForm({ tabUrl, tabTitle, onSave }: BookmarkFormProps) {
  const [title, setTitle] = useState(tabTitle);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState(tabUrl);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(tabTitle);
  }, [tabTitle]);

  useEffect(() => {
    setUrl(tabUrl);
  }, [tabUrl]);

  return (
    <form
      className="w-[336px] rounded-lg border border-neutral-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      aria-label="Save bookmark"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
          await onSave(url, title, description);
        } catch {
          setError("Unable to save bookmark. Try again.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      {error ? (
        <div
          className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
        <div>
          <h1 className="text-sm font-semibold leading-5 text-neutral-950">
            Save bookmark
          </h1>
          <p className="text-xs leading-4 text-neutral-500">
            Add this page to Stow.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bookmark-title">Title</Label>
          <Input
            id="bookmark-title"
            type="text"
            value={title}
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bookmark-description">Description</Label>
          <Textarea
            id="bookmark-description"
            value={description}
            placeholder="Add a note or selected text"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bookmark-url">URL</Label>
          <Input
            id="bookmark-url"
            type="url"
            value={url}
            placeholder="https://example.com"
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
        <Button
          type="submit"
          className="h-8 px-3"
          disabled={isSaving}
        >
          <BookmarkPlus aria-hidden="true" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

export default App;
