import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon, 
  ArrowBack,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUserAttempts, getAssessmentResults } from '../utils/assessmentService';

interface AssessmentResults {
  attemptId: string;
  assessment_id: string;
  title: string;
  completion_date: string;
  score: number;
  passing_score: number;
  time_spent: number; // in seconds
  proficiency_changes: {
    [key: string]: number;
  };
  questions: Array<{
    id: string;
    question_text: string;
    your_answer: string;
    correct_answer?: string;
    is_correct?: boolean;
    explanation?: string;
    evaluation?: string;
    score?: number;
    max_score?: number;
  }>;
  recommendations: string[];
}

const AssessmentResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Check if we have a stored attempt ID from the assessment that was just taken
      const storedAttemptId = localStorage.getItem(`lastAttempt-${id}`);
      console.log('Stored attempt ID from localStorage:', storedAttemptId);
      
      if (storedAttemptId) {
        try {
          // Try to get results using the stored attempt ID
          const resultsData = await getAssessmentResults(storedAttemptId);
          console.log('Results data from stored attempt ID:', resultsData);
          
          // Get assessment details to populate the UI
          const attempts = await getUserAttempts();
          const matchingAttempt = attempts.find((a: any) => a.id === storedAttemptId);
          
          if (matchingAttempt && resultsData) {
            setResults({
              attemptId: storedAttemptId,
              assessment_id: id || '',
              title: matchingAttempt.assessment?.title || 'Assessment',
              completion_date: matchingAttempt.completedAt,
              score: matchingAttempt.score,
              passing_score: 70,
              time_spent: matchingAttempt.timeSpent || 0,
              proficiency_changes: resultsData.proficiency_changes || {
                vocabulary: 2,
                grammar: 1,
                overall: 2,
              },
              questions: resultsData.questions || [],
              recommendations: resultsData.recommendations || [
                'Continue practicing with more assessments',
                'Review incorrect answers to improve understanding'
              ],
            });
            
            setLoading(false);
            // Clear the stored attempt ID after successful retrieval
            localStorage.removeItem(`lastAttempt-${id}`);
            return;
          }
        } catch (error) {
          console.error('Error fetching results with stored attempt ID:', error);
          // Continue with the normal flow if this fails
        }
      }
      
      // First, get user attempts to find the correct attempt ID for this assessment
      const attempts = await getUserAttempts();
      
      console.log('Assessment ID from URL:', id);
      console.log('All user attempts:', attempts);
      
      // Find the most recent completed attempt for this assessment
      // Check both string and number ID formats, as the backend might return numbers while the router params are strings
      const assessmentAttempts = attempts.filter(
        (attempt: any) => {
          console.log('Comparing:', {
            attemptAssessmentId: attempt.assessment?.id || attempt.assessmentId,
            urlId: id,
            completedAt: attempt.completedAt
          });
          
          // Check all possible ID locations and formats
          const attemptAssessmentId = attempt.assessment?.id || attempt.assessmentId;
          return (
            (attemptAssessmentId === id || 
             attemptAssessmentId === Number(id) || 
             String(attemptAssessmentId) === id) && 
            attempt.completedAt
          );
        }
      );
      
      console.log('Filtered assessment attempts:', assessmentAttempts);
      
      if (assessmentAttempts.length === 0) {
        setError('No completed assessment attempt found');
        setLoading(false);
        return;
      }
      
      // Get the most recent attempt
      const latestAttempt = assessmentAttempts.sort(
        (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )[0];
      
      console.log('Latest attempt:', latestAttempt);
      
      // Now get the detailed results for this attempt
      const resultsData = await getAssessmentResults(latestAttempt.id);
      console.log('Results data:', resultsData);
      
      setResults({
        attemptId: latestAttempt.id,
        assessment_id: id || '',
        title: latestAttempt.assessment.title,
        completion_date: latestAttempt.completedAt,
        score: latestAttempt.score,
        passing_score: 70, // This might come from the assessment itself in a real API
        time_spent: latestAttempt.timeSpent || 0,
        proficiency_changes: resultsData.proficiency_changes || {
          vocabulary: 2,
          grammar: 1,
          overall: 2,
        },
        questions: resultsData.questions || [],
        recommendations: resultsData.recommendations || [
          'Continue practicing with more assessments',
          'Review incorrect answers to improve understanding'
        ],
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      setError('Failed to load assessment results. Please try again later.');
      setLoading(false);
    }
  };

  // Format time spent as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading assessment results...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !results) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Assessment results not found or could not be loaded.'}</Alert>
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

  // Calculate some statistics
  const totalQuestions = results.questions.length;
  const correctAnswers = results.questions.filter(q => q.is_correct).length;
  const passedAssessment = results.score >= results.passing_score;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Results Summary Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>{results.title}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Completed on {new Date(results.completion_date).toLocaleDateString()}
            </Typography>
          </Box>
          <Chip 
            label={passedAssessment ? 'PASSED' : 'FAILED'} 
            color={passedAssessment ? 'success' : 'error'}
            size="medium"
            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" align="center" gutterBottom>
                  {results.score}%
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Your Score
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={results.score} 
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  color={passedAssessment ? 'success' : 'error'}
                />
                <Typography variant="caption" display="block" align="center" sx={{ mt: 0.5 }}>
                  Passing Score: {results.passing_score}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" align="center" gutterBottom>
                  {correctAnswers}/{totalQuestions}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Correct Answers
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  {Array.from({ length: totalQuestions }).map((_, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        mx: 0.5,
                        bgcolor: index < correctAnswers ? 'success.main' : 'error.main'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" align="center" gutterBottom>
                  {formatTime(results.time_spent)}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Time Spent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Proficiency Changes */}
        <Typography variant="h6" gutterBottom>Proficiency Improvements</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(results.proficiency_changes).map(([skill, change]: [string, any]) => (
            <Grid item xs={6} sm={4} key={skill}>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{skill}</Typography>
                </Box>
                <Typography variant="h6" color="primary">+{change}%</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Detailed Question Review */}
        <Typography variant="h6" gutterBottom>Question Review</Typography>

        <List>
          {results.questions.map((question: any, index: number) => (
            <React.Fragment key={question.id}>
              <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', py: 2 }}>
                <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {question.is_correct !== undefined ? (
                      question.is_correct ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <CancelIcon color="error" />
                      )
                    ) : (
                      <StarIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1">
                        {`Question ${index + 1}: ${question.question_text}`}
                      </Typography>
                    }
                  />
                </Box>

                <Box sx={{ pl: 4.5, width: '100%' }}>
                  {/* For multiple choice questions */}
                  {question.your_answer && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Your answer:</strong> {question.your_answer}
                      </Typography>
                      {!question.is_correct && question.correct_answer && (
                        <Typography variant="body2" color="error.main">
                          <strong>Correct answer:</strong> {question.correct_answer}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* For written responses */}
                  {question.evaluation && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Your response:</strong> {question.your_answer}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          <strong>Score:</strong> {question.score}/{question.max_score}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(question.score / question.max_score) * 100}
                          sx={{ width: 100, ml: 1, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Feedback:</strong> {question.evaluation}
                      </Typography>
                    </Box>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'background.default', 
                      borderLeft: '4px solid', 
                      borderColor: 'primary.main',
                      mt: 1 
                    }}>
                      <Typography variant="body2">{question.explanation}</Typography>
                    </Box>
                  )}
                </Box>
              </ListItem>
              {index < results.questions.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Recommendations */}
        <Typography variant="h6" gutterBottom>Recommendations</Typography>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <SchoolIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Next Steps for Improvement</Typography>
            </Box>
            <List disablePadding>
              {results.recommendations.map((recommendation: string, index: number) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2">• {recommendation}</Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/assessments')}
          >
            Back to Assessments
          </Button>
          
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AssessmentResults; 