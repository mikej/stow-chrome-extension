import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App (dev mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows dev panel and setup form when chrome APIs are unavailable', async () => {
    render(<App url="" title="" />);

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
});
