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

export default function QuizActive({ quizType, onComplete, onCancel, token: propToken, onConnectWithSupport, onGoToResources }) {
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
  };const progress = ((currentIndex + 1) / questions.length) * 100;

  if (resultData) {
    return (
      <AssessmentResults
        quizType={quizType}
        aiInsights={resultData.aiInsights}
        onReturn={() => onComplete('Quizzes')}
        onConnectWithSupport={
          onConnectWithSupport
            ? () => onConnectWithSupport({
                score:     resultData.aiInsights?.score     ?? null,
                riskLevel: resultData.aiInsights?.riskLevel || null,
                summary:   resultData.aiInsights?.summary   || null,
              })
            : undefined
        }
        onGoToResources={onGoToResources}
      />
    );
  }
  const isNextDisabled = currentAnswer === undefined || currentReflection.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepCount}>
          Q {currentIndex + 1} / {questions.length}
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Quiz type tag */}
        <Text style={styles.quizTag}>{quizType}</Text>

        {/* Question */}
        <Text style={styles.questionText}>{currentQuestion}</Text>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, isSelected && styles.optionBtnActive]}
                onPress={() => {
                  const newAns = [...answers];
                  newAns[currentIndex] = opt.value;
                  setAnswers(newAns);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reflection */}
        <Text style={styles.reflectionLabel}>
          Why do you feel this way? <Text style={{ color: C.sage }}>*</Text>
        </Text>
        <TextInput
          style={styles.reflectionInput}
          multiline
          numberOfLines={4}
          placeholder="Briefly describe your thoughts…"
          placeholderTextColor={C.muted}
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

      {/* Footer / Next button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, isNextDisabled && styles.btnDisabled]}
          disabled={isNextDisabled || isSubmitting}
          onPress={handleNext}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentIndex === questions.length - 1 ? 'Finish & Submit ✓' : 'Next Question →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const C = designTokens.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream, // #FDFBF7
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A7A6E',
  },
  cancelLink: {
    color: C.error,
    fontWeight: '700',
    fontSize: 14,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0D9CE',
    marginHorizontal: 24,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: C.sage, // #556B5F
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  quizTag: {
    fontSize: 12,
    fontWeight: '900',
    color: C.charcoal,
    opacity: 0.5,
    marginBottom: 8,
    letterSpacing: 1.2,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    color: C.charcoal,
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0D9CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionBtnActive: {
    backgroundColor: C.sage, // #556B5F
    borderColor: C.sage,
  },
  optionLabel: {
    fontSize: 16,
    color: C.charcoal,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: '#FFFFFF',
  },
  reflectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: C.charcoal,
    marginBottom: 12,
  },
  reflectionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    height: 120,
    textAlignVertical: 'top',
    color: C.charcoal,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0D9CE',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#7A7A6E',
    marginTop: 8,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    backgroundColor: C.cream,
  },
  nextBtn: {
    backgroundColor: C.sage,
    paddingVertical: 18,
    borderRadius: 100, // Pill shaped
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: {
    backgroundColor: '#CBD5D0',
    shadowOpacity: 0,
    elevation: 0,
  }
});
