import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import ScoreLoader, {formatDuration} from './ScoreLoader';
import {readScore} from '../service/musicXml';

jest.mock('../service/musicXml');

const score = {
    title: 'Mille Regretz',
    parts: [{name: 'Superius'}, {name: 'Bassus'}],
    notes: new Array(297),
    durationMs: 82000,
};

function chooseFile() {
    let file = new File(['<score/>'], 'piece.musicxml');
    let input = document.querySelector('input[type="file"]');
    fireEvent.change(input, {target: {files: [file]}});
    return file;
}

test('minutes and seconds, padded', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9000)).toBe('0:09');
    expect(formatDuration(82000)).toBe('1:22');
    expect(formatDuration(3600000)).toBe('60:00');
});

test('with no score open, the button invites one and says what will happen', () => {
    render(<ScoreLoader score={null} onLoad={jest.fn()} onClear={jest.fn()}/>);
    expect(screen.getByRole('button', {name: /open a score/i})).toBeEnabled();
    expect(screen.getByText(/play works through the piece/i)).toBeInTheDocument();
});

test('an open score is summarised, and can be closed', () => {
    let onClear = jest.fn();
    render(<ScoreLoader score={score} onLoad={jest.fn()} onClear={onClear}/>);

    expect(screen.getByText('Mille Regretz')).toBeInTheDocument();
    expect(screen.getByText(/2 parts · 297 notes · 1:22/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: /close score/i}));
    expect(onClear).toHaveBeenCalled();
});

test('a chosen file is read and handed over', async () => {
    readScore.mockResolvedValue(score);
    let onLoad = jest.fn();
    render(<ScoreLoader score={null} onLoad={onLoad} onClear={jest.fn()}/>);

    let file = chooseFile();
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith(score));
    expect(readScore).toHaveBeenCalledWith(file);
});

test('a file that cannot be read says so instead of failing silently', async () => {
    readScore.mockRejectedValue(new Error('That file could not be read as a music score.'));
    let onLoad = jest.fn();
    render(<ScoreLoader score={null} onLoad={onLoad} onClear={jest.fn()}/>);

    chooseFile();
    expect(await screen.findByText(/could not be read as a music score/i)).toBeInTheDocument();
    expect(onLoad).not.toHaveBeenCalled();
    // and the button is usable again rather than stuck on "Reading…"
    expect(screen.getByRole('button', {name: /open a score/i})).toBeEnabled();
});
