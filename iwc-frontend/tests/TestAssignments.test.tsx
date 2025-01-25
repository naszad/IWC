import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TestAssignments from '../src/components/TestAssignments';
import { getTeacherAssignments, getTeacherStudents } from '../src/api';
import { AssignmentStatus } from '../src/api';
import { StudentLevel } from '../src/types/user';
import { jest, describe, it, expect } from '@jest/globals';

// Mock the API calls
jest.mock('../src/api');
const mockGetTeacherAssignments = jest.mocked(getTeacherAssignments);
const mockGetTeacherStudents = jest.mocked(getTeacherStudents);

// Setup initial mock implementations
mockGetTeacherAssignments.mockResolvedValue([{
  assignment_id: 1,
  test_id: 1,
  student_id: 1,
  teacher_id: 1,
  student_name: 'Math Test',
  assigned_at: '2024-03-20T20:00:00.000Z',
  due_date: null,
  status: 'assigned' as AssignmentStatus,
  theme: 'Math',
  level: 'A' as StudentLevel,
  student_language: 'en',
  score: 0,
  attempt_date: null
}]);

mockGetTeacherStudents.mockResolvedValue([{
  student_id: 1,
  full_name: 'Test Student',
  language: 'en',
  level: 'A' as StudentLevel,
  created_at: '2024-03-20T20:00:00.000Z',
  tests_taken: 0,
  average_score: 0
}]);

describe('TestAssignments Component', () => {
  const renderComponent = () => {
    render(
      <BrowserRouter>
        <TestAssignments testId={1} />
      </BrowserRouter>
    );
  };

  it('renders loading state and then assignments list', async () => {
    renderComponent();
    
    // Check if loading state is shown
    expect(screen.getByText('Loading assignments...')).toBeInTheDocument();
    
    // Wait for the assignments to load
    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
    });
    
    // Check for assignment info using data-testid
    const assignmentDate = screen.getByTestId('assignment-date');
    expect(assignmentDate).toBeInTheDocument();
    expect(assignmentDate.textContent).toMatch(/Assigned:/);
    expect(assignmentDate.textContent).toMatch(/Mar 20, 2024/);
  });

  it('handles empty assignments list', async () => {
    mockGetTeacherAssignments.mockResolvedValueOnce([]);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/No assignments yet/)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    mockGetTeacherAssignments.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load assignments. Please try again later.')).toBeInTheDocument();
    });
  });
}); 