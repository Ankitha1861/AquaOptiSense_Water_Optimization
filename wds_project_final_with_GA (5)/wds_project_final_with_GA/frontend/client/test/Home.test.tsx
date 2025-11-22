
import { render, screen } from '@testing-library/react';
import Home from '../src/pages/Home';

describe('Home page', () => {
  it('should render the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /Revolutionizing Water Management in Bengaluru/i,
    });
    expect(heading).toBeInTheDocument();
  });
});
