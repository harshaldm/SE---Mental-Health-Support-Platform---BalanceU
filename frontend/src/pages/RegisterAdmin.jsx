import { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function RegisterAdmin() {
  const [instituteName, setInstituteName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [instituteType, setInstituteType] = useState('');
  const [customInstituteType, setCustomInstituteType] = useState('');
  
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPassword;
  const isTypeValid = instituteType && (instituteType !== 'Others' || customInstituteType.trim() !== '');
  const isNameValid = instituteName.trim().length > 0;
  
  const isValid = isEmailValid && isPasswordMatch && isTypeValid && isNameValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await axios.post('http://localhost:5000/api/auth/register-admin', {
        email,
        password,
        institute_name: instituteName,
        institute_type: instituteType,
        custom_institute_type: customInstituteType
      });
      alert('Institute Foundation & Admin Account created successfully!');
      navigate('/');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

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
          maxWidth: 500, 
          borderRadius: '3rem',
          bgcolor: 'background.paper',
          boxShadow: '0 20px 40px rgba(57, 56, 42, 0.06)' 
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary" sx={{ fontFamily: 'var(--font-display)' }}>
          Foundation
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Register your institute to the BalanceU network.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField 
            label="College/Institute Name" 
            variant="filled" 
            fullWidth 
            value={instituteName}
            onChange={(e) => setInstituteName(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />
          
          <TextField 
            label="Official Institute Email" 
            variant="filled" 
            fullWidth 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={email.length > 0 && !isEmailValid}
            helperText={email.length > 0 && !isEmailValid ? "Enter a valid email" : ""}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />
          
          <TextField 
            label="Password" 
            type="password"
            variant="filled" 
            fullWidth 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />

          <TextField 
            label="Confirm Password" 
            type="password"
            variant="filled" 
            fullWidth 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword.length > 0 && !isPasswordMatch}
            helperText={confirmPassword.length > 0 && !isPasswordMatch ? "Passwords must match" : ""}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />

          <FormControl variant="filled" fullWidth>
            <InputLabel>Institute Type</InputLabel>
            <Select
              value={instituteType}
              onChange={(e) => setInstituteType(e.target.value)}
              disableUnderline
              sx={{ borderRadius: '1.5rem', bgcolor: '#f8f4e5' }}
            >
              <MenuItem value="Engineering College/University">Engineering College/University</MenuItem>
              <MenuItem value="Medical College/University">Medical College/University</MenuItem>
              <MenuItem value="Law College/University">Law College/University</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </Select>
          </FormControl>

          {instituteType === 'Others' && (
             <TextField 
               label="Specify Institute Type" 
               variant="filled" 
               fullWidth 
               value={customInstituteType}
               onChange={(e) => setCustomInstituteType(e.target.value)}
               InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
             />
          )}

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large"
            disabled={!isValid}
            sx={{ 
                mt: 2, 
                py: 2, 
                borderRadius: '50px', 
                fontWeight: 'bold', 
                textTransform: 'none',
                fontSize: '1.1rem'
            }}
          >
            Establish Institute
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
