import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { User, Stethoscope, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegisterSelect() {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3 
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 6, 
          width: '100%', 
          maxWidth: 900, 
          borderRadius: '3rem',
          bgcolor: 'background.paper',
          boxShadow: '0 20px 40px rgba(57, 56, 42, 0.06)' 
        }}
      >
        <Typography variant="h3" component="h1" align="center" gutterBottom fontWeight="bold" color="text.primary" sx={{ fontFamily: 'var(--font-display)' }}>
          Choose Your Role
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" mb={6}>
          Select how you want to join the BalanceU ecosystem.
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          
          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: '2rem', bgcolor: '#f8f4e5', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}}>
              <CardActionArea sx={{ p: 4, height: '100%' }} onClick={() => navigate('/register/student')}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, color: 'primary.main' }}>
                  <User size={48} strokeWidth={1.5} />
                </Box>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Join as a Student</Typography>
                  <Typography variant="body2" color="text.secondary">Create your verified student profile and access campus mental health tools.</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: '2rem', bgcolor: '#f8f4e5', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}}>
              <CardActionArea sx={{ p: 4, height: '100%' }} onClick={() => navigate('/register/counselor')}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, color: 'primary.main' }}>
                  <Stethoscope size={48} strokeWidth={1.5} />
                </Box>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Join as a Counselor</Typography>
                  <Typography variant="body2" color="text.secondary">Register as a clinical professional assigned to an existing institute.</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card elevation={0} sx={{ borderRadius: '2rem', bgcolor: '#f8f4e5', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}}>
              <CardActionArea sx={{ p: 4, height: '100%' }} onClick={() => navigate('/register/admin')}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, color: 'primary.main' }}>
                  <School size={48} strokeWidth={1.5} />
                </Box>
                <CardContent sx={{ p: 0, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Register your Institute</Typography>
                  <Typography variant="body2" color="text.secondary">Deploy the BalanceU platform and build your custom foundation.</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
}
