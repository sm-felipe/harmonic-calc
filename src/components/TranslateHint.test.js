import {fireEvent, render, screen} from '@testing-library/react';
import TranslateHint from './TranslateHint';

beforeEach(() => window.localStorage.clear());

test('silent for English browsers', () => {
    render(<TranslateHint language="en-US"/>);
    expect(screen.queryByText(/your browser can translate it/i)).not.toBeInTheDocument();
});

test('shown once to other languages, and remembered when dismissed', () => {
    let {unmount} = render(<TranslateHint language="pt-BR"/>);
    expect(screen.getByText(/this page is in English/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /close/i}));
    expect(window.localStorage.getItem('harmonic-calc.translate-hint-dismissed')).toBe('1');
    unmount();

    render(<TranslateHint language="pt-BR"/>);
    expect(screen.queryByText(/this page is in English/i)).not.toBeInTheDocument();
});
