import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import TeacherDashboard from '../../src/pages/TeacherDashboard';
import AuthContext from '../../src/context/AuthContext';
import { getTeacherTests, getTeacherStudents, assignTest } from '../../src/api';
import userEvent from '@testing-library/user-event';
import { Teacher, StudentLevel } from '../../src/types/user';
import { QuestionType, Test } from '../../src/types/test';
import '@testing-library/jest-dom';

// Mock the API calls
jest.mock('../../src/api');
const mockGetTeacherTests = jest.mocked(getTeacherTests);
const mockGetTeacherStudents = jest.mocked(getTeacherStudents);
const mockAssignTest = jest.mocked(assignTest);

// Mock teacher data
const mockTeacher: Teacher = {
  id: 1,
  username: 'teacher1',
  full_name: 'Test Teacher',
  role: 'teacher',
  created_at: '2024-01-01T00:00:00Z',
  teacher_id: 1,
  email: 'teacher@test.com'
};

// Mock test data
const mockTests: Test[] = [
  {
    test_id: 1,
    teacher_id: 1,
    theme: 'Math Test',
    level: 'A' as StudentLevel,
    created_at: '2024-01-01T00:00:00Z',
    questions: [
      {
        question_id: 1,
        question_type: 'picture_vocabulary' as QuestionType,
        question_text: 'Test question',
        possible_answers: {
          media_url: 'test.jpg',
          images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          options: ['A', 'B', 'C']
        },
        correct_answer: 'A'
      }
    ]
  }
];

// Mock student data
const mockStudents = [
  {
    student_id: 1,
    full_name: 'Test Student',
    language: 'en',
    level: 'A' as StudentLevel,
    tests_taken: 5,
    average_score: 85,
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Mock auth context
const mockAuthContext = {
  user: mockTeacher,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  registerStudent: jest.fn(),
  registerTeacher: jest.fn(),
  logout: jest.fn()
};

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('TeacherDashboard', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    (useNavigate as jest.Mock).mockImplementation(() => mockNavigate);
    jest.clearAllMocks();
    mockGetTeacherTests.mockResolvedValue(mockTests);
    mockGetTeacherStudents.mockResolvedValue(mockStudents);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <TeacherDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('renders dashboard with teacher name', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test Teacher/)).toBeInTheDocument();
    });
  });

  it('displays loading state', async () => {
    renderDashboard();
    expect(screen.getByText('Loading tests...')).toBeInTheDocument();
    expect(screen.getByText('Loading students...')).toBeInTheDocument();
  });

  it('displays stats cards with correct information', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      expect(screen.getByText('Active Students')).toBeInTheDocument();
      expect(screen.getByText('Pending Assignments')).toBeInTheDocument();
      expect(screen.getByText('Completed Tests')).toBeInTheDocument();
    });
  });

  it('displays tests section with test cards', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText('Level A')).toBeInTheDocument();
    });
  });

  it('displays students section with student cards', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Student')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('handles error state when fetching tests fails', async () => {
    mockGetTeacherTests.mockRejectedValue(new Error('Failed to fetch'));
    renderDashboard();
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/failed to load dashboard data/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('handles error state when fetching students fails', async () => {
    mockGetTeacherStudents.mockRejectedValue(new Error('Failed to fetch'));
    renderDashboard();
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/failed to load dashboard data/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('handles test assignment through modal', async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
    });

    // Open modal
    await act(async () => {
      await user.click(screen.getByText('Assign to Students'));
    });

    // Find the checkbox by its parent label's text content
    await waitFor(() => {
      const studentCheckbox = screen.getByRole('checkbox', { name: /Test Student/ });
      expect(studentCheckbox).toBeInTheDocument();
      user.click(studentCheckbox);
    });

    // Submit the form
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Assign Test' }));
    });

    expect(mockAssignTest).toHaveBeenCalled();
  });

  it('navigates to create test page when clicking create test button', async () => {
    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Create New Test/)).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText(/Create New Test/));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/create-test');
  });

  it('displays empty state when no tests are available', async () => {
    mockGetTeacherTests.mockResolvedValue([]);
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('No Tests Created')).toBeInTheDocument();
      expect(screen.getByText('Start by creating your first test')).toBeInTheDocument();
    });
  });

  it('displays empty state when no students are available', async () => {
    mockGetTeacherStudents.mockResolvedValue([]);
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('No Students Yet')).toBeInTheDocument();
      expect(screen.getByText('Students will appear here once they join your class')).toBeInTheDocument();
    });
  });
}); 