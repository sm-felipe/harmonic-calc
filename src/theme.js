import {createTheme} from '@mui/material/styles';

// One deliberate typographic base for the whole app: the platform's UI font,
// tabular numerals where numbers line up, and a light scheme (the colour
// scales for cents and level are designed for a light ground).
const theme = createTheme({
    palette: {
        mode: 'light',
        background: {default: '#fafafa'},
    },
    typography: {
        fontFamily: [
            'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"',
            'Arial', 'sans-serif',
        ].join(', '),
        overline: {letterSpacing: '0.08em'},
    },
    components: {
        MuiTooltip: {
            defaultProps: {arrow: true},
        },
    },
});

export default theme;
