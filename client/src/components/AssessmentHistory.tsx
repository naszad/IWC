import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Assessment, ProficiencyLevel } from '../interfaces/Proficiency';
import theme from '../styles/theme';

interface AssessmentHistoryProps {
  assessments: Assessment[];
}

const getLevelColor = (level: ProficiencyLevel): string => {
  const colors: { [key in ProficiencyLevel]: string } = {
    'A1': `${theme.palette.primary.light}30`,
    'A2': `${theme.palette.primary.light}50`,
    'B1': `${theme.palette.primary.main}70`,
    'B2': `${theme.palette.primary.main}90`,
    'C1': theme.palette.primary.main,
    'C2': theme.palette.primary.dark,
    'D1': theme.palette.secondary.main,
    'D2': theme.palette.secondary.dark,
  };
  return colors[level];
};

const getLevelTextColor = (level: ProficiencyLevel): string => {
  const colors: { [key in ProficiencyLevel]: string } = {
    'A1': theme.palette.primary.dark,
    'A2': theme.palette.primary.dark,
    'B1': theme.palette.primary.contrastText,
    'B2': theme.palette.primary.contrastText,
    'C1': theme.palette.primary.contrastText,
    'C2': theme.palette.primary.contrastText,
    'D1': theme.palette.secondary.contrastText,
    'D2': theme.palette.secondary.contrastText,
  };
  return colors[level];
};

const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({ assessments }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Assessment History
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Level</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    {new Date(assessment.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={assessment.level}
                      size="small"
                      sx={{
                        backgroundColor: getLevelColor(assessment.level),
                        color: getLevelTextColor(assessment.level),
                        fontWeight: 'bold',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {assessment.score}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default AssessmentHistory; 