import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Autocomplete, Paper, IconButton, Stack } from '@mui/material';
import { UploadCloud } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CounselorRegister() {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  
  const [profilePic, setProfilePic] = useState(null);
  const [degreePic, setDegreePic] = useState(null);
  const [licensePic, setLicensePic] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
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

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordMatch = password && password === confirmPassword;
  
  const isValid = selectedInstitute && isEmailValid && isPasswordMatch && 
                  fullName.length > 0 && degreePic && licensePic;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('full_name', fullName);
      formData.append('institute_id', selectedInstitute.id);
      formData.append('specialization', specialization);
      formData.append('experience', experience);
      formData.append('bio', bio);
      
      if (profilePic) formData.append('profile_pic', profilePic);
      formData.append('degree', degreePic);
      formData.append('license', licensePic);

      await axios.post('http://localhost:5000/api/auth/register-counselor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Counselor Registration Submitted! Awaiting Admin Approval.');
      navigate('/');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const FileUploader = ({ label, fileState, setter, required = false }) => (
    <Box sx={{ border: '2px dashed #d1cfc4', borderRadius: '1rem', p: 2, textAlign: 'center', bgcolor: fileState ? '#e6f0eb' : 'transparent' }}>
      <Typography variant="body2" color="text.secondary" fontWeight="bold" mb={1}>{label} {required && '*'}</Typography>
      <Button component="label" variant="outlined" startIcon={<UploadCloud size={18} />} sx={{ borderRadius: '1rem', textTransform: 'none' }}>
        {fileState ? fileState.name : 'Upload File'}
        <input type="file" hidden onChange={(e) => setter(e.target.files[0])} accept="image/*,application/pdf" />
      </Button>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper elevation={0} sx={{ p: 6, width: '100%', maxWidth: 700, borderRadius: '3rem', bgcolor: 'background.paper', boxShadow: '0 20px 40px rgba(57, 56, 42, 0.06)' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="text.primary">
          Clinical Join
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Submit your credentials for verification.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Autocomplete
            options={institutes}
            getOptionLabel={(option) => `${option.name} (${option.type})`}
            onChange={(e, val) => setSelectedInstitute(val)}
            renderInput={(params) => (
              <TextField {...params} label="Select Institute to join *" variant="filled" InputProps={{ ...params.InputProps, disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <TextField label="Full Legal Name *" variant="filled" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
            <TextField label="Professional Email *" variant="filled" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} error={email.length > 0 && !isEmailValid} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <TextField label="Password *" type="password" variant="filled" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
            <TextField label="Confirm Password *" type="password" variant="filled" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={confirmPassword.length > 0 && !isPasswordMatch} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <TextField label="Specialization" variant="filled" fullWidth value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. CBT, Anxiety" InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
            <TextField label="Years of Exp" type="number" variant="filled" fullWidth value={experience} onChange={(e) => setExperience(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />
          </Stack>

          <TextField label="Professional Bio" multiline rows={3} variant="filled" fullWidth value={bio} onChange={(e) => setBio(e.target.value)} InputProps={{ disableUnderline: true, sx: { borderRadius: '1.5rem', bgcolor: '#f8f4e5' } }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <Box flex={1}><FileUploader label="Profile Picture" fileState={profilePic} setter={setProfilePic} /></Box>
            <Box flex={1}><FileUploader label="Degree / Diploma" fileState={degreePic} setter={setDegreePic} required /></Box>
            <Box flex={1}><FileUploader label="License / Cert" fileState={licensePic} setter={setLicensePic} required /></Box>
          </Stack>

          <Button type="submit" variant="contained" color="primary" size="large" disabled={!isValid} sx={{ mt: 2, py: 2, borderRadius: '50px', fontWeight: 'bold', textTransform: 'none', fontSize: '1.1rem' }}>
            Submit Application
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
