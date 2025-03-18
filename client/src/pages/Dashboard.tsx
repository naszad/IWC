import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  EmojiEvents,
  Timeline,
  School,
  Language,
  MenuBook,
  Headphones,
  SpeakerNotes,
  Create,
  Assessment as AssessmentIcon,
  QuestionAnswer,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUserProficiencyData } from '../utils/proficiencyService';
import { ProficiencyData, SkillType, ProficiencyLevel } from '../interfaces/Proficiency';
import api from '../utils/api';

// Define assessment types
type AssessmentType = 'vocabulary' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'comprehensive';

// Define interfaces for our data types
interface Assessment {
  id: string;
  title: string;
  category: AssessmentType;
  level: ProficiencyLevel;
  language: string;
}

interface UpcomingAssessment extends Assessment {
  dueDate?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

interface CompletedAssessment {
  id: string;
  assessment: {
    id: string;
    title: string;
    language: string;
    level: ProficiencyLevel;
    category: AssessmentType;
  };
  completedAt: string;
  score: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proficiencyLoading, setProficiencyLoading] = useState(true);
  const [proficiencyError, setProficiencyError] = useState<string | null>(null);
  const [proficiencyData, setProficiencyData] = useState<ProficiencyData | null>(null);
  
  // Assessment states
  const [upcomingAssessments, setUpcomingAssessments] = useState<UpcomingAssessment[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<CompletedAssessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [assessmentsError, setAssessmentsError] = useState<string | null>(null);
  
  // Mock achievements data - would be fetched from an API in a real app
  const achievements: Achievement[] = [
    {
      id: 1,
      name: 'First Assessment Completed',
      description: 'Completed your first English assessment',
      icon: <EmojiEvents color="primary" />,
    },
    {
      id: 2,
      name: 'Vocabulary Master',
      description: 'Scored over 90% on vocabulary assessments',
      icon: <MenuBook color="primary" />,
    },
    {
      id: 3,
      name: 'Listening Pro',
      description: 'Completed 5 English listening assessments',
      icon: <Headphones color="primary" />,
    },
  ];

  // Fetch proficiency data when component mounts
  useEffect(() => {
    const fetchProficiencyData = async () => {
      if (!user) return;
      
      try {
        setProficiencyLoading(true);
        const data = await getUserProficiencyData();
        setProficiencyData(data);
        setProficiencyError(null);
      } catch (err: any) {
        console.error('Failed to fetch proficiency data:', err);
        
        // Check if this is a 404 error (no data found)
        if (err.response && err.response.status === 404) {
          // Set proficiencyData to an empty state instead of showing an error
          setProficiencyData({
            userId: user?.id || 0,
            username: user?.username || '',
            currentLevel: 'A1',
            startLevel: 'A1',
            progressPercentage: 0,
            startDate: new Date().toISOString(),
            studyHours: 0,
            completedQuestions: 0,
            vocabMastered: 0,
            assessmentHistory: [],
            skillBreakdown: {
              vocabulary: 0,
              grammar: 0,
              reading: 0,
              listening: 0,
              speaking: 0,
              writing: 0
            },
            recentActivities: [],
            achievements: []
          });
          setProficiencyError(null);
        } else {
          // For other errors, show an error message
          setProficiencyError('Failed to load proficiency data. Please try again later.');
        }
      } finally {
        setProficiencyLoading(false);
      }
    };
    
    fetchProficiencyData();
  }, [user]);
  
  // Fetch assessment data
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!user) return;
      
