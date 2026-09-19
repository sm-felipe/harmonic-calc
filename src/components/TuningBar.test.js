import {fireEvent, render, screen} from '@testing-library/react';
import TuningBar from './TuningBar';
import {defaultTuning} from '../service/temperaments';

function bar(tuning = defaultTuning) {
    let onChange = jest.fn();
    render(<TuningBar tuning={tuning} onChange={onChange}/>);
    return onChange;
}

test('closed, the tuning is written short enough for a toolbar', () => {
    bar({...defaultTuning, temperamentId: 'meantone', keyId: 'Eb'});
    expect(screen.getByLabelText('Temperament')).toHaveTextContent('Mean ¼');
    expect(screen.getByLabelText('Key')).toHaveTextContent('Eb/Cm');
});

test('opened, the temperaments are named in full and explained', () => {
    bar();
    fireEvent.mouseDown(screen.getByLabelText('Temperament'));

    expect(screen.getByRole('option', {name: /12-tone equal temperament/})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: /quarter-comma meantone/i})).toBeInTheDocument();
    // the description comes along, as it did in the drawer
    expect(screen.getByText(/fifths narrowed by a quarter of the syntonic comma/i)).toBeInTheDocument();
});

test('picking a temperament reports it without disturbing the rest of the tuning', () => {
    let onChange = bar({...defaultTuning, keyId: 'D', a4: 415});
    fireEvent.mouseDown(screen.getByLabelText('Temperament'));
    fireEvent.click(screen.getByRole('option', {name: /pythagorean/i}));

    expect(onChange).toHaveBeenCalledWith({...defaultTuning, keyId: 'D', a4: 415, temperamentId: 'pythagorean'});
});

test('picking a key reports it', () => {
    let onChange = bar();
    fireEvent.mouseDown(screen.getByLabelText('Key'));
    fireEvent.click(screen.getByRole('option', {name: /^A major/}));

    expect(onChange).toHaveBeenCalledWith({...defaultTuning, keyId: 'A'});
});

test('snap is a switch that shows whether it is on', () => {
    let onChange = bar();
    let snap = screen.getByRole('button', {name: /snap/i});
    expect(snap).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(snap);
    expect(onChange).toHaveBeenCalledWith({...defaultTuning, snap: true});
});

test('snap already on can be turned off again', () => {
    let onChange = bar({...defaultTuning, snap: true});
    expect(screen.getByRole('button', {name: /snap/i})).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', {name: /snap/i}));
    expect(onChange).toHaveBeenCalledWith({...defaultTuning, snap: false});
});
