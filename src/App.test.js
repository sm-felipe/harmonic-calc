import {render, screen} from '@testing-library/react';
import App from './App';

test('renders the instrument and note selectors', () => {
    render(<App/>);
    expect(screen.getByLabelText(/instrument/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Hypothetical/)).toBeInTheDocument();
});
