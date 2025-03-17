import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  LinearProgress,
  CardMedia,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Assessment } from '../interfaces/Assessment'; 
import { getAllAssessments } from '../utils/assessmentService';

const Assessments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Fetch assessments from API when component mounts
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await getAllAssessments();
      setAssessments(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setError('Failed to load assessments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };

  const handleLevelChange = (event: SelectChangeEvent) => {
    setLevelFilter(event.target.value);
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      categoryFilter === 'all' || assessment.category === categoryFilter;
    
    const matchesLevel = levelFilter === 'all' || assessment.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Language Assessments
        </Typography>
        {user?.role === 'instructor' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/assessments/create')}
          >
            Create Assessment
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search Assessments"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="vocabulary">Vocabulary</MenuItem>
              <MenuItem value="grammar">Grammar</MenuItem>
              <MenuItem value="reading">Reading</MenuItem>
              <MenuItem value="listening">Listening</MenuItem>
              <MenuItem value="speaking">Speaking</MenuItem>
              <MenuItem value="writing">Writing</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Level</InputLabel>
            <Select
              value={levelFilter}
              label="Level"
              onChange={handleLevelChange}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="A1">A1 (Beginner)</MenuItem>
              <MenuItem value="A2">A2 (Elementary)</MenuItem>
              <MenuItem value="B1">B1 (Intermediate)</MenuItem>
              <MenuItem value="B2">B2 (Upper Intermediate)</MenuItem>
              <MenuItem value="C1">C1 (Advanced)</MenuItem>
              <MenuItem value="C2">C2 (Proficiency)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Assessment List */}
      {loading ? (
        <LinearProgress />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredAssessments.map((assessment) => (
            <Grid item xs={12} sm={6} md={4} key={assessment.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              >
                {assessment.imageUrl && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={assessment.imageUrl}
                    alt={assessment.title}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {assessment.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {assessment.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={assessment.category}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip label={assessment.level} size="small" sx={{ mb: 1 }} />
                    <Chip label={assessment.language} size="small" sx={{ ml: 1, mb: 1 }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {assessment.duration} minutes
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/assessments/${assessment.id}/take`)}
                  >
                    Take Assessment
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && filteredAssessments.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No assessments found matching your criteria
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Assessments; 