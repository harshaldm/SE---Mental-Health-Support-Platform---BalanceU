import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, Paper, Autocomplete
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function StudentRegister() {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [schema, setSchema] = useState([]);
  
  // Basic Auth
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Dynamic JSON Form Data
  const [customData, setCustomData] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch institute list on load
    const fetchInstitutes = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/institutes/list');
        setInstitutes(res.data.institutes);
      } catch (err) {
        console.error('Failed to load institutes', err);
      }
    };
    fetchInstitutes();
  }, []);

  const handleInstituteChange = async (event, newValue) => {
    setSelectedInstitute(newValue);
    setSchema([]); // Reset schema initially
    setCustomData({}); // Reset answers
    if (newValue) {
      try {
        const res = await axios.get(`http://localhost:5000/api/institutes/${newValue.id}/form-schema`);
        setSchema(res.data.schema || []);
      } catch (err) {
        console.error('Failed to load schema', err);
      }
    }
  };

  const handleCustomDataChange = (label, value) => {
    setCustomData(prev => ({ ...prev, [label]: value }));
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPassword;
  
  // Basic validation that all hardcoded generic fields are valid
  const isValid = selectedInstitute && isEmailValid && isPasswordMatch && email.length > 0 && fullName.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      await axios.post('http://localhost:5000/api/auth/register-student', {
        email,
        password,
        full_name: fullName,
        institute_id: selectedInstitute.id,
        custom_data: customData,
      });
      alert('Registration Successful!');
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
          maxWidth: 600, 
          borderRadius: '3rem',
          bgcolor: 'background.paper',
          boxShadow: '0 20px 40px rgba(57, 56, 42, 0.06)' 
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary" sx={{ fontFamily: 'var(--font-display)' }}>
          Join BalanceU
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Create your verified student profile.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Autocomplete
            options={institutes}
            getOptionLabel={(option) => `${option.name} (${option.type})`}
            onChange={handleInstituteChange}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Select Your Institute" 
                variant="filled" 
                InputProps={{ ...params.InputProps, disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
              />
            )}
          />

          <TextField 
            label="Full Name" 
            variant="filled" 
            fullWidth 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />

          <TextField 
            label="College/University Email" 
            variant="filled" 
            fullWidth 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={email.length > 0 && !isEmailValid}
            helperText={email.length > 0 && !isEmailValid ? "Enter a valid email" : ""}
            InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
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
              InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }}
            />
          </Box>

          {/* Conditional Rendering of Institute Schema */}
          {schema.length > 0 && (
            <Box sx={{ mt: 2, p: 3, borderRadius: '1.5rem', bgcolor: '#fff', border: '1px solid #e0dfd6' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 3 }}>
                Required Details for {selectedInstitute?.name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {schema.map((f, i) => (
                  <Box key={i}>
                    {f.type === 'Dropdown' ? (
                      <FormControl variant="filled" fullWidth>
                        <InputLabel>{f.label} *</InputLabel>
                        <Select 
                          disableUnderline 
                          sx={{ borderRadius: '1rem', bgcolor: '#f8f4e5' }}
                          value={customData[f.label] || ''}
                          onChange={(e) => handleCustomDataChange(f.label, e.target.value)}
                        >
                          {f.options.map((opt, oIdx) => <MenuItem key={oIdx} value={opt}>{opt}</MenuItem>)}
                        </Select>
                      </FormControl>
                    ) : f.type === 'Date/Calendar' ? (
                      <TextField 
                        label={`${f.label} *`} 
                        type="date" 
                        variant="filled" 
                        fullWidth 
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#f8f4e5' } }}
                        value={customData[f.label] || ''}
                        onChange={(e) => handleCustomDataChange(f.label, e.target.value)}
                      />
                    ) : (
                      <TextField 
                        label={`${f.label} *`} 
                        variant="filled" 
                        fullWidth 
                        type={f.type === 'Number' ? 'number' : f.type === 'Phone' ? 'tel' : 'text'}
                        InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#f8f4e5' } }}
                        value={customData[f.label] || ''}
                        onChange={(e) => handleCustomDataChange(f.label, e.target.value)}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large"
            disabled={!isValid || (schema.length > 0 && Object.keys(customData).length < schema.length)}
            sx={{ 
                mt: 2, 
                py: 2, 
                borderRadius: '50px', 
                fontWeight: 'bold', 
                textTransform: 'none',
                fontSize: '1.1rem'
            }}
          >
            Create Verified Profile
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
