import {useState} from "react";
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import SvgIcon from '@mui/material/SvgIcon';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

export default function TopBar({onMenuClick}) {
    let [copied, setCopied] = useState(null);

    async function copyLink() {
        let link = window.location.href;
        try {
            await navigator.clipboard.writeText(link);
            setCopied({ok: true, link});
        } catch (error) {
            setCopied({ok: false, link});
        }
    }

    return <AppBar position="static" color="default" elevation={0}
                   sx={{borderBottom: 1, borderColor: 'divider'}}>
        <Toolbar variant="dense">
            <IconButton edge="start" onClick={onMenuClick} aria-label="Open menu" sx={{mr: 1}}>
                <MenuIcon/>
            </IconButton>
            <Typography variant="h6" component="h1" translate="no" sx={{fontWeight: 600, mr: 2}}>
                Harmonic Calc
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{display: {xs: 'none', sm: 'block'}}}>
                See and hear the harmonic series of any notes
            </Typography>
            <Box sx={{flexGrow: 1}}/>
            <Tooltip title="Copy a link to this exact configuration">
                <IconButton edge="end" onClick={copyLink} aria-label="Copy link">
                    <LinkIcon/>
                </IconButton>
            </Tooltip>
        </Toolbar>
        <Snackbar open={copied !== null} autoHideDuration={4000} onClose={() => setCopied(null)}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
            <Alert severity={copied && copied.ok ? 'success' : 'info'} onClose={() => setCopied(null)}
                   sx={{maxWidth: 560, wordBreak: 'break-all'}}>
                {copied && copied.ok ? 'Link copied. It reproduces the notes, instruments and tuning on screen.'
                    : copied ? `Copy this link: ${copied.link}` : ''}
            </Alert>
        </Snackbar>
    </AppBar>;
}

function MenuIcon() {
    return <SvgIcon>
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </SvgIcon>;
}

function LinkIcon() {
    return <SvgIcon>
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
    </SvgIcon>;
}
