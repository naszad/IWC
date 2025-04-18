import React, { useState, useEffect, ChangeEvent, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Divider,
  Card,
  CardContent,
  Alert,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Check,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Assessment } from '../interfaces/Assessment';
import { getAssessmentById, startAssessment, submitAssessment } from '../utils/assessmentService';

interface AssessmentAttempt {
  attemptId: string;
  assessment: {
    id: string;
    title: string;
    description: string;
    questions: any[];
    duration: number;
  };
}

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  skill_type?: string;
  difficulty?: string;
}

const TakeAssessment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);

  // Fetch assessment and start an attempt
  useEffect(() => {
    const startAssessmentAttempt = async () => {
      try {
        setLoading(true);
        
        // First, get the assessment details
        const assessmentData = await getAssessmentById(id!);
        setAssessment(assessmentData);
        
        // Start a new assessment attempt
        const attemptData = await startAssessment(id!);
        setAttempt(attemptData);
        
        // Set initial time based on assessment duration
        if (assessmentData.duration) {
          setTimeRemaining(assessmentData.duration * 60); // Convert minutes to seconds
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error starting assessment:', error);
        setError('Failed to start assessment. Please try again later.');
        setLoading(false);
      }
    };

    startAssessmentAttempt();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || loading || submitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          // Time's up - submit assessment
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemaining, submitting]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!attempt) return;
    
    try {
      setSubmitting(true);
      
      // Log the current questions and the active question for debugging
      console.log('Assessment questions:', questions);
      
      // Extract correctAnswer if available from the questions for debugging
      const questionDebugInfo = questions.map((q: any) => {
        let correctAnswer = '';
        if (q.questions && q.questions[0] && q.questions[0].correctAnswer) {
          correctAnswer = q.questions[0].correctAnswer;
        }
        return {
          id: q.id,
          type: q.type,
          title: q.title || q.question_text,
          correctAnswer
        };
      });
      
      console.log('Question debug info:', questionDebugInfo);
      
      // Format answers for API submission
      const formattedAnswers: Array<{ questionId: string; answer: string }> = [];
      
      // Process user answers
      Object.entries(userAnswers).forEach(([answerId, answer]) => {
        // Check if this is a fill-in-blank answer with format "questionId-sentenceId"
        if (answerId.includes('-')) {
          const [questionId, sentenceId] = answerId.split('-');
          // For fill-in-blank questions, we submit each sentence answer separately
          formattedAnswers.push({
            questionId: sentenceId, // Use sentence ID as the question ID
            answer
          });
        } else {
          // Regular question answer
          formattedAnswers.push({
            questionId: answerId,
            answer
          });
        }
      });
      
      console.log('Submitting assessment attempt:', attempt.attemptId);
      console.log('Formatted answers:', formattedAnswers);
      
      // Submit answers to the API
      const result = await submitAssessment(attempt.attemptId, formattedAnswers);
      console.log('Submission result:', result);
      
      // Store the attempt ID in localStorage so it can be retrieved in the results page
      localStorage.setItem(`lastAttempt-${id}`, attempt.attemptId);
      
      // Redirect to results page
      navigate(`/assessments/${id}/results`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading assessment...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !assessment || !attempt) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Assessment not found or could not be loaded.'}</Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/assessments')}
        >
          Back to Assessments
        </Button>
      </Container>
    );
  }

  const questions = attempt ? attempt.assessment.questions : (assessment?.questions || []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>{attempt ? attempt.assessment.title : assessment?.title}</Typography>
        <Typography variant="body1" paragraph>{attempt ? attempt.assessment.description : assessment?.description}</Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="subtitle1">
            Question {activeStep + 1} of {questions.length}
          </Typography>
          {timeRemaining !== null && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: timeRemaining < 60 ? 'error.light' : 'primary.light',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2
            }}>
              <Typography variant="subtitle1">
                Time remaining: {formatTime(timeRemaining)}
              </Typography>
            </Box>
          )}
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {questions.map((_: any, index: number) => (
            <Step key={index}>
              <StepLabel>{`Q${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Current Question */}
        <Box sx={{ mb: 4 }}>
          {activeStep < questions.length && (
            <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {questions[activeStep].title || questions[activeStep].question_text}
                </Typography>
                
                {questions[activeStep].instructions && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {questions[activeStep].instructions}
                  </Typography>
                )}
                
                {(questions[activeStep].type === 'multiple-choice' || questions[activeStep].question_type === 'multiple_choice') && (
                  <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                    <RadioGroup
                      value={userAnswers[questions[activeStep].id] || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>, value: string) => handleAnswerChange(questions[activeStep].id, value)}
                    >
                      {(questions[activeStep].questions?.[0]?.options || questions[activeStep].options || []).map((option: string, idx: number) => {
                        console.log(`Rendering option: ${option}`);
                        return (
                          <FormControlLabel
                            key={idx}
                            value={option}
                            control={<Radio />}
                            label={option}
                            sx={{ mb: 1 }}
                          />
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                )}
                
                {(questions[activeStep].type === 'fill-in-blank' || questions[activeStep].question_type === 'short_answer') && (
                  <Box sx={{ mt: 2 }}>
                    {questions[activeStep].sentences ? (
                      // Display fill-in-blank sentences
                      <Box>
                        {questions[activeStep].sentences.map((sentence: { id: string; text: string; answer: string }, idx: number) => (
                          <Box key={sentence.id} sx={{ mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {idx + 1}. {sentence.text.replace('[blank]', '_______________')}
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              label="Your answer"
                              variant="outlined"
                              value={userAnswers[`${questions[activeStep].id}-${sentence.id}`] || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerChange(`${questions[activeStep].id}-${sentence.id}`, e.target.value)}
                            />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      // Fallback to original behavior
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={userAnswers[questions[activeStep].id] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerChange(questions[activeStep].id, e.target.value)}
                        placeholder="Type your answer here..."
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
                
                {/* Matching question UI */}
                {questions[activeStep].type === 'matching' && questions[activeStep].matchItems && (
                  <Box sx={{ mt: 2 }}>
                    {questions[activeStep].matchItems.map((item: { id: string; term: string; translation: string }) => (
                      <Box key={item.id} sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>{item.term}</Typography>
                        <Select
                          fullWidth
                          value={userAnswers[item.id] || ''}
                          onChange={(e: SelectChangeEvent<string>, child: ReactNode) => handleAnswerChange(item.id, e.target.value)}
                        >
                          {questions[activeStep].matchItems.map((mi: { id: string; term: string; translation: string }) => (
                            <MenuItem key={mi.id} value={mi.translation}>{mi.translation}</MenuItem>
                          ))}
                        </Select>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Flashcards question UI */}
                {questions[activeStep].type === 'flashcards' && questions[activeStep].words && (
                  <Box sx={{ mt: 2 }}>
                    {questions[activeStep].words.map((word: { id: string; term: string; translation: string; example?: string }) => (
                      <Box key={word.id} sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>{word.term}</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          label="Your answer"
                          variant="outlined"
                          value={userAnswers[word.id] || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerChange(word.id, e.target.value)}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmitAssessment}
                endIcon={<Check />}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TakeAssessment; 