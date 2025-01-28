// @ts-ignore - React is used in JSX
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../../src/pages/StudentDashboard';
import AuthContext from '../../src/context/AuthContext';
import { getStudentAssignments } from '../../src/api';
import { StudentLevel } from '../../src/types/user';
import '@testing-library/jest-dom';

// Mock the API calls
jest.mock('../../src/api', () => ({
  getStudentAssignments: jest.fn()
}));

const mockGetStudentAssignments = getStudentAssignments as jest.Mock;

describe('StudentDashboard', () => {
  const mockStudent = {
    id: 1,
    username: 'student1',
    full_name: 'Test Student',
    email: 'test@student.com',
    role: 'student' as const,
    created_at: '2024-01-01T00:00:00Z',
    student_id: 1,
    language: 'en',
    level: 'A' as StudentLevel
  };

  const mockAuthContext = {
    user: mockStudent,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    registerStudent: jest.fn(),
    registerTeacher: jest.fn(),
    logout: jest.fn()
  };

  const mockAssignments = [
    {
      assignment_id: 1,
      test_id: 1,
      theme: 'Math Test',
      level: 'A',
      status: 'assigned',
      score: null,
      due_date: '2024-01-30T00:00:00Z',
      attempt_date: null
    },
    {
      assignment_id: 2,
      test_id: 2,
      theme: 'English Test',
      level: 'A',
      status: 'completed',
      score: 85,
      due_date: '2024-01-13T00:00:00Z',
      attempt_date: '2024-01-12T00:00:00Z'
    }
  ];

  const renderDashboard = () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <StudentDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStudentAssignments.mockResolvedValue(mockAssignments);
  });

  it('renders dashboard with student name', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${mockStudent.full_name}`)).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching data', () => {
    renderDashboard();
    expect(screen.getByText(/loading assignments/i)).toBeInTheDocument();
  });

  it('displays stats cards with correct information', async () => {
    renderDashboard();
    await waitFor(() => {
      const totalAssignmentsCard = screen.getByText('Total Assignments').closest('.statsCard') as HTMLElement;
      const completedCard = screen.getByText('Completed').closest('.statsCard') as HTMLElement;
      const averageScoreCard = screen.getByText('Average Score').closest('.statsCard') as HTMLElement;

      expect(within(totalAssignmentsCard).getByText('2')).toBeInTheDocument();
      expect(within(completedCard).getByText('1')).toBeInTheDocument();
      expect(within(averageScoreCard).getByText('85%')).toBeInTheDocument();
    });
  });

  it('displays assignments section with assignment cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText('English Test')).toBeInTheDocument();
    });
  });

  it('displays progress section with current level', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Current Level')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('handles error state when fetching assignments fails', async () => {
    const error = new Error('Failed to fetch assignments');
    mockGetStudentAssignments.mockRejectedValueOnce(error);
    
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/failed to load assignments/i)).toBeInTheDocument();
    });
  });

  it('displays take test button for pending assignments', async () => {
    renderDashboard();
    await waitFor(() => {
      const mathCard = screen.getByText('Math Test').closest('.card') as HTMLElement;
      expect(mathCard).toBeInTheDocument();
      expect(within(mathCard).getByText('Take Test')).toBeInTheDocument();
    });
  });

  it('displays empty state when no assignments are available', async () => {
    mockGetStudentAssignments.mockResolvedValueOnce([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No Assignments Yet')).toBeInTheDocument();
      expect(screen.getByText('Your assignments will appear here when teachers assign them to you')).toBeInTheDocument();
    });
  });

  it('displays due dates for assignments', async () => {
    renderDashboard();
    await waitFor(() => {
      const mathCard = screen.getByText('Math Test').closest('.card') as HTMLElement;
      const englishCard = screen.getByText('English Test').closest('.card') as HTMLElement;
      
      const mathDueDate = new Date('2024-01-30T00:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const englishDueDate = new Date('2024-01-13T00:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Use a function to match text that might be split across elements
      expect(within(mathCard).getByText((content) => content.includes(mathDueDate))).toBeInTheDocument();
      expect(within(englishCard).getByText((content) => content.includes(englishDueDate))).toBeInTheDocument();
    });
  });

  it('displays attempt dates for completed assignments', async () => {
    renderDashboard();
    await waitFor(() => {
      const englishCard = screen.getByText('English Test').closest('.card') as HTMLElement;
      const attemptDate = new Date('2024-01-12T00:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      expect(within(englishCard).getByText((content) => content.includes(attemptDate))).toBeInTheDocument();
    });
  });

  it('displays scores for completed assignments', async () => {
    renderDashboard();
    await waitFor(() => {
      const englishCard = screen.getByText('English Test').closest('.card') as HTMLElement;
      expect(within(englishCard).getByText('85%')).toBeInTheDocument();
    });
  });

  it('does not display take test button for completed assignments', async () => {
    renderDashboard();
    await waitFor(() => {
      const englishCard = screen.getByText('English Test').closest('.card') as HTMLElement;
      expect(within(englishCard).queryByText('Take Test')).not.toBeInTheDocument();
    });
  });
}); 