import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { Assessment, QuestionAnswer, EmojiEvents, School, Create } from '@mui/icons-material';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      title: 'Take Assessments',
      description: 'Complete various English assessments created by instructors to test and improve your language skills.',
      icon: <Assessment fontSize="large" color="primary" />,
      action: () => navigate('/assessments'),
    },
    {
      title: 'Create Assessments',
      description: 'Instructors can design comprehensive English assessments for students across different skill areas and proficiency levels.',
      icon: <Create fontSize="large" color="primary" />,
      action: () => navigate('/dashboard'),
    },
    {
      title: 'Track Progress',
      description: 'Monitor your assessment results and progress over time with detailed reports and analytics.',
      icon: <EmojiEvents fontSize="large" color="primary" />,
      action: () => navigate('/proficiency'),
    },
  ];

  return (
    <Box className="home-container" sx={{ position: 'relative', zIndex: 1 }}>
      {/* Hero Section */}
      <Container maxWidth="lg" className="section hero-section" sx={{ position: 'relative', zIndex: 2 }}>
        <Box 
          sx={{ 
            py: { xs: 6, md: 12 }, 
            textAlign: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Typography
            variant="h1"
            className="gradient-text hero-title"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 0,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              position: 'relative',
              zIndex: 2,
            }}
          >
            Welcome to IWC
          </Typography>
          <Box 
            className="hero-subtitle"
            sx={{ 
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 'normal',
              mt: 1,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            English Language Learning Platform
          </Box>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            paragraph 
            className="hero-description"
            sx={{ 
              mb: 6,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0,
              animation: 'fadeIn 0.8s ease-out forwards 0.5s',
            }}
          >
            Empowering students to master English with confidence through instructor-created assessments,
            detailed feedback, and comprehensive progress tracking.
          </Typography>

          <Box 
            className="hero-actions"
            sx={{ 
              opacity: 0,
              animation: 'fadeIn 0.8s ease-out forwards 0.8s',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ 
                mr: 2,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ 
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Dashboard
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Card
                className="feature-card"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                  opacity: 1,
                  animation: `fadeIn 0.8s ease-out forwards ${0.3 * (index + 1)}s`,
                }}
                onClick={feature.action}
              >
                <CardContent sx={{ 
                  flexGrow: 1, 
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  <Box 
                    sx={{ 
                      mb: 3,
                      transform: 'scale(1.2)',
                      transition: 'transform 0.3s ease',
                    }}
                    className="feature-icon"
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h2"
                    className="feature-title"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    color="text.secondary"
                    className="feature-description"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ pb: 12, position: 'relative', zIndex: 2 }}>
        <Box 
          className="mission-section section"
          sx={{ 
            py: 8, 
            px: { xs: 3, md: 8 },
            bgcolor: 'background.paper', 
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            opacity: 1,
          }}
        >
          <Box 
            className="mission-content"
            sx={{ 
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Typography 
              variant="h3" 
              align="center" 
              gutterBottom
              className="gradient-text"
              sx={{ fontWeight: 600 }}
            >
              Our Mission
            </Typography>
            <Typography 
              variant="h6" 
              align="center" 
              color="text.secondary" 
              paragraph
              sx={{ 
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.8,
              }}
            >
              IWC is committed to making English language learning accessible and effective 
              for everyone. Through instructor-created assessments, detailed feedback, and 
              progress tracking, we help students build practical English skills for academic, 
              professional, and personal success.
            </Typography>
          </Box>
          
          {/* Decorative background elements */}
          <Box 
            className="mission-bg-element"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.05,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              zIndex: 1,
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 