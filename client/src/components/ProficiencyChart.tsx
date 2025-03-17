import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { ProficiencyData } from '../interfaces/Proficiency';

interface ProficiencyChartProps {
  data: ProficiencyData;
  title: string;
  selectedSkills?: string[];
}

const ProficiencyChart: React.FC<ProficiencyChartProps> = ({ data, title, selectedSkills }) => {
  const chartData = {
    labels: data.dates,
    datasets: selectedSkills?.map(skill => ({
      label: skill,
      data: data.skills[skill] || [],
      borderColor: getSkillColor(skill),
      backgroundColor: `${getSkillColor(skill)}30`,
      tension: 0.4,
      fill: true,
    })) || [],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Proficiency Score',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Line data={chartData} options={options} />
    </Box>
  );
};

const getSkillColor = (skill: string): string => {
  const colors: { [key: string]: string } = {
    'Speaking': '#2196f3',
    'Listening': '#4caf50',
    'Reading': '#ff9800',
    'Writing': '#f44336',
    'Grammar': '#9c27b0',
    'Vocabulary': '#00bcd4',
  };
  return colors[skill] || '#757575';
};

export default ProficiencyChart; 