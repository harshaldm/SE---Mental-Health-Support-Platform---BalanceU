import { useState } from 'react';
import { 
  Box, Typography, Button, Paper, Grid, Radio, RadioGroup, 
  FormControlLabel, FormControl, TextField, LinearProgress, Chip
} from '@mui/material';
import { FileText, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import QuizResultsModal from './QuizResultsModal';

const QUIZ_DATA = {
  'PHQ-9': [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed, or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself — or feeling you are a failure',
    'Trouble concentrating on things, such as reading or TV',
    'Moving or speaking slowly, or being excessively fidgety',
    'Thoughts that you would be better off dead or hurting yourself'
  ],
  'GAD-7': [
    'Feeling nervous, anxious or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen'
  ]
};

const OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' }
];

export default function QuizOnboarding({ onSwitchToCounselor }) {
  const { token } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  const handleStart = (type) => {
    setSelectedQuiz(type);
    setAnswers(Array(QUIZ_DATA[type].length).fill(null));
    setReflections(Array(QUIZ_DATA[type].length).fill(''));
  };

  const handleAnswer = (index, val) => {
    const newArr = [...answers];
    newArr[index] = Number(val);
    setAnswers(newArr);
  };

  const handleReflection = (index, val) => {
    const newRef = [...reflections];
    newRef[index] = val;
    setReflections(newRef);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        quiz_type: selectedQuiz,
        question_responses: QUIZ_DATA[selectedQuiz].map((q, i) => ({
          question: q,
          score: answers[i] || 0,
          text: reflections[i]
        }))
      };

      const res = await axios.post('http://localhost:5000/api/quiz/submit', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResultData(res.data);
    } catch (err) {
      alert('Failed to submit assessment: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = selectedQuiz ? QUIZ_DATA[selectedQuiz].length : 0;
  const answeredQuestions = answers.filter(a => a !== null).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const isComplete = totalQuestions > 0 && answeredQuestions === totalQuestions;

  if (resultData) {
    return <QuizResultsModal resultData={resultData} onClose={() => setResultData(null)} onGetSupport={onSwitchToCounselor} />;
  }

  if (!selectedQuiz) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Clinical Assessments</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Taking a brief assessment helps us understand your current baseline and personalize your support ecosystem.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 15px 40px rgba(57,56,42,0.08)' } }} onClick={() => handleStart('PHQ-9')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#e6f0eb', color: 'primary.main' }}>
                  <FileText />
                </Box>
                <Typography variant="h6" fontWeight="bold">PHQ-9 (Depression)</Typography>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                A standard 9-question instrument used globally to monitor the severity of depression and mood disorders.
              </Typography>
              <Button variant="outlined" endIcon={<ArrowRight size={18} />} sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 'bold' }}>Begin Assessment</Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: '24px', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 15px 40px rgba(57,56,42,0.08)' } }} onClick={() => handleStart('GAD-7')}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#fdf3e8', color: '#d97b29' }}>
                  <ShieldAlert />
                </Box>
                <Typography variant="h6" fontWeight="bold">GAD-7 (Anxiety)</Typography>
              </Box>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                A standard 7-question clinical screening tool used to measure the severity of generalized anxiety disorder.
              </Typography>
              <Button variant="outlined" endIcon={<ArrowRight size={18} />} sx={{ borderRadius: '50px', textTransform: 'none', fontWeight: 'bold' }}>Begin Assessment</Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">{selectedQuiz} Assessment</Typography>
        <Button onClick={() => setSelectedQuiz(null)} color="text.secondary" sx={{ textTransform: 'none' }}>Cancel</Button>
      </Box>

      <Box sx={{ mb: 5, position: 'sticky', top: 80, zIndex: 10, bgcolor: 'background.default', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold">Progress: {answeredQuestions} / {totalQuestions}</Typography>
          <Typography variant="body2" fontWeight="bold" color="primary">{Math.round(progress)}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, bgcolor: '#e0dfd6', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {QUIZ_DATA[selectedQuiz].map((q, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 4, borderRadius: '24px', bgcolor: 'background.paper', border: answers[idx] !== null ? '1px solid #8DA399' : '1px solid transparent' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>{idx + 1}. {q}</Typography>
            
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <RadioGroup 
                row 
                value={answers[idx] !== null ? answers[idx] : ''} 
                onChange={(e) => handleAnswer(idx, e.target.value)}
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                {OPTIONS.map((opt) => (
                  <FormControlLabel 
                    key={opt.value} 
                    value={opt.value} 
                    control={<Radio color="primary" />} 
                    label={<Typography variant="body2" sx={{ fontWeight: answers[idx] === opt.value ? 'bold' : 'normal' }}>{opt.label}</Typography>} 
                    sx={{ flex: 1, m: 0, p: 1, borderRadius: '12px', bgcolor: answers[idx] === opt.value ? '#e6f0eb' : 'transparent', '&:hover': { bgcolor: '#f8f4e5' } }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={2}
              variant="filled"
              label="Why do you feel this way? (Optional Reflection)"
              value={reflections[idx]}
              onChange={(e) => handleReflection(idx, e.target.value)}
              inputProps={{ maxLength: 250 }}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '1rem', bgcolor: '#fffbff' } }}
              helperText={`${reflections[idx].length}/250`}
              FormHelperTextProps={{ sx: { textAlign: 'right' } }}
            />
          </Paper>
        ))}
      </Box>

      <Box sx={{ mt: 5, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!isComplete || isSubmitting}
          onClick={handleSubmit}
          sx={{ py: 2, borderRadius: '50px', fontWeight: 'bold', fontSize: '1.2rem', textTransform: 'none', boxShadow: '0 10px 30px rgba(141,163,153,0.3)' }}
        >
          {isSubmitting ? 'Analyzing with BalanceU AI...' : 'Submit Intelligence'}
        </Button>
      </Box>
    </Box>
  );
}
