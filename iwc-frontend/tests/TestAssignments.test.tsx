import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TestAssignments from '../src/components/TestAssignments';

// Mock the API calls
jest.mock('../src/api', () => ({
  getTeacherAssignments: jest.fn(() => Promise.resolve([
    {
      assignment_id: 1,
      test_id: 1,
      student_name: 'Math Test',
      assigned_at: '2024-03-20T20:00:00.000Z',
      status: 'pending',
      score: 0
    }
  ])),
  getTeacherStudents: jest.fn(() => Promise.resolve([
    {
      student_id: 1,
      full_name: 'Test Student',
      level: 'Beginner'
    }
  ]))
}));

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
    const { getTeacherAssignments } = require('../src/api');
    (getTeacherAssignments as jest.Mock).mockResolvedValueOnce([]);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/No assignments yet/)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    const { getTeacherAssignments } = require('../src/api');
    (getTeacherAssignments as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load assignments. Please try again later.')).toBeInTheDocument();
    });
  });
}); 