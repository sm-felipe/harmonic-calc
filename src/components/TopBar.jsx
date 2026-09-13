import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import SvgIcon from '@mui/material/SvgIcon';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

export default function TopBar({onMenuClick}) {
    return <AppBar position="static" color="default" elevation={0}
                   sx={{borderBottom: 1, borderColor: 'divider'}}>
        <Toolbar variant="dense">
            <IconButton edge="start" onClick={onMenuClick} aria-label="Open menu" sx={{mr: 1}}>
                <MenuIcon/>
            </IconButton>
            <Typography variant="h6" component="h1" sx={{fontWeight: 600}}>
                Harmonic Calc
            </Typography>
        </Toolbar>
    </AppBar>;
}

function MenuIcon() {
    return <SvgIcon>
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
    </SvgIcon>;
}
