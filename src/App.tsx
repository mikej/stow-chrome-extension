import { useEffect, useState } from "react";
import {
  apiKeyStorage,
  isExtensionEnvironment,
} from "./platform";
import {
  getCheckItemApiUrl,
  getItemApiUrl,
  getItemsApiUrl,
  getMeApiUrl,
} from "./config";
import SetupForm, { type SetupApiKeyResult } from "./SetupForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bookmark,
  BookmarkPlus,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppProps {
  url: string;
  title: string;
  // called after a bookmark is saved; closes the popup in the extension
  onClose: () => void;
}

interface TabDetails {
  url: string;
  title: string;
}

export interface BookmarkDetails {
  url: string;
  title: string;
  description: string;
}

export type CheckResult =
  | { existing: true; item: BookmarkDetails & { id: number } }
  | { existing: false; item: BookmarkDetails };

const FALLBACK_LABEL = "Couldn't check Stow – using page details";

function App({ title, url, onClose }: AppProps) {
  const [storedApiKey, setStoredApiKey] = useState<string | undefined>();
  const [lookup, setLookup] = useState<CheckResult | "failed" | undefined>();

  useEffect(() => {
    const loadApiKey = async () => {
      const apiKey = await apiKeyStorage.get();
      setStoredApiKey(apiKey);
    };

    loadApiKey();
  }, []);

  useEffect(() => {
    if (!storedApiKey || !url) {
      return;
    }

    let ignore = false;

    checkBookmark(storedApiKey, { url, title })
      .then((result) => {
        if (!ignore) setLookup(result);
      })
      .catch(() => {
        if (!ignore) setLookup("failed");
      });

    return () => {
      ignore = true;
    };
  }, [storedApiKey, url, title]);

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

  function renderBookmarkForm(apiKey: string) {
    const create = async (details: BookmarkDetails) => {
      await createBookmark(apiKey, details);
      onClose();
    };
    const tabDetails = { url, title, description: "" };

    if (!url) {
      return (
        <BookmarkForm
          initial={tabDetails}
          onSave={create}
        />
      );
    }

    if (!lookup) {
      return <CheckingCard />;
    }

    if (lookup === "failed") {
      return (
        <BookmarkForm
          initial={tabDetails}
          fallback
          onSave={create}
        />
      );
    }

    if (lookup.existing) {
      const id = lookup.item.id;
      return (
        <BookmarkForm
          initial={lookup.item}
          mode="edit"
          onSave={async (details) => {
            await updateBookmark(apiKey, id, details);
            onClose();
          }}
        />
      );
    }

    return (
      <BookmarkForm
        initial={lookup.item}
        onSave={create}
      />
    );
  }

  return (
    <div className="min-h-full text-neutral-950">
      {storedApiKey ? (
        renderBookmarkForm(storedApiKey)
      ) : (
        <SetupForm onSave={saveApiKey} />
      )}
    </div>
  );
}

async function checkBookmark(
  apiKey: string,
  tab: TabDetails,
): Promise<CheckResult> {
  const response = await fetch(getCheckItemApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ item: { url: tab.url, title: tab.title } }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json();
  const item = data?.item;

  if (typeof data?.existing !== "boolean" || !item) {
    throw new Error("Unexpected check response");
  }

  const details: BookmarkDetails = {
    url: item.url ?? tab.url,
    title: item.title ?? "",
    description: item.description ?? "",
  };

  if (data.existing) {
    if (typeof item.id !== "number") {
      throw new Error("Unexpected check response");
    }
    return { existing: true, item: { ...details, id: item.id } };
  }

  return { existing: false, item: details };
}

async function createBookmark(apiKey: string, details: BookmarkDetails) {
  const response = await fetch(getItemsApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(details),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

async function updateBookmark(
  apiKey: string,
  id: number,
  details: BookmarkDetails,
) {
  const response = await fetch(getItemApiUrl(id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ item: details }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
}

const cardClassName = cn(
  "w-[336px] bg-white p-3",
  !isExtensionEnvironment &&
    "rounded-lg border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
);

function CheckingCard() {
  return (
    <div
      className={cn(cardClassName, "flex items-center gap-2 text-xs text-neutral-500")}
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      Checking Stow…
    </div>
  );
}

interface BookmarkFormProps {
  initial: BookmarkDetails;
  mode?: "create" | "edit";
  fallback?: boolean;
  onSave: (details: BookmarkDetails) => Promise<void>;
}

function BookmarkForm({
  initial,
  mode = "create",
  fallback = false,
  onSave,
}: BookmarkFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [url, setUrl] = useState(initial.url);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = mode === "edit";

  return (
    <form
      className={cardClassName}
      aria-label={isEdit ? "Edit bookmark" : "Save bookmark"}
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
          await onSave({ url, title, description });
        } catch {
          setError(
            isEdit
              ? "Unable to update bookmark. Try again."
              : "Unable to save bookmark. Try again.",
          );
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
          <h1 className="flex items-center gap-1.5 text-sm font-semibold leading-5 text-neutral-950">
            {isEdit ? "Edit bookmark" : "Save bookmark"}
            {fallback ? (
              <TriangleAlert
                className="size-3.5 text-amber-500"
                role="img"
                aria-label={FALLBACK_LABEL}
              >
                <title>{FALLBACK_LABEL}</title>
              </TriangleAlert>
            ) : null}
          </h1>
          <p className="text-xs leading-4 text-neutral-500">
            {isEdit ? "Already saved in Stow." : "Add this page to Stow."}
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
            autoFocus
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
        <Button type="submit" className="h-8 px-3" disabled={isSaving}>
          {isEdit ? (
            <>
              <Bookmark aria-hidden="true" />
              {isSaving ? "Updating..." : "Update"}
            </>
          ) : (
            <>
              <BookmarkPlus aria-hidden="true" />
              {isSaving ? "Saving..." : "Save"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default App;