      try {
        setAssessmentsLoading(true);
        
        // Get all available assessments
        const assessmentsResponse = await api.get('/assessments');
        const allAssessments = assessmentsResponse.data;
        
        // Get user's assessment attempts
        const attemptsResponse = await api.get('/assessments/user/attempts');
        const userAttempts = attemptsResponse.data;
        
        // Prepare upcoming assessments
        // In a real app, there might be a specific endpoint for recommended or upcoming assessments
        const upcAssessments = allAssessments
          .slice(0, 3) // Just take first 3 for now
          .map((assessment: Assessment) => {
            // Check if user has attempted this assessment
            const attempt = userAttempts.find(
              (a: any) => a.assessment?.id === assessment.id
            );
            
            let status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
            if (attempt) {
              status = attempt.completedAt ? 'Completed' : 'In Progress';
            }
            
            return {
              ...assessment,
              status
            };
          })
          .filter((a: UpcomingAssessment) => a.status !== 'Completed');
        
        setUpcomingAssessments(upcAssessments);
        
        // Prepare completed assessments
        const compAssessments = userAttempts
          .filter((attempt: any) => attempt.completedAt)
          .sort((a: any, b: any) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          )
          .slice(0, 3); // Just take most recent 3
        
        setCompletedAssessments(compAssessments);
        setAssessmentsLoading(false);
        setAssessmentsError(null);
      } catch (error) {
        console.error('Failed to fetch assessment data:', error);
        setAssessmentsError('Failed to load assessment data');
        setAssessmentsLoading(false);
      }
    };
    
    fetchAssessmentData();
  }, [user]);

  // Function to get the icon based on assessment type
  const getAssessmentTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'vocabulary':
        return <MenuBook fontSize="small" />;
      case 'listening':
        return <Headphones fontSize="small" />;
      case 'speaking':
        return <SpeakerNotes fontSize="small" />;
      case 'writing':
        return <Create fontSize="small" />;
      case 'grammar':
        return <School fontSize="small" />;
      case 'comprehensive':
      default:
        return <Language fontSize="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome Back, {user?.firstName || 'Learner'}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Track your language learning progress and take assessments to improve your skills.
      </Typography>

      <Grid container spacing={3}>
        {/* Language Assessments Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Upcoming Assessments</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/assessments')}
              >
                View All
              </Button>
            </Box>
            {assessmentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : assessmentsError ? (
              <Alert severity="error">{assessmentsError}</Alert>
            ) : upcomingAssessments.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No upcoming assessments available.
                </Typography>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => navigate('/assessments')}
                  sx={{ mt: 1 }}
                >
                  Browse Assessments
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {upcomingAssessments.map((assessment) => (
                  <Grid item xs={12} key={assessment.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="h6">{assessment.title}</Typography>
                            {assessment.dueDate && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                              >
                                Available until: {assessment.dueDate}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                icon={getAssessmentTypeIcon(assessment.category)} 
                                label={assessment.category} 
                                size="small" 
                              />
                              <Chip 
                                label={`Level: ${assessment.level}`} 
                                size="small" 
                                color="primary" 
                              />
                              <Chip
                                label={assessment.status}
                                size="small"
                                color={assessment.status === 'In Progress' ? 'secondary' : 'default'}
                              />
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/assessments/${assessment.id}/take`)}
                          >
                            {assessment.status === 'In Progress' ? 'Continue' : 'Start'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Recent Assessment Results</Typography>
            </Box>
            {assessmentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
              </Box>
            ) : assessmentsError ? (
              <Alert severity="error">{assessmentsError}</Alert>
            ) : completedAssessments.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  You haven't completed any assessments yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {completedAssessments.map((attempt) => (
                  <Grid item xs={12} key={attempt.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="h6">{attempt.assessment.title}</Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Completed: {new Date(attempt.completedAt).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                icon={getAssessmentTypeIcon(attempt.assessment.category)} 
                                label={attempt.assessment.category} 
                                size="small" 
                              />
                              <Chip label={`Score: ${attempt.score}%`} size="small" />
                              <Chip 
                                label={`Level: ${attempt.assessment.level}`} 
                                size="small" 
                                color="primary" 
                              />
                            </Box>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/assessments/${attempt.assessment.id}/results`)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Achievements and Language Proficiency Stats */}
        <Grid item xs={12} md={4}>
          {/* Language Proficiency */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Language Proficiency
              </Typography>
              <Button 
                size="small" 
                variant="text" 
                onClick={() => navigate('/proficiency')}
              >
                View Details
              </Button>
            </Box>
            
            {proficiencyLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={40} />
              </Box>
            ) : proficiencyError ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error" variant="body2">
                  {proficiencyError}
                </Typography>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={() => window.location.reload()}
                  sx={{ mt: 1 }}
                >
                  Retry
                </Button>
              </Box>
            ) : proficiencyData ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    English
                  </Typography>
                  <Chip 
                    label={proficiencyData.currentLevel} 
                    size="small" 
                    color="primary" 
                    sx={{ height: 20, minWidth: 32 }} 
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={proficiencyData.progressPercentage}
                  sx={{ height: 8, borderRadius: 4, mb: 1, mt: 1 }}
                />
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {proficiencyData.progressPercentage}% toward {proficiencyData.currentLevel === 'A1' ? 'A2' 
                    : proficiencyData.currentLevel === 'A2' ? 'B1' 
                    : proficiencyData.currentLevel === 'B1' ? 'B2'
                    : proficiencyData.currentLevel === 'B2' ? 'C1'
                    : proficiencyData.currentLevel === 'C1' ? 'C2'
                    : 'Mastery'}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Skills Breakdown
                </Typography>
                
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  {Object.entries(proficiencyData.skillBreakdown).map(([skill, value]) => (
                    <Grid item xs={6} key={skill}>
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {skill}
                          </Typography>
                          <Typography variant="caption">
                            {value}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={value} 
                          sx={{ 
                            height: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 
                                skill === 'vocabulary' ? '#4caf50' :
                                skill === 'grammar' ? '#2196f3' :
                                skill === 'reading' ? '#ff9800' :
                                skill === 'listening' ? '#9c27b0' :
                                skill === 'speaking' ? '#e91e63' :
                                '#00bcd4'
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  No language proficiency data available.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Take a placement test to start tracking your progress
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    startIcon={<School />}
                    onClick={() => navigate('/proficiency')}
                  >
                    Start Tracking
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/assessments')}
                  >
                    Browse Assessments
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Achievements */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <Grid container spacing={2}>
              {achievements.map((achievement) => (
                <Grid item xs={12} key={achievement.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {achievement.icon}
                    <Box>
                      <Typography variant="subtitle2">
                        {achievement.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Assessment Statistics */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Statistics
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Assessments Completed
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completedAssessments.length ? (completedAssessments.length / 10) * 100 : 0}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="body1">
                {completedAssessments.length} of 10
              </Typography>
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  completedAssessments.length 
                    ? completedAssessments.reduce((sum, attempt) => sum + attempt.score, 0) / completedAssessments.length
                    : 0
                }
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="body1">
                {completedAssessments.length 
                  ? Math.round(completedAssessments.reduce((sum, attempt) => sum + attempt.score, 0) / completedAssessments.length)
                  : 0}%
              </Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Timeline />}
              onClick={() => navigate('/progress')}
            >
              View Detailed Statistics
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 