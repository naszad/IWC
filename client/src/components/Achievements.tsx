import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as AchievementIcon,
  MenuBook as GrammarIcon,
  School as VocabularyIcon,
  MenuBook as ReadingIcon,
  Headphones as ListeningIcon,
  SpeakerNotes as SpeakingIcon,
  Create as WritingIcon,
} from '@mui/icons-material';
import { Achievement, SkillType } from '../interfaces/Proficiency';

interface AchievementsProps {
  achievements: Achievement[];
}

const getAchievementIcon = (skill?: SkillType) => {
  if (!skill) return <AchievementIcon />;
  
  switch (skill) {
    case 'vocabulary':
      return <VocabularyIcon />;
    case 'grammar':
      return <GrammarIcon />;
    case 'reading':
      return <ReadingIcon />;
    case 'listening':
      return <ListeningIcon />;
    case 'speaking':
      return <SpeakingIcon />;
    case 'writing':
      return <WritingIcon />;
    default:
      return <AchievementIcon />;
  }
};

const getSkillColor = (skill?: SkillType): string => {
  if (!skill) return '#757575';
  
  const colors: { [key in SkillType]: string } = {
    'vocabulary': '#2196f3',
    'grammar': '#4caf50',
    'reading': '#ff9800',
    'listening': '#f44336',
    'speaking': '#9c27b0',
    'writing': '#00bcd4',
    'comprehensive': '#795548',
  };
  return colors[skill];
};

const Achievements: React.FC<AchievementsProps> = ({ achievements }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Achievements
        </Typography>
        <Grid container spacing={2}>
          {achievements.map((achievement) => (
            <Grid item xs={12} key={achievement.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: `${getSkillColor(achievement.skill)}10`,
                  border: `1px solid ${getSkillColor(achievement.skill)}30`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: `${getSkillColor(achievement.skill)}30`,
                      color: getSkillColor(achievement.skill),
                    }}
                  >
                    {getAchievementIcon(achievement.skill)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {achievement.name}
                      </Typography>
                      {achievement.skill && (
                        <Chip
                          label={achievement.skill}
                          size="small"
                          sx={{
                            backgroundColor: `${getSkillColor(achievement.skill)}30`,
                            color: getSkillColor(achievement.skill),
                            fontWeight: 'bold',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {achievement.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Earned on {new Date(achievement.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Achievements; 