import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, Paper, IconButton, Divider, Grid 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [fields, setFields] = useState([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Text');
  const [options, setOptions] = useState('');
  const [pendingCounselors, setPendingCounselors] = useState([]);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/institutes/${user.institute_id}/form-schema`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.schema) {
          setFields(res.data.schema);
        }
      } catch (error) {
        console.error('Failed to fetch schema', error);
      }
    };

    const fetchPendingCounselors = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/admin/pending-counselors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filteredCounselors = res.data.counselors.filter(c => String(c.institute_id) === String(user.institute_id));
        setPendingCounselors(filteredCounselors);
      } catch (error) {
        console.error('Failed to fetch pending counselors', error);
      }
    };

    if (user?.institute_id) {
      fetchSchema();
      fetchPendingCounselors();
    }
  }, [user, token]);

  const handleHire = async (counselorId) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/hire-counselor/${counselorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingCounselors(pendingCounselors.filter(c => c.id !== counselorId));
      alert('Counselor hired successfully!');
    } catch (error) {
      alert('Failed to hire counselor: ' + error.message);
    }
  };

  const handleAddField = () => {
    if (!label) return;
    const newField = {
      label,
      type,
      options: type === 'Dropdown' ? options.split(',').map(o => o.trim()).filter(o => o) : [],
      required: true, // Always true as requested
    };
    setFields([...fields, newField]);
    setLabel('');
    setOptions('');
  };

  const handleRemoveField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const saveSchema = async () => {
    try {
      await axios.patch('http://localhost:5000/api/institutes/schema', {
        institute_id: user.institute_id,
        schema: fields
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Registration Schema published successfully!');
    } catch (error) {
      alert('Failed to save schema: ' + error.message);
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ mb: 4, fontWeight: 'bold' }}>Registration Form Builder</Typography>

      <Grid container spacing={4}>
        {/* Editor Pane */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '2rem', bgcolor: 'background.paper' }}>
            <Typography variant="h5" sx={{ mb: 1 }}>Add New Field</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Note: Basic fields (Full Name, Email, Password, Confirm Password, and Select Your Institute) are included by default. You only need to add custom institutional fields (e.g., Roll No, Hostel, Course) below.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="Field Label (e.g. Hostel Room No)" 
                variant="filled" 
                value={label} 
                onChange={(e) => setLabel(e.target.value)} 
                InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#f8f4e5' } }}
              />
              
              <FormControl variant="filled">
                <InputLabel>Input Type</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disableUnderline
                  sx={{ borderRadius: '1rem', bgcolor: '#f8f4e5' }}
                >
                  <MenuItem value="Text">Text</MenuItem>
                  <MenuItem value="Number">Number</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Date/Calendar">Date/Calendar</MenuItem>
                  <MenuItem value="Dropdown">Dropdown / Select</MenuItem>
                </Select>
              </FormControl>

              {type === 'Dropdown' && (
                <TextField 
                  label="Options (comma separated)" 
                  variant="filled" 
                  value={options} 
                  onChange={(e) => setOptions(e.target.value)} 
                  InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#f8f4e5' } }}
                  placeholder="Red, Blue, Green"
                />
              )}

              <Button 
                variant="contained" 
                onClick={handleAddField} 
                disabled={!label}
                sx={{ borderRadius: '2rem', py: 1.5, mt: 1, textTransform: 'none', fontWeight: 'bold' }}
              >
                Add Field
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h5" sx={{ mb: 2 }}>Current Fields</Typography>
            {fields.map((field, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, mb: 1, bgcolor: '#f8f4e5', borderRadius: '1rem' }}>
                <Box>
                  <Typography fontWeight="bold">{field.label}</Typography>
                  <Typography variant="body2" color="text.secondary">Type: {field.type}</Typography>
                </Box>
                <Button color="error" onClick={() => handleRemoveField(idx)}>Remove</Button>
              </Box>
            ))}

            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              onClick={saveSchema}
              sx={{ borderRadius: '2rem', py: 1.5, mt: 3, textTransform: 'none', fontSize: '1.1rem' }}
            >
              Publish Schema
            </Button>
          </Paper>
        </Grid>

        {/* Live Preview Pane */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '2rem', bgcolor: '#f8f4e5', height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 1 }}>Live Preview</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>This is what students will see.</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {fields.map((f, i) => (
                <Box key={i}>
                  {f.type === 'Dropdown' ? (
                    <FormControl variant="filled" fullWidth>
                      <InputLabel>{f.label} *</InputLabel>
                      <Select disableUnderline sx={{ borderRadius: '1rem', bgcolor: '#fff' }} value="">
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
                      InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#fff' } }}
                    />
                  ) : (
                    <TextField 
                      label={`${f.label} *`} 
                      variant="filled" 
                      fullWidth 
                      InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#fff' } }}
                    />
                  )}
                </Box>
              ))}
              {fields.length === 0 && (
                <Typography color="text.secondary" textAlign="center">No fields added yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Counselor Pending Verifications */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Pending Counselor Approvals</Typography>
        {pendingCounselors.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: '2rem', bgcolor: '#f8f4e5', textAlign: 'center' }}>
            <Typography color="text.secondary">No clinical pending requests currently.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {pendingCounselors.map((c) => (
              <Grid item xs={12} md={6} lg={4} key={c.id}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: '2rem', bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box 
                      component="img" 
                      src={c.profile_metadata?.documents?.profile_pic ? `http://localhost:5000/uploads/${c.profile_metadata?.documents?.profile_pic}` : 'https://via.placeholder.com/50'}
                      sx={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <Box>
                      <Typography fontWeight="bold" variant="h6">{c.profile_metadata?.full_name}</Typography>
                      <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="body2"><b>Specialization:</b> {c.profile_metadata?.specialization || 'N/A'}</Typography>
                    <Typography variant="body2"><b>Experience:</b> {c.profile_metadata?.experience || 'N/A'} years</Typography>
                    <Typography variant="body2"><b>Bio:</b> {c.profile_metadata?.bio || 'N/A'}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {c.profile_metadata?.documents?.degree && (
                      <Button size="small" variant="outlined" sx={{ borderRadius: '1rem', textTransform: 'none' }} onClick={() => window.open(`http://localhost:5000/uploads/${c.profile_metadata.documents.degree}`, '_blank')}>
                        View Degree
                      </Button>
                    )}
                    {c.profile_metadata?.documents?.license && (
                      <Button size="small" variant="outlined" sx={{ borderRadius: '1rem', textTransform: 'none' }} onClick={() => window.open(`http://localhost:5000/uploads/${c.profile_metadata.documents.license}`, '_blank')}>
                        View License
                      </Button>
                    )}
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={() => handleHire(c.id)}
                    sx={{ borderRadius: '2rem', py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    Hire / Approve
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

    </Box>
  );
}
