import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App (dev mode)', () => {
  it('shows dev panel and setup form when chrome APIs are unavailable', async () => {
    render(<App url="" title="" />);

    expect(
      screen.getByText(/Dev mode: chrome APIs unavailable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enter your API key to get started/i)
    ).toBeInTheDocument();

    const user = userEvent.setup();
    const titleInput = screen.getByLabelText(/Title:/i);
    const urlInput = screen.getByLabelText(/URL:/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Example title');
    await user.clear(urlInput);
    await user.type(urlInput, 'https://example.com');

    await user.click(screen.getByRole('button', { name: /Apply/i }));

    expect(titleInput).toHaveValue('Example title');
    expect(urlInput).toHaveValue('https://example.com');
  });
});
