import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  LinearProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Assessment, Question } from '../interfaces/Assessment';
import { getAssessmentById, deleteAssessment, getUserAttempts } from '../utils/assessmentService';

// Component definition
const AssessmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // User progress data
  const [progress, setProgress] = useState({
    completed: false,
    score: 0,
    lastAttempt: null as string | null,
  });

  useEffect(() => {
    loadAssessment();
    loadUserProgress();
  }, [id]);

  const loadAssessment = async () => {
    try {
      setIsLoading(true);
      const data = await getAssessmentById(id!);
      setAssessment(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading assessment:', error);
      setError('Failed to load assessment. Please try again later.');
      setIsLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      // Only attempt to load progress if user is logged in
      if (!user) return;
      
      const attempts = await getUserAttempts();
      
      // Find attempts for this assessment
      const assessmentAttempts = attempts.filter(
        (attempt: any) => attempt.assessment?.id === id
      );
      
      if (assessmentAttempts.length > 0) {
        // Get the most recent attempt
        const latestAttempt = assessmentAttempts.sort(
          (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        )[0];
        
        setProgress({
          completed: !!latestAttempt.completedAt,
          score: latestAttempt.score || 0,
          lastAttempt: latestAttempt.completedAt || latestAttempt.startedAt,
        });
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Just log the error but don't show it to user as it's not critical
    }
  };

  const handleQuestionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedQuestion(isExpanded ? panel : false);
  };

  const getQuestionIcon = (question: Question) => {
    switch (question.type) {
      case 'multiple-choice':
        return <QuizIcon />;
      case 'fill-in-blank':
        return <AssignmentIcon />;
      case 'matching':
        return <AssignmentIcon />;
      case 'flashcards':
        return <AssignmentIcon />;
      default:
        return <QuizIcon />;
    }
  };

  const handleDeleteAssessment = async () => {
    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteAssessment(id!);
      navigate('/assessments');
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setError('Failed to delete assessment. Please try again later.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'Assessment not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Header Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {assessment.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={assessment.language} size="small" color="primary" />
              <Chip label={assessment.category} size="small" />
              <Chip label={assessment.level} size="small" />
              {assessment.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
            <Typography variant="body1" paragraph>
              {assessment.description}
            </Typography>
            <Box sx={{ display: 'flex', mt: 3, gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => navigate(`/assessments/${id}/take`)}
              >
                Start Assessment
              </Button>
              {user?.role === 'instructor' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/assessments/${id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAssessment}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assessment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Duration:</Typography>
                  <Typography variant="body2">{assessment.duration} minutes</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Number of Questions:</Typography>
                  <Typography variant="body2">{assessment.questions.length}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Created By:</Typography>
                  <Typography variant="body2">{assessment.createdBy || 'Unknown'}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Last Updated:</Typography>
                  <Typography variant="body2">{assessment.updatedAt || 'Unknown'}</Typography>
                </Box>
                {progress.lastAttempt && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Your Progress
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Last Attempt:</Typography>
                      <Typography variant="body2">
                        {new Date(progress.lastAttempt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Score:</Typography>
                      <Typography variant="body2">{progress.score}%</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">Status:</Typography>
                      <Chip 
                        label={progress.completed ? "Completed" : "In Progress"} 
                        color={progress.completed ? "success" : "warning"} 
                        size="small" 
                      />
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Questions Section */}
      <Typography variant="h5" gutterBottom>
        Questions
      </Typography>
      {assessment.questions.map((question) => (
        <Accordion
          key={question.id}
          expanded={expandedQuestion === question.id}
          onChange={handleQuestionChange(question.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                {getQuestionIcon(question)}
              </ListItemIcon>
              <Box>
                <Typography variant="subtitle1">{question.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {question.type.charAt(0).toUpperCase() + question.type.slice(1)} Question
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Instructions:
              </Typography>
              <Typography variant="body2">{question.instructions}</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Preview content based on question type */}
            {question.type === 'multiple-choice' && question.questions && (
              <List>
                {question.questions.slice(0, 2).map((question, index) => (
                  <ListItem key={question.id} sx={{ display: 'block', mb: 2 }}>
                    <Typography variant="body1" fontWeight="500">
                      {index + 1}. {question.text}
                    </Typography>
                    {question.options?.slice(0, 2).map((option) => (
                      <Box key={option} sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: 1 }}>
                        <RadioButtonUnchecked fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">{option}</Typography>
                      </Box>
                    ))}
                    {question.options && question.options.length > 2 && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1 }}>
                        + {question.options.length - 2} more options
                      </Typography>
                    )}
                  </ListItem>
                ))}
                {question.questions.length > 2 && (
                  <Typography variant="body2" color="text.secondary">
                    + {question.questions.length - 2} more questions
                  </Typography>
                )}
              </List>
            )}
            
            {question.type === 'matching' && question.matchItems && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Terms:
                  </Typography>
                  <List dense>
                    {question.matchItems.slice(0, 3).map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText primary={item.term} />
                      </ListItem>
                    ))}
                    {question.matchItems.length > 3 && (
                      <ListItem>
                        <ListItemText 
                          primary={`+ ${question.matchItems.length - 3} more`} 
                          primaryTypographyProps={{ color: 'text.secondary' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Translations:
                  </Typography>
                  <List dense>
                    {question.matchItems.slice(0, 3).map((item) => (
                      <ListItem key={item.id}>
                        <ListItemText primary={item.translation} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            )}
            
            {question.type === 'flashcards' && question.words && (
              <List>
                {question.words.slice(0, 2).map((word) => (
                  <ListItem key={word.id} sx={{ display: 'block', mb: 2 }}>
                    <Typography variant="subtitle2">{word.term}</Typography>
                    <Typography variant="body2" color="primary">{word.translation}</Typography>
                    {word.example && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                        {word.example}
                      </Typography>
                    )}
                  </ListItem>
                ))}
                {question.words.length > 2 && (
                  <Typography variant="body2" color="text.secondary">
                    + {question.words.length - 2} more flashcards
                  </Typography>
                )}
              </List>
            )}
            
            {question.type === 'fill-in-blank' && question.sentences && (
              <List>
                {question.sentences.slice(0, 2).map((sentence, index) => (
                  <ListItem key={sentence.id} sx={{ display: 'block', mb: 2 }}>
                    <Typography variant="body1">
                      {index + 1}. {sentence.text.replace('[blank]', '________')}
                    </Typography>
                  </ListItem>
                ))}
                {question.sentences.length > 2 && (
                  <Typography variant="body2" color="text.secondary">
                    + {question.sentences.length - 2} more sentences
                  </Typography>
                )}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Materials Section (if any) */}
      {assessment.materials && assessment.materials.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Additional Materials
          </Typography>
          <Paper sx={{ p: 3 }}>
            <List>
              {assessment.materials.map((material, index) => (
                <ListItem key={index} component="a" href={material.url} target="_blank">
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary={material.name}
                    secondary={`${(material.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default AssessmentDetail; 