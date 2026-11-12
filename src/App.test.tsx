import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import DevHarness from './DevHarness';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const newBookmarkCheck = {
  existing: false,
  item: {
    title: 'Processed title',
    url: 'https://example.com/processed',
    description: 'Processed description',
  },
};

const existingBookmarkCheck = {
  existing: true,
  item: {
    id: 1,
    title: 'Saved title',
    url: 'https://example.com',
    description: 'Saved description',
  },
};


describe('App (dev mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows dev panel and setup form when chrome APIs are unavailable', async () => {
    render(<DevHarness url="" title="" />);

    expect(
      screen.getByText(/Chrome APIs unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter an API token to get started/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/API token/i)).toHaveClass("rounded-md");
    expect(screen.getByRole('button', { name: /Continue/i })).toHaveClass(
      "bg-neutral-950"
    );

    const user = userEvent.setup();
    const titleInput = screen.getByLabelText(/Title:/i);
    const urlInput = screen.getByLabelText(/URL:/i);

    expect(titleInput).toHaveClass("rounded-md");
    expect(urlInput).toHaveClass("rounded-md");
    expect(screen.getByRole('button', { name: /Apply/i })).toHaveClass(
      "border-neutral-200"
    );

    await user.clear(titleInput);
    await user.type(titleInput, 'Example title');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://example.com');

    await user.click(screen.getByRole('button', { name: /Apply/i }));

    expect(titleInput).toHaveValue('Example title');
    expect(urlInput).toHaveValue('https://example.com');
  });

  it('checks and saves a valid API token during setup', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    render(<App url="" title="" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/API token/i), 'valid-token');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByPlaceholderText('Title')).toBeInTheDocument();
    expect(localStorage.getItem('apiKey')).toBe('valid-token');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://stow.is/v1/me',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Authorization: 'valid-token'
        }
      })
    );
  });

  it("shows an error and does not save when the API token is rejected", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 401 })
    );

    render(<App url="" title="" />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/API token/i), 'bad-token');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    expect(
      await screen.findByText(/API token incorrect/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Enter an API token to get started/i)).toBeInTheDocument();
    expect(localStorage.getItem('apiKey')).toBeNull();
  });

  it('shows an inline error when saving a bookmark fails', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 })
    );

    render(<App url="https://example.com" title="Example title" />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Save/i }));

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(/Unable to save bookmark/i);
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('clears the bookmark save error before retrying', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(newBookmarkCheck))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    render(<App url="https://example.com" title="Example title" />);

    const user = userEvent.setup();
    const saveButton = await screen.findByRole('button', { name: /Save/i });

    await user.click(saveButton);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to save bookmark/i
    );

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('shows a loading state while checking the bookmark', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    render(<App url="https://example.com" title="Example title" />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      /Checking Stow/i
    );
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('checks the bookmark with the tab details', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(newBookmarkCheck));

    render(<App url="https://example.com" title="Example title" />);

    await screen.findByRole('form', { name: /Save bookmark/i });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://stow.is/v1/items/check',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          item: { url: 'https://example.com', title: 'Example title' },
        }),
      })
    );
  });

  it('prefills the form with processed details for a new bookmark', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(newBookmarkCheck))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }, 201));

    render(<App url="https://example.com" title="Example title" />);

    expect(await screen.findByLabelText('Title')).toHaveValue('Processed title');
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Processed description'
    );
    expect(screen.getByLabelText('URL')).toHaveValue(
      'https://example.com/processed'
    );
    expect(screen.queryByLabelText(/Couldn't check Stow/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://stow.is/v1/items',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('switches to editing when the bookmark already exists', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(existingBookmarkCheck))
      .mockResolvedValueOnce(jsonResponse(existingBookmarkCheck.item));

    render(<App url="https://example.com" title="Example title" />);

    expect(
      await screen.findByRole('heading', { name: /Edit bookmark/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Already saved in Stow/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Saved title');
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Saved description'
    );

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated title');
    await user.click(screen.getByRole('button', { name: /Update/i }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://stow.is/v1/items/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          item: {
            url: 'https://example.com',
            title: 'Updated title',
            description: 'Saved description',
          },
        }),
      })
    );
  });

  it('shows an inline error when updating a bookmark fails', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(existingBookmarkCheck))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));

    render(<App url="https://example.com" title="Example title" />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Update/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to update bookmark/i
    );
  });

  it('falls back to the tab details with a warning when the check fails', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ id: 2 }, 201));

    render(<App url="https://example.com" title="Example title" />);

    expect(
      await screen.findByLabelText(/Couldn't check Stow/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Example title');
    expect(screen.getByLabelText('URL')).toHaveValue('https://example.com');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://stow.is/v1/items',
      expect.objectContaining({ method: 'POST' })
    );
  });
  it('re-initialises the app with fresh details when the dev panel is re-applied', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(existingBookmarkCheck))
      .mockResolvedValueOnce(
        jsonResponse({
          existing: true,
          item: { ...existingBookmarkCheck.item, description: 'Edited in Stow' },
        })
      );

    render(<DevHarness url="https://example.com" title="Example title" />);

    expect(await screen.findByLabelText('Description')).toHaveValue(
      'Saved description'
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Apply/i }));

    await waitFor(() =>
      expect(screen.getByLabelText('Description')).toHaveValue('Edited in Stow')
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('re-initialises the app with the dev panel details on apply', async () => {
    localStorage.setItem('apiKey', 'valid-token');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    render(<DevHarness url="https://example.com" title="Example title" />);

    const user = userEvent.setup();
    const bookmarkTitle = await screen.findByPlaceholderText('Title');
    await user.clear(bookmarkTitle);
    await user.type(bookmarkTitle, 'Unsaved edit');

    await user.clear(screen.getByLabelText(/Title:/i));
    await user.type(screen.getByLabelText(/Title:/i), '  Applied title  ');
    await user.clear(screen.getByLabelText(/URL:/i));
    await user.type(screen.getByLabelText(/URL:/i), 'https://example.com/applied');

    expect(screen.getByPlaceholderText('Title')).toHaveValue('Unsaved edit');

    await user.click(screen.getByRole('button', { name: /Apply/i }));

    expect(await screen.findByPlaceholderText('Title')).toHaveValue(
      'Applied title'
    );
    expect(screen.getByLabelText('URL')).toHaveValue(
      'https://example.com/applied'
    );
  });
});
