import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';

// Side panel opened from the hamburger menu. Options go inside the
// `children`; for now it only carries its header.
export default function OptionsDrawer({open, onClose, children}) {
    return <Drawer anchor="left" open={open} onClose={onClose}>
        <Box role="presentation" sx={{width: 300, maxWidth: '85vw'}}>
            <Stack direction="row" sx={{alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5}}>
                <Typography variant="h6" component="h2">Options</Typography>
                <IconButton onClick={onClose} aria-label="Close menu" edge="end">
                    <CloseIcon/>
                </IconButton>
            </Stack>
            <Divider/>
            <Box sx={{p: 2}}>
                {children || (
                    <Typography variant="body2" color="text.secondary">
                        More options will live here.
                    </Typography>
                )}
            </Box>
        </Box>
    </Drawer>;
}

function CloseIcon() {
    return <SvgIcon>
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </SvgIcon>;
}
