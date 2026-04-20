import { useState } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Typography, Toolbar, AppBar, IconButton 
} from '@mui/material';
import { Menu, FileText, HeartHandshake, Zap, Smile, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QuizOnboarding from '../components/QuizOnboarding';

const drawerWidth = 280;

export default function StudentDashboard() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Quizzes'); 
  // By default, first time users land on 'Quizzes' as requested.

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const menuItems = [
    { text: 'Quizzes', icon: <FileText size={20} /> },
    { text: 'Counselor Support', icon: <HeartHandshake size={20} /> },
    { text: 'Wellness and Resources', icon: <Zap size={20} /> },
    { text: 'Fun Activities and Engagement', icon: <Smile size={20} /> },
    { text: 'Mood Calendar', icon: <CalendarDays size={20} /> },
  ];

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>BalanceU</Typography>
      </Toolbar>
      <List sx={{ px: 2, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.text;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => {
                  setActiveTab(item.text);
                  setMobileOpen(false);
                }}
                sx={{ 
                  borderRadius: '16px', 
                  bgcolor: isActive ? '#e6f0eb' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': { bgcolor: '#f0f5f2' }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium', fontSize: '0.95rem' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.default',
          borderBottom: '1px solid #e0dfd6'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap component="div" color="text.primary" fontWeight="bold">
            {activeTab}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: '2px 0 20px rgba(57, 56, 42, 0.05)' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        {activeTab === 'Quizzes' && <QuizOnboarding onSwitchToCounselor={() => setActiveTab('Counselor Support')} />}
        {activeTab === 'Counselor Support' && (
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: '24px', boxShadow: '0 10px 40px rgba(57, 56, 42, 0.04)' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Clinical Support Port</Typography>
            <Typography color="text.secondary">Counselor interface will mount here.</Typography>
          </Box>
        )}
        {activeTab === 'Wellness and Resources' && (
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: '24px' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Wellness & Resources</Typography>
          </Box>
        )}
        {activeTab === 'Fun Activities and Engagement' && (
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: '24px' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Fun Activities</Typography>
          </Box>
        )}
        {activeTab === 'Mood Calendar' && (
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: '24px' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Mood Calendar</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
