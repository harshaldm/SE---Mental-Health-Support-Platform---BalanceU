import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { ArrowRight, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function QuizResultsModal({ resultData, onClose, onGetSupport }) {
  const { result, ai_sentiment_analysis } = resultData;
  const isElevatedRisk = result.risk_level === 'Medium' || result.risk_level === 'High Risk' || result.risk_level === 'Moderate' || result.risk_level === 'Moderately Severe' || result.risk_level === 'Severe';

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper elevation={0} sx={{ p: 5, borderRadius: '32px', bgcolor: 'background.paper', border: '1px solid #e0dfd6', boxShadow: '0 20px 50px rgba(57,56,42,0.08)' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {isElevatedRisk ? (
             <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#fdf3e8', color: '#d97b29', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <AlertTriangle size={36} />
             </Box>
          ) : (
             <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#e6f0eb', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <ShieldCheck size={36} />
             </Box>
          )}

          <Typography variant="h4" fontWeight="bold" gutterBottom>Assessment Complete</Typography>
          <Typography color="text.secondary">Thank you for sharing your reflections.</Typography>
        </Box>

        <Box sx={{ bgcolor: '#fffbff', p: 4, borderRadius: '24px', mb: 4, border: '1px solid #f0f0ea' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">Clinical Analysis</Typography>
            <Chip 
              label={`Risk Layer: ${result.risk_level}`} 
              color={isElevatedRisk ? 'warning' : 'primary'} 
              sx={{ fontWeight: 'bold' }} 
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Info size={24} color="#8DA399" style={{ flexShrink: 0, marginTop: '2px' }} />
            <Typography variant="body1" lineHeight={1.8} color="text.primary">
              {ai_sentiment_analysis || "Our baseline analysis has processed your cognitive load. No severe text markers were flagged in this immediate session."}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isElevatedRisk && (
            <Button
              variant="contained"
              size="large"
              color="primary"
              fullWidth
              onClick={onGetSupport}
              sx={{ py: 2, borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'none' }}
              endIcon={<ArrowRight />}
            >
              Get Professional Support
            </Button>
          )}
          
          <Button
            variant={isElevatedRisk ? 'outlined' : 'contained'}
            size="large"
            color="primary"
            fullWidth
            onClick={onClose}
            sx={{ py: 2, borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'none' }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
