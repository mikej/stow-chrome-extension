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

export default DevPanel;
