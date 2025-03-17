import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  MenuBook as GrammarIcon,
  School as VocabularyIcon,
  MenuBook as ReadingIcon,
  Headphones as ListeningIcon,
  SpeakerNotes as SpeakingIcon,
  Create as WritingIcon,
  Lightbulb as RecommendationIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { SkillType } from '../interfaces/Proficiency';

interface SkillRecommendation {
  skill: SkillType;
  recommendation: string;
  actionUrl?: string;
}

interface SkillRecommendationsProps {
  recommendations: SkillRecommendation[];
}

const getSkillIcon = (skill: SkillType) => {
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
      return <RecommendationIcon />;
  }
};

const getSkillColor = (skill: SkillType): string => {
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

const getSkillLabel = (skill: SkillType): string => {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
};

const SkillRecommendations: React.FC<SkillRecommendationsProps> = ({ recommendations }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Personalized Recommendations
        </Typography>
        <List>
          {recommendations.map((rec, index) => (
            <ListItem
              key={index}
              divider={index < recommendations.length - 1}
              sx={{
                py: 2,
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: `${getSkillColor(rec.skill)}30`,
                    color: getSkillColor(rec.skill),
                  }}
                >
                  {getSkillIcon(rec.skill)}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {getSkillLabel(rec.skill)}
                    </Typography>
                    <Chip
                      label={rec.skill}
                      size="small"
                      sx={{
                        backgroundColor: `${getSkillColor(rec.skill)}30`,
                        color: getSkillColor(rec.skill),
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {rec.recommendation}
                    </Typography>
                    {rec.actionUrl && (
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderColor: getSkillColor(rec.skill),
                          color: getSkillColor(rec.skill),
                          '&:hover': {
                            borderColor: getSkillColor(rec.skill),
                            backgroundColor: `${getSkillColor(rec.skill)}10`,
                          },
                        }}
                      >
                        Try Now
                      </Button>
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

export default SkillRecommendations; 