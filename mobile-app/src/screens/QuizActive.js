import React, { useState } from 'react';
import AssessmentResults from './AssessmentResults';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { designTokens, globalStyles } from '../globalStyles';
import { BASE_URL as API_URL } from '../config/apiConfig';

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

export default function QuizActive({ quizType, onComplete, onCancel, token: propToken }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  const questions = QUIZ_DATA[quizType] || [];
  const currentQuestion = questions[currentIndex];
  
  const currentAnswer = answers[currentIndex];
  const currentReflection = reflections[currentIndex] || '';

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      // PERSISTENT RETRIEVAL: Pull from AsyncStorage as source of truth
      const storedToken = await AsyncStorage.getItem('userToken');
      const token = (storedToken || propToken);

      if (!token || token === 'undefined') {
         alert("Session Error: Please logout and login again to continue.");
         setIsSubmitting(false);
         return;
      }

      const payload = {
        quiz_type: quizType,
        question_responses: questions.map((q, i) => ({
          question: q,
          score: answers[i] !== undefined ? answers[i] : 0,
          text: reflections[i] || ''
        }))
      };

      const fullUrl = `${API_URL}/api/quiz/submit`;

      const res = await axios.post(fullUrl, payload, {
        headers: { Authorization: `Bearer ${token.trim()}` },
        timeout: 15000 
      });

      setResultData(res.data);
    } catch (error) {
      const errorMsg = error.response?.data?.details || error.response?.data?.error;
      const friendlyMsg = errorMsg || "We couldn't submit your assessment right now. Please check your connection and try again.";
      alert(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (resultData) {
    return (
      <AssessmentResults 
        quizType={quizType}
        aiInsights={resultData.aiInsights}
        onReturn={() => onComplete('Quizzes')}
      />
    );
  }


  const isNextDisabled = currentAnswer === undefined || currentReflection.trim().length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepCount}>Question {currentIndex + 1} of {questions.length}</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionText}>{currentQuestion}</Text>

        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt.value} 
              style={[
                styles.optionBtn, 
                currentAnswer === opt.value && styles.optionBtnActive
              ]}
              onPress={() => {
                const newAns = [...answers];
                newAns[currentIndex] = opt.value;
                setAnswers(newAns);
              }}
            >
              <Text style={[
                styles.optionLabel,
                currentAnswer === opt.value && styles.optionLabelActive
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.reflectionLabel}>Why do you feel this way? (250 chars max)</Text>
        <TextInput 
          style={styles.reflectionInput}
          multiline
          numberOfLines={4}
          placeholder="Briefly describe your thoughts..."
          placeholderTextColor={designTokens.colors.onSurfaceVariant}
          maxLength={250}
          value={currentReflection}
          onChangeText={(text) => {
            const newRef = [...reflections];
            newRef[currentIndex] = text;
            setReflections(newRef);
          }}
        />
        <Text style={styles.charCount}>{currentReflection.length}/250</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            globalStyles.buttonPrimary, 
            isNextDisabled && styles.btnDisabled,
            { width: '100%' }
          ]}
          disabled={isNextDisabled || isSubmitting}
          onPress={handleNext}
        >
          {isSubmitting ? (
             <ActivityIndicator color={designTokens.colors.onPrimary} />
          ) : (
             <Text style={globalStyles.buttonText}>
               {currentIndex === questions.length - 1 ? 'Finish & Submit' : 'Next Question'}
             </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '700',
    color: designTokens.colors.onSurfaceVariant,
  },
  cancelLink: {
    color: designTokens.colors.error,
    fontWeight: '600',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#eee',
    marginHorizontal: 24,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8DA399',
  },
  content: {
    paddingHorizontal: 24,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
    marginBottom: 32,
    lineHeight: 30,
  },
  optionsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  optionBtn: {
    backgroundColor: designTokens.colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionBtnActive: {
    backgroundColor: '#e6f0eb',
    borderColor: '#8DA399',
  },
  optionLabel: {
    fontSize: 16,
    color: designTokens.colors.onSurface,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: '#4e635a',
  },
  reflectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: designTokens.colors.onSurface,
    marginBottom: 8,
  },
  reflectionInput: {
    backgroundColor: designTokens.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    color: designTokens.colors.onSurface,
    fontSize: 16,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: designTokens.colors.onSurfaceVariant,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  btnDisabled: {
    backgroundColor: '#cbd5d0',
  }
});
