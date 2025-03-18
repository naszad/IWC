import React, { useState, useEffect } from 'react';
import theme from '../styles/theme';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress as MuiCircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MenuBook, School, Headphones, SpeakerNotes, Create } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUserProficiencyData } from '../utils/proficiencyService';
import { 
  ProficiencyData, 
  LanguageProficiency, 
  SkillType, 
  ProficiencyLevel,
  Activity
} from '../interfaces/Proficiency';
import ProficiencyChart from '../components/ProficiencyChart';
import SkillBreakdown from '../components/SkillBreakdown';
import AssessmentHistory from '../components/AssessmentHistory';
import RecentActivities from '../components/RecentActivities';
import Achievements from '../components/Achievements';
import SkillRecommendations from '../components/SkillRecommendations';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Proficiency level progression definitions
const proficiencyLevels = [
  { level: 'A1', name: 'Beginner', color: `${theme.palette.primary.light}30`, textColor: theme.palette.primary.dark },
  { level: 'A2', name: 'Elementary', color: `${theme.palette.primary.light}50`, textColor: theme.palette.primary.dark },
  { level: 'B1', name: 'Intermediate', color: `${theme.palette.primary.main}70`, textColor: theme.palette.primary.contrastText },
  { level: 'B2', name: 'Upper Intermediate', color: `${theme.palette.primary.main}90`, textColor: theme.palette.primary.contrastText },
  { level: 'C1', name: 'Advanced', color: theme.palette.primary.main, textColor: theme.palette.primary.contrastText },
  { level: 'C2', name: 'Proficient', color: theme.palette.primary.dark, textColor: theme.palette.primary.contrastText },
  { level: 'D1', name: 'Native-like', color: theme.palette.secondary.main, textColor: theme.palette.secondary.contrastText },
  { level: 'D2', name: 'Native', color: theme.palette.secondary.dark, textColor: theme.palette.secondary.contrastText },
];

// Component for proficiency level progression display
const ProficiencyLevelProgress = ({ currentLevel }: { currentLevel: string }) => {
  const currentLevelIndex = proficiencyLevels.findIndex(level => level.level === currentLevel);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Proficiency Level Progression
      </Typography>
      <Grid container spacing={0} sx={{ mt: 1 }}>
        {proficiencyLevels.map((level, index) => (
          <Grid item xs={1.5} key={level.level}>
            <Box
              sx={{
                height: 40,
                bgcolor: level.color,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                color: level.textColor,
                fontWeight: currentLevel === level.level ? 'bold' : 'normal',
                border: currentLevel === level.level ? '2px solid #000' : 'none',
                '&::after': currentLevel === level.level
                  ? {
                    content: '""',
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #000',
                  }
                  : {},
              }}
            >
              {level.level}
            </Box>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, fontSize: '0.7rem' }}>
              {level.name}
            </Typography>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption">Beginner</Typography>
        <Typography variant="caption">Native</Typography>
      </Box>
    </Box>
  );
};

