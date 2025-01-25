// @ts-ignore - React is used in JSX
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import StudentRegisterForm from '../../src/components/StudentRegisterForm';
import { AuthProvider } from '../../src/context/AuthContext';
import { registerStudent } from '../../src/api';
import { AuthResponse } from '../../src/types/auth-response';
import { Student } from '../../src/types/user';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the API module
jest.mock('../../src/api');
const mockRegisterStudent = jest.mocked(registerStudent);

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actualModule = jest.requireActual('react-router-dom') as object;
  return {
    ...actualModule,
    useNavigate: () => mockNavigate
  };
});

describe('StudentRegisterForm', () => {
  const validFormData = {
    username: 'testuser',
    password: 'Password123!',
    full_name: 'Test User',
    language: 'English',
    level: 'B'
  };

  const mockRegisterResponse: AuthResponse = {
    token: 'fake-token',
    user: {
      id: 1,
      username: 'newuser',
      role: 'student',
      full_name: 'New User',
      language: 'en',
      level: 'A'
    } as Student
  };

  const renderForm = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StudentRegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form with all required fields', () => {
    renderForm();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    renderForm();
    const form = screen.getByRole('form') as HTMLFormElement;
    const submitButton = screen.getByRole('button', { name: /register/i });
    
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(form.checkValidity()).toBeFalsy();
    
    // Check required fields individually
    const requiredInputs = {
      username: screen.getByLabelText(/username/i) as HTMLInputElement,
      password: screen.getByLabelText(/password/i) as HTMLInputElement,
      fullName: screen.getByLabelText(/full name/i) as HTMLInputElement,
      language: screen.getByLabelText(/language/i) as HTMLInputElement
    } as const;
    
    // These fields should be empty and required
    Object.values(requiredInputs).forEach(input => {
      expect(input.value).toBe('');
      expect(input.required).toBeTruthy();
    });

    // Level should have the default value 'A'
    const levelInput = screen.getByLabelText(/level/i) as HTMLSelectElement;
    expect(levelInput.value).toBe('A');
    expect(levelInput.required).toBeTruthy();
  });

  it('handles successful registration', async () => {
    mockRegisterStudent.mockResolvedValueOnce(mockRegisterResponse);
    
    renderForm();
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
      await userEvent.type(screen.getByLabelText(/password/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await userEvent.type(screen.getByLabelText(/language/i), validFormData.language);
      await userEvent.selectOptions(screen.getByLabelText(/level/i), validFormData.level);
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify API was called with correct data
    expect(mockRegisterStudent).toHaveBeenCalledWith(validFormData);
    
    // Verify no error message is shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles duplicate username error', async () => {
    const errorMessage = 'Username already exists';
    mockRegisterStudent.mockRejectedValueOnce(new Error(errorMessage));
    
    renderForm();
    
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
      await userEvent.type(screen.getByLabelText(/password/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await userEvent.type(screen.getByLabelText(/language/i), validFormData.language);
      await userEvent.selectOptions(screen.getByLabelText(/level/i), validFormData.level);
      
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('password requirements', () => {
    const testPasswordRequirement = async (password: string, expectedError: string) => {
      mockRegisterStudent.mockRejectedValueOnce(new Error(expectedError));
      
      renderForm();
      
      await act(async () => {
        await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
        await userEvent.type(screen.getByLabelText(/password/i), password);
        await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
        await userEvent.type(screen.getByLabelText(/language/i), validFormData.language);
        await userEvent.selectOptions(screen.getByLabelText(/level/i), validFormData.level);
        
        await userEvent.click(screen.getByRole('button', { name: /register/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(expectedError)).toBeInTheDocument();
      });
    };

    it('requires minimum length', async () => {
      await testPasswordRequirement('short', 'Password must be at least 8 characters long');
    });

    it('requires uppercase letter', async () => {
      await testPasswordRequirement('password123!', 'Password must contain at least one uppercase letter');
    });

    it('requires lowercase letter', async () => {
      await testPasswordRequirement('PASSWORD123!', 'Password must contain at least one lowercase letter');
    });

    it('requires number', async () => {
      await testPasswordRequirement('Password!', 'Password must contain at least one number');
    });

    it('requires special character', async () => {
      await testPasswordRequirement('Password123', 'Password must contain at least one special character');
    });
  });

  it('clears error message when form is resubmitted', async () => {
    const errorMessage = 'Username already exists';
    mockRegisterStudent
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockRegisterResponse);
    
    renderForm();
    
    // First attempt - should fail
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
      await userEvent.type(screen.getByLabelText(/password/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await userEvent.type(screen.getByLabelText(/language/i), validFormData.language);
      await userEvent.selectOptions(screen.getByLabelText(/level/i), validFormData.level);
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Second attempt with different username - should succeed
    await act(async () => {
      await userEvent.clear(screen.getByLabelText(/username/i));
      await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify error is cleared
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });
}); 