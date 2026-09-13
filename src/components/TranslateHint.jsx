import {useState} from "react";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const STORAGE_KEY = 'harmonic-calc.translate-hint-dismissed';

// The app is in English on purpose. Visitors whose browser speaks another
// language get a one-time reminder that the browser itself can translate the
// page; dismissing it is remembered.
export default function TranslateHint({language = navigator.language}) {
    let [open, setOpen] = useState(() => shouldShow(language));

    function dismiss() {
        setOpen(false);
        try {
            window.localStorage.setItem(STORAGE_KEY, '1');
        } catch (error) {
            // storage unavailable (private mode, blocked): the hint simply shows again next time
        }
    }

    return <Snackbar open={open} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
        <Alert severity="info" variant="filled" onClose={dismiss} sx={{maxWidth: 560}}>
            This page is in English. Your browser can translate it: look for the translate icon in the
            address bar (Chrome, Edge, Firefox) or the "aA" menu (Safari), or right-click the page.
        </Alert>
    </Snackbar>;
}

function shouldShow(language) {
    if (!language || language.toLowerCase().startsWith('en')) {
        return false;
    }
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== '1';
    } catch (error) {
        return true;
    }
}
