import {useEffect, useRef, useState} from "react";

// Width of a DOM element, kept up to date as it resizes. Returns the ref to
// attach and the current width (0 until measured).
export default function useContainerWidth() {
    let ref = useRef(null);
    let [width, setWidth] = useState(0);

    useEffect(() => {
        let element = ref.current;
        if (!element) return undefined;
        setWidth(element.clientWidth);
        let observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, width];
}
