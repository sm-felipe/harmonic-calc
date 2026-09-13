// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// react-plot measures its container with ResizeObserver, which jsdom lacks
if (typeof window.ResizeObserver === 'undefined') {
    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

// react-plot measures SVG text with getBBox, which jsdom does not implement
if (typeof window.SVGElement !== 'undefined' && !window.SVGElement.prototype.getBBox) {
    window.SVGElement.prototype.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
}

