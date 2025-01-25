// @ts-ignore - React is used in JSX
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import TeacherRegisterForm from '../../src/components/TeacherRegisterForm';
import { AuthProvider } from '../../src/context/AuthContext';
import { registerTeacher } from '../../src/api';
import { AuthResponse } from '../../src/types/auth-response';
import { Teacher } from '../../src/types/user';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the API module
jest.mock('../../src/api');
const mockRegisterTeacher = jest.mocked(registerTeacher);

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actualModule = jest.requireActual('react-router-dom') as object;
  return {
    ...actualModule,
    useNavigate: () => mockNavigate
  };
});

describe('TeacherRegisterForm', () => {
  const validFormData = {
    username: 'teacheruser',
    password: 'Password123!',
    full_name: 'Teacher User',
    email: 'teacher@example.com'
  };

  const mockRegisterResponse: AuthResponse = {
    token: 'fake-token',
    user: {
      id: 1,
      username: 'newteacher',
      role: 'teacher',
      full_name: 'New Teacher',
      email: 'teacher@example.com'
    } as Teacher
  };

  const renderForm = () => {
    const utils = render(
      <BrowserRouter>
        <AuthProvider>
          <TeacherRegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );
    return {
      ...utils,
      user: userEvent.setup()
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form with all required fields', () => {
    renderForm();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
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
      email: screen.getByLabelText(/email/i) as HTMLInputElement
    } as const;
    
    // All fields should be empty and required
    Object.values(requiredInputs).forEach(input => {
      expect(input.value).toBe('');
      expect(input.required).toBeTruthy();
    });
  });

  it('handles successful registration', async () => {
    mockRegisterTeacher.mockResolvedValueOnce(mockRegisterResponse);
    
    renderForm();
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
      await userEvent.type(screen.getByLabelText(/password/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify API was called with correct data
    expect(mockRegisterTeacher).toHaveBeenCalledWith(validFormData);
    
    // Verify no error message is shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles duplicate username error', async () => {
    const errorMessage = 'Username already exists';
    mockRegisterTeacher.mockRejectedValueOnce(new Error(errorMessage));
    
    renderForm();
    
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
      await userEvent.type(screen.getByLabelText(/password/i), validFormData.password);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
      
      await userEvent.click(screen.getByRole('button', { name: /register/i }));
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('password requirements', () => {
    const testPasswordRequirement = async (password: string, expectedError: string) => {
      mockRegisterTeacher.mockRejectedValueOnce(new Error(expectedError));
      
      renderForm();
      
      await act(async () => {
        await userEvent.type(screen.getByLabelText(/username/i), validFormData.username);
        await userEvent.type(screen.getByLabelText(/password/i), password);
        await userEvent.type(screen.getByLabelText(/full name/i), validFormData.full_name);
        await userEvent.type(screen.getByLabelText(/email/i), validFormData.email);
        
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
    const { user } = renderForm();
    const firstErrorMessage = 'Username already exists';

    // Fill in form with valid data
    await user.type(screen.getByLabelText(/username/i), 'teacheruser');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.type(screen.getByLabelText(/full name/i), 'Teacher User');
    await user.type(screen.getByLabelText(/email/i), 'teacher@example.com');

    // Mock first submission to fail with username error
    mockRegisterTeacher.mockRejectedValueOnce(new Error(firstErrorMessage));

    // Submit form first time
    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    // Wait for first error message with retries
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(firstErrorMessage);
    }, { timeout: 3000 });

    // Change username and submit again
    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), 'newteacheruser');

    // Mock second submission to succeed
    mockRegisterTeacher.mockResolvedValueOnce(mockRegisterResponse);

    // Submit form second time
    await user.click(submitButton);

    // Verify error message is cleared
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('validates email format', async () => {
    const { user } = renderForm();
    const errorMessage = 'Invalid email format';

    await act(async () => {
      await user.type(screen.getByLabelText(/username/i), validFormData.username);
      await user.type(screen.getByLabelText(/password/i), validFormData.password);
      await user.type(screen.getByLabelText(/full name/i), validFormData.full_name);
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /register/i }));
    });

    const errorElement = await screen.findByRole('alert');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(errorMessage);

    // Ensure registerTeacher is not called due to validation failure
    expect(mockRegisterTeacher).not.toHaveBeenCalled();
  });
});