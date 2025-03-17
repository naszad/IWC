import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import {
  MenuBook as GrammarIcon,
  School as VocabularyIcon,
  MenuBook as ReadingIcon,
  Headphones as ListeningIcon,
  SpeakerNotes as SpeakingIcon,
  Create as WritingIcon,
  EmojiEvents as AchievementIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Activity, SkillType } from '../interfaces/Proficiency';

interface RecentActivitiesProps {
  activities: Activity[];
}

const getActivityIcon = (type: string, skill?: SkillType) => {
  if (skill) {
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
        return <AssignmentIcon />;
    }
  }

  switch (type.toLowerCase()) {
    case 'quiz':
      return <QuizIcon />;
    case 'achievement':
      return <AchievementIcon />;
    default:
      return <AssignmentIcon />;
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

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activities
        </Typography>
        <List>
          {activities.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemIcon>
                {getActivityIcon(activity.type, activity.skill)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {activity.name}
                    </Typography>
                    {activity.skill && (
                      <Chip
                        label={activity.skill}
                        size="small"
                        sx={{
                          backgroundColor: `${getSkillColor(activity.skill)}30`,
                          color: getSkillColor(activity.skill),
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(activity.date).toLocaleDateString()}
                    </Typography>
                    {activity.progress !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={activity.progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: `${getSkillColor(activity.skill)}30`,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getSkillColor(activity.skill),
                            },
                          }}
                        />
                      </Box>
                    )}
                    {activity.result && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {activity.result}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecentActivities; 