import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { ProficiencyData, SkillType } from '../interfaces/Proficiency';

interface ProficiencyChartProps {
  data: ProficiencyData;
  title: string;
  selectedSkills?: SkillType[];
}

const ProficiencyChart: React.FC<ProficiencyChartProps> = ({ data, title, selectedSkills }) => {
  // Generate dates based on the number of data points
  const generateDates = (length: number) => {
    const dates = [];
    const today = new Date();
    for (let i = length - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  };

  // Get the maximum length of any skill's progress array
  const maxLength = Math.max(
    ...Object.values(data.skillProgressHistory || {}).map(arr => arr.length)
  );

  const chartData = {
    labels: generateDates(maxLength),
    datasets: selectedSkills?.map(skill => ({
      label: skill.charAt(0).toUpperCase() + skill.slice(1),
      data: data.skillProgressHistory?.[skill] || [],
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
  return colors[skill] || '#757575';
};

export default ProficiencyChart; 