// Tab panel component for tab content
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`proficiency-tabpanel-${index}`}
      aria-labelledby={`proficiency-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Main component
const ProficiencyTracking: React.FC = () => {
  const { user } = useAuth();
  const [proficiencyData, setProficiencyData] = useState<ProficiencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillTabValue, setSkillTabValue] = useState(0);
  const theme = useTheme();

  console.log('ProficiencyTracking - Current user:', user);
  
  // Add state for tracking which skills to display in the combined graph
  const [selectedSkills, setSelectedSkills] = useState<SkillType[]>([
    'vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'
  ]);

  // Fetch proficiency data when component mounts
  useEffect(() => {
    const fetchProficiencyData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserProficiencyData();
        setProficiencyData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching proficiency data:', err);
        setError('Failed to load proficiency data. Please try again later.');
        // Initialize with default data structure
        setProficiencyData({
          userId: user.id,
          username: user.username,
          currentLevel: 'A1',
          startLevel: 'A1',
          progressPercentage: 0,
          startDate: new Date().toISOString().split('T')[0],
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
          skillProgressHistory: {
            vocabulary: [],
            grammar: [],
            reading: [],
            listening: [],
            speaking: [],
            writing: []
          },
          recentActivities: [],
          achievements: [],
          weakAreas: [],
          strongAreas: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProficiencyData();
  }, [user]);

  const handleSkillTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSkillTabValue(newValue);
  };

  // Toggle skill selection for the combined graph
  const toggleSkillSelection = (skill: SkillType) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  // If loading, show loading spinner
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <MuiCircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading proficiency data...</Typography>
        </Box>
      </Container>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fde8e7' }}>
          <Typography variant="h6" color="error">Error</Typography>
          <Typography>{error}</Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  // If no data or no languages, show a message
  if (!proficiencyData || proficiencyData.languages.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
          <Typography variant="h5" gutterBottom>No Proficiency Data Available</Typography>
          <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
            You haven't taken any assessments yet. Complete assessments to start tracking your English proficiency.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<BarChartIcon />}
                onClick={() => {/* Handle taking assessment */}}
              >
                Take an Assessment
              </Button>
            </Grid>
            <Grid item>
              <Button 
                variant="outlined"
                startIcon={<MenuBook />}
                onClick={() => {/* Handle browsing assessments */}}
              >
                Browse Assessments
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }
  
  // English language data - always use index 0 for now
  // In a more complete implementation, we could add language switching
  const englishData = proficiencyData.languages[0];

  // Create skill-specific proficiency history data
  const createSkillHistoryData = (skillName: SkillType) => {
    const labels = ['January', 'February', 'March', 'April', 'May', 'June'];
    const data = englishData?.skillProgressHistory?.[skillName] || [];
    
    return {
      labels,
      datasets: [
        {
          label: `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} Progress`,
          data,
          borderColor: getSkillColor(skillName),
          tension: 0.3,
          fill: false,
        },
      ],
    };
  };

  // Create combined skills chart data
  const createCombinedSkillsData = () => {
    const labels = ['January', 'February', 'March', 'April', 'May', 'June'];
    
    const datasets = selectedSkills.map(skill => ({
      label: `${skill.charAt(0).toUpperCase() + skill.slice(1)}`,
      data: englishData?.skillProgressHistory?.[skill] || [],
      borderColor: getSkillColor(skill),
      backgroundColor: `${getSkillColor(skill)}20`,
      tension: 0.4,
      fill: false,
      pointBackgroundColor: theme.palette.background.paper,
      pointBorderColor: getSkillColor(skill),
      pointHoverBackgroundColor: getSkillColor(skill),
      pointHoverBorderColor: theme.palette.background.paper,
      borderWidth: 2,
    }));
    
    return {
      labels,
      datasets,
    };
  };

  // Options for charts
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          color: theme.palette.text.primary,
        },
      },
      title: {
        display: false, // Remove title to match other components
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: theme.typography.fontFamily,
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          family: theme.typography.fontFamily,
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Proficiency Score',
          font: {
            family: theme.typography.fontFamily,
            size: 12,
            weight: 'normal' as const,
          },
          color: theme.palette.text.secondary,
        },
        grid: {
          color: theme.palette.divider,
          borderColor: theme.palette.divider,
          borderDash: [5, 5],
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          color: theme.palette.text.secondary,
          padding: 8,
        }
      },
      x: {
        grid: {
          color: theme.palette.divider,
          borderColor: theme.palette.divider,
          display: false,
        },
        ticks: {
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          color: theme.palette.text.secondary,
          padding: 8,
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hitRadius: 8,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: theme.palette.background.paper,
      }
    },
  };

  // Create overall progress chart data
  const createOverallProgressData = () => {
    const skills = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
    return {
      labels: skills.map(skill => skill.charAt(0).toUpperCase() + skill.slice(1)),
      datasets: [
        {
          label: 'Current Proficiency',
          data: skills.map(skill => englishData.skillBreakdown[skill]),
          backgroundColor: skills.map(skill => getSkillColor(skill as SkillType)),
          borderWidth: 1,
        },
      ],
    };
  };

  // Get the skill icon
  const getSkillIcon = (skill: SkillType) => {
    switch(skill) {
      case 'vocabulary': return <MenuBook />;
      case 'grammar': return <School />;
      case 'reading': return <BarChartIcon />;
      case 'listening': return <Headphones />;
      case 'speaking': return <SpeakerNotes />;
      case 'writing': return <Create />;
      default: return <School />;
    }
  };

  // Get skill color
  const getSkillColor = (skill: SkillType) => {
    switch(skill) {
      case 'vocabulary': return theme.palette.success.main; // green
      case 'grammar': return theme.palette.primary.main; // blue
      case 'reading': return theme.palette.warning.main; // orange
      case 'listening': return theme.palette.secondary.main; // purple
      case 'speaking': return theme.palette.error.main; // red
      case 'writing': return theme.palette.info.main; // cyan
      default: return theme.palette.text.secondary;
    }
  };

  // Filter activities based on skill type
  const filteredActivities = englishData?.recentActivities.filter(activity => {
    if (skillTabValue === 0) return true;
    const skillTypes: SkillType[] = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
    return activity.skill === skillTypes[skillTabValue - 1];
  }) || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        English Proficiency Tracking
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Track your progress in English through your assessment results and see how your skills are developing over time.
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Current Level</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" sx={{ mr: 1 }}>{englishData.currentLevel}</Typography>
                <Chip 
                  size="small" 
                  label={proficiencyLevels.find(l => l.level === englishData.currentLevel)?.name} 
                  sx={{ backgroundColor: proficiencyLevels.find(l => l.level === englishData.currentLevel)?.color }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={englishData.progressPercentage} 
                sx={{ mt: 2, mb: 1, height: 8, borderRadius: 4 }} 
              />
              <Typography variant="caption" color="text.secondary">
                {englishData.progressPercentage}% towards next level
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Study Time</Typography>
              <Typography variant="h4">{englishData.studyHours} hrs</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Since {new Date(englishData.startDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Completed Assessments</Typography>
              <Typography variant="h4">{englishData.completedQuestions}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total completed assessments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Vocabulary</Typography>
              <Typography variant="h4">{englishData.vocabMastered}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Words mastered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main content grid */}
      <Grid container spacing={3}>
        {/* Left column - Proficiency Data */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Proficiency Level Progression
                </Typography>
              </Box>
              <ProficiencyLevelProgress currentLevel={englishData.currentLevel} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">
                  Skill Progress Over Time
                </Typography>
              </Box>
              
              {/* Skill Selection */}
              <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'] as SkillType[]).map((skill) => (
                  <Chip
                    key={skill}
                    label={skill.charAt(0).toUpperCase() + skill.slice(1)}
                    icon={<Box sx={{ display: 'flex', alignItems: 'center' }}>{getSkillIcon(skill)}</Box>}
                    onClick={() => toggleSkillSelection(skill)}
                    variant={selectedSkills.includes(skill) ? "filled" : "outlined"}
                    sx={{ 
                      backgroundColor: selectedSkills.includes(skill) ? 
                        `${getSkillColor(skill)}20` : 'transparent',
                      borderColor: getSkillColor(skill),
                      color: getSkillColor(skill),
                      '& .MuiChip-icon': {
                        color: getSkillColor(skill)
                      }
                    }}
                  />
                ))}
              </Box>
              
              {/* Combined Chart */}
              <Box sx={{ 
                height: 400, 
                p: 2, 
                mt: 2,
                borderRadius: theme.shape.borderRadius,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <Line data={createCombinedSkillsData()} options={options} />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Skill Breakdown</Typography>
                <Grid container spacing={1}>
                  {Object.entries(englishData.skillBreakdown).map(([skill, value]) => (
                    <Grid item xs={6} md={4} key={skill}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getSkillIcon(skill as SkillType)}
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                            <MuiCircularProgress 
                              variant="determinate" 
                              value={value} 
                              size={50} 
                              thickness={5}
                              sx={{ color: getSkillColor(skill as SkillType) }}
                            />
                            <Box
                              sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="caption" component="div" color="text.secondary">
                                {`${value}%`}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {value >= 80 ? 'Excellent' : 
                                value >= 70 ? 'Good' : 
                                value >= 60 ? 'Satisfactory' : 
                                'Needs work'}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Activity, Recommendations, Achievements */}
        <Grid item xs={12} md={4}>
          {/* Assessment History */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assessment History
              </Typography>
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {englishData.assessmentHistory.map((assessment, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(assessment.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={assessment.level} 
                            size="small" 
                            sx={{ 
                              backgroundColor: proficiencyLevels.find(l => l.level === assessment.level)?.color,
                              color: proficiencyLevels.find(l => l.level === assessment.level)?.textColor,
                            }} 
                          />
                        </TableCell>
                        <TableCell>{assessment.score}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          {englishData.weakAreas && englishData.weakAreas.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Areas for Improvement
                </Typography>
                <List disablePadding>
                  {englishData.weakAreas?.map((area, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }} disablePadding>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getSkillIcon(area.skill)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={area.skill.charAt(0).toUpperCase() + area.skill.slice(1)} 
                        secondary={`${area.recommendation} Consider taking more ${area.skill} assessments.`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {englishData.strongAreas && englishData.strongAreas.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Strengths
                </Typography>
                <List disablePadding>
                  {englishData.strongAreas?.map((area, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1 }} disablePadding>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getSkillIcon(area.skill)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={area.skill.charAt(0).toUpperCase() + area.skill.slice(1)} 
                        secondary={`${area.recommendation} Your assessment results show strong performance in this area.`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Assessments
              </Typography>
              <List disablePadding>
                {englishData.recentActivities.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0, borderBottom: `1px solid ${theme.palette.divider}`, py: 1 }} disablePadding>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{activity.name}</Typography>
                          {activity.skill && (
                            <Chip 
                              label={activity.skill.charAt(0).toUpperCase() + activity.skill.slice(1)} 
                              size="small" 
                              sx={{ 
                                backgroundColor: 
                                  activity.skill === 'vocabulary' ? `${theme.palette.success.main}10` :
                                  activity.skill === 'grammar' ? `${theme.palette.primary.main}10` :
                                  activity.skill === 'reading' ? `${theme.palette.warning.main}10` :
                                  activity.skill === 'listening' ? `${theme.palette.secondary.main}10` :
                                  activity.skill === 'speaking' ? `${theme.palette.error.main}10` :
                                  activity.skill === 'comprehensive' ? `${theme.palette.info.light}10` :
                                  `${theme.palette.info.main}10`,
                                color: 
                                  activity.skill === 'vocabulary' ? theme.palette.success.main :
                                  activity.skill === 'grammar' ? theme.palette.primary.main :
                                  activity.skill === 'reading' ? theme.palette.warning.main :
                                  activity.skill === 'listening' ? theme.palette.secondary.main :
                                  activity.skill === 'speaking' ? theme.palette.error.main :
                                  activity.skill === 'comprehensive' ? theme.palette.info.light :
                                  theme.palette.info.main,
                              }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.date).toLocaleDateString()}
                          </Typography>
                          {activity.score && (
                            <Typography variant="caption" color="text.secondary">
                              Score: {activity.score}%
                            </Typography>
                          )}
                          {activity.progress && (
                            <Typography variant="caption" color="text.secondary">
                              Progress: {activity.progress}%
                            </Typography>
                          )}
                          {activity.result && (
                            <Typography variant="caption" color="text.secondary">
                              Result: {activity.result}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Button variant="text" size="small" sx={{ mt: 1 }}>
                View All Assessments
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional content */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Overall Progress */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Progress
            </Typography>
            <ProficiencyChart data={proficiencyData} />
          </Paper>
        </Grid>

        {/* Skill Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Skill Breakdown
            </Typography>
            <SkillBreakdown data={proficiencyData.skillBreakdown} />
          </Paper>
        </Grid>

        {/* Assessment History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Assessment History
            </Typography>
            <AssessmentHistory assessments={proficiencyData.assessmentHistory} />
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <RecentActivities activities={proficiencyData.recentActivities} />
          </Paper>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <Achievements achievements={proficiencyData.achievements} />
          </Paper>
        </Grid>

        {/* Skill Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Skill Recommendations
            </Typography>
            <SkillRecommendations 
              weakAreas={proficiencyData.weakAreas}
              strongAreas={proficiencyData.strongAreas}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProficiencyTracking;