import {fireEvent, render, screen} from '@testing-library/react';
import ScoreView from './ScoreView';
import {indexOfNote} from '../service/notes';

// jsdom lays nothing out, so the container would measure zero and the view
// would never draw; 800 stands in for the width it has in a browser.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {configurable: true, value: 800});
});

// a page of markup with the ids the score's notes carry
function pageMarkup(page) {
    return `<svg data-page="${page}">
        <g id="n1" class="note"><g class="notehead"></g></g>
        <g id="n2" class="note"><g class="notehead"></g></g>
        <g id="n2b" class="note"><g class="notehead"></g></g>
        <g id="n3" class="note"><g class="notehead"></g></g>
    </svg>`;
}

function scoreOf(overrides = {}) {
    let toolkit = {
        setOptions: jest.fn(),
        redoLayout: jest.fn(),
        getPageCount: jest.fn(() => 2),
        renderToSVG: jest.fn((page) => pageMarkup(page)),
        getPageWithElement: jest.fn((id) => (id === 'n3' ? 2 : 1)),
        ...overrides,
    };
    return {
        title: 'Test',
        parts: [{name: 'Voz', instrumentId: 'voice-a'}],
        notes: [
            {ids: ['n1'], partIndex: 0, pitchIndex: indexOfNote('C4'), startMs: 0, endMs: 1000},
            // one note written as two tied halves
            {ids: ['n2', 'n2b'], partIndex: 0, pitchIndex: indexOfNote('E4'), startMs: 0, endMs: 2000},
            {ids: ['n3'], partIndex: 0, pitchIndex: indexOfNote('G4'), startMs: 2000, endMs: 3000},
        ],
        changes: [],
        durationMs: 3000,
        pageCount: 2,
        toolkit,
    };
}

// the element that scrolls: the outer Box wraps it, the host div sits inside it
function scrollerOf(container) {
    return container.querySelectorAll('div')[1];
}

function lit(container) {
    return [...container.querySelectorAll('.sounding')].map((element) => element.id);
}

test('the page is engraved to the width there is, not to a fixed one', () => {
    let score = scoreOf();
    render(<ScoreView score={score}/>);

    expect(score.toolkit.setOptions).toHaveBeenCalledWith(expect.objectContaining({
        pageWidth: 1600,          // 800 px at scale 50
        adjustPageHeight: true,
    }));
    expect(score.toolkit.redoLayout).toHaveBeenCalled();
    expect(score.toolkit.renderToSVG).toHaveBeenCalledWith(1, {});
});

test('the engraved score is what gets shown', () => {
    let {container} = render(<ScoreView score={scoreOf()}/>);
    expect(container.querySelector('svg')).toHaveAttribute('data-page', '1');
    expect(container.querySelectorAll('g.note')).toHaveLength(4);
});

test('the notes sounding now are marked, both halves of a tied one', () => {
    let {container} = render(<ScoreView score={scoreOf()} sounding={[0, 1]}/>);
    expect(lit(container)).toEqual(['n1', 'n2', 'n2b']);
});

test('a mark comes off as soon as that note stops', () => {
    let score = scoreOf();
    let {container, rerender} = render(<ScoreView score={score} sounding={[0, 1]}/>);
    expect(lit(container)).toEqual(['n1', 'n2', 'n2b']);

    rerender(<ScoreView score={score} sounding={[1]}/>);
    expect(lit(container)).toEqual(['n2', 'n2b']);

    rerender(<ScoreView score={score} sounding={[]}/>);
    expect(lit(container)).toEqual([]);
});

test('the page turns itself to wherever the music has got to', () => {
    let score = scoreOf();
    let {rerender} = render(<ScoreView score={score} sounding={[0]}/>);
    expect(score.toolkit.renderToSVG).toHaveBeenLastCalledWith(1, {});

    rerender(<ScoreView score={score} sounding={[2]}/>);   // n3 lives on page 2
    expect(score.toolkit.renderToSVG).toHaveBeenLastCalledWith(2, {});
});

test('the pages can also be turned by hand, and are not offered when there is one', () => {
    let score = scoreOf();
    render(<ScoreView score={score}/>);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /previous/i})).toBeDisabled();

    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /next/i})).toBeDisabled();

    render(<ScoreView score={scoreOf({getPageCount: jest.fn(() => 1)})}/>);
    expect(screen.queryByText(/page 1 of 1/i)).not.toBeInTheDocument();
});

test('the line being sung is brought into view only while the piece plays', () => {
    let scrolled = jest.fn();
    Element.prototype.scrollIntoView = scrolled;

    let score = scoreOf();
    let {rerender} = render(<ScoreView score={score} sounding={[0]} following={false}/>);
    rerender(<ScoreView score={score} sounding={[1]} following={false}/>);
    expect(scrolled).not.toHaveBeenCalled();

    rerender(<ScoreView score={score} sounding={[0]} following={true}/>);
    expect(scrolled).toHaveBeenCalled();
});

// --- the whole piece on one line, as the lanes lay it out -----------------

test('one line means no page breaks and no page to bound the drawing', () => {
    let score = scoreOf({getPageCount: jest.fn(() => 1)});
    render(<ScoreView score={score} continuous/>);

    expect(score.toolkit.setOptions).toHaveBeenCalledWith(expect.objectContaining({breaks: 'none'}));
    let {pageWidth, pageHeight} = score.toolkit.setOptions.mock.calls[0][0];
    expect(pageWidth).toBeGreaterThan(50000);
    expect(pageHeight).toBeGreaterThan(50000);
    // it all fits on one page, so there is nothing to turn
    expect(screen.queryByRole('button', {name: /next/i})).not.toBeInTheDocument();
});

test('the paged view is the one that breaks lines', () => {
    let score = scoreOf();
    render(<ScoreView score={score}/>);
    expect(score.toolkit.setOptions).toHaveBeenCalledWith(expect.objectContaining({breaks: 'auto'}));
});

test('on one line the score slides sideways to keep the note being sung in view', () => {
    let score = scoreOf({getPageCount: jest.fn(() => 1)});
    let {container, rerender} = render(<ScoreView score={score} sounding={[0]} continuous/>);

    // the container pans: 800 visible of 4000
    let scroller = scrollerOf(container);
    Object.defineProperty(scroller, 'scrollWidth', {configurable: true, value: 4000});
    scroller.scrollLeft = 0;
    scroller.getBoundingClientRect = () => ({left: 0, right: 800, width: 800, top: 0, bottom: 400, height: 400});
    // the next note sits well off to the right
    let target = container.querySelector('#n2');
    target.getBoundingClientRect = () => ({left: 1500, right: 1510, width: 10, top: 0, bottom: 10, height: 10});

    rerender(<ScoreView score={score} sounding={[1]} continuous following/>);

    // held a third of the way in: 1500 - 0 - 800/3
    expect(Math.round(scroller.scrollLeft)).toBe(1233);
});

test('a score that fits needs no sliding, and the window is scrolled instead', () => {
    let scrolled = jest.fn();
    Element.prototype.scrollIntoView = scrolled;

    let score = scoreOf();
    let {container, rerender} = render(<ScoreView score={score} sounding={[0]}/>);
    let scroller = scrollerOf(container);
    Object.defineProperty(scroller, 'scrollWidth', {configurable: true, value: 800});   // same as clientWidth

    rerender(<ScoreView score={score} sounding={[1]} following/>);
    expect(scrolled).toHaveBeenCalled();
    expect(scroller.scrollLeft).toBeFalsy();
});
