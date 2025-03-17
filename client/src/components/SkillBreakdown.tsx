import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Tooltip,
} from '@mui/material';
import { SkillBreakdown as ISkillBreakdown } from '../interfaces/Proficiency';
import {
  MenuBook as GrammarIcon,
  School as VocabularyIcon,
  MenuBook as ReadingIcon,
  Headphones as ListeningIcon,
  SpeakerNotes as SpeakingIcon,
  Create as WritingIcon,
} from '@mui/icons-material';

interface SkillBreakdownProps {
  data: ISkillBreakdown;
}

const SkillBreakdown: React.FC<SkillBreakdownProps> = ({ data }) => {
  const skills = [
    { key: 'vocabulary', label: 'Vocabulary', icon: <VocabularyIcon />, color: '#2196f3' },
    { key: 'grammar', label: 'Grammar', icon: <GrammarIcon />, color: '#4caf50' },
    { key: 'reading', label: 'Reading', icon: <ReadingIcon />, color: '#ff9800' },
    { key: 'listening', label: 'Listening', icon: <ListeningIcon />, color: '#f44336' },
    { key: 'speaking', label: 'Speaking', icon: <SpeakingIcon />, color: '#9c27b0' },
    { key: 'writing', label: 'Writing', icon: <WritingIcon />, color: '#00bcd4' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Skill Breakdown
        </Typography>
        <Grid container spacing={2}>
          {skills.map((skill) => (
            <Grid item xs={12} key={skill.key}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '120px' }}>
                  {skill.icon}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {skill.label}
                  </Typography>
                </Box>
                <Tooltip title={`${data[skill.key]}%`}>
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data[skill.key]}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${skill.color}30`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: skill.color,
                        },
                      }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SkillBreakdown; 