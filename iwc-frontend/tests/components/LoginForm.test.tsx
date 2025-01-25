// @ts-ignore - React is used in JSX
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../../src/components/LoginForm';
import { AuthProvider } from '../../src/context/AuthContext';
import { login } from '../../src/api';
import { AuthResponse } from '../../src/types/auth-response';
import { Student } from '../../src/types/user';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the API module with typed mock function
jest.mock('../../src/api');
const mockLogin = jest.mocked(login);

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actualModule = jest.requireActual('react-router-dom') as object;
  return {
    ...actualModule,
    useNavigate: () => mockNavigate
  };
});

describe('LoginForm', () => {
  const mockLoginResponse: AuthResponse = {
    token: 'fake-token',
    user: {
      id: 1,
      username: 'testuser',
      role: 'student',
      full_name: 'Test User',
      language: 'en',
      level: 'A'
    } as Student
  };

  const renderLoginForm = () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    renderLoginForm();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('validates required fields before submission', async () => {
    renderLoginForm();
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /login/i });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    // Check HTML5 validation messages
    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    
    expect(usernameInput.validity.valid).toBeFalsy();
    expect(passwordInput.validity.valid).toBeFalsy();
  });

  it('handles successful login', async () => {
    mockLogin.mockResolvedValueOnce(mockLoginResponse);
    
    renderLoginForm();
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    
    // Verify API was called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    
    // Verify no error message is shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles failed login attempt', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    
    renderLoginForm();
    
    await act(async () => {
      // Fill in the form
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('clears error message when form is resubmitted', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockLoginResponse);
    
    renderLoginForm();
    
    await act(async () => {
      // First attempt - should fail
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    
    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    await act(async () => {
      // Second attempt - should succeed and clear error
      await userEvent.clear(screen.getByLabelText(/password/i));
      await userEvent.type(screen.getByLabelText(/password/i), 'correctpassword');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));
    });
    
    // Verify error is cleared
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });
  });

  it('prevents multiple submissions while login is in progress', async () => {
    // Create a delayed mock response
    const loginPromise = new Promise<AuthResponse>(resolve => 
      setTimeout(() => resolve(mockLoginResponse), 500)
    );
    mockLogin.mockImplementationOnce(() => loginPromise);
    
    renderLoginForm();
    
    // Fill in the form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // First click
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    // Verify button is disabled and shows loading state
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Logging in...');
    
    // Try to click again while loading
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    // Wait for the login promise to resolve
    await act(async () => {
      await loginPromise;
    });
    
    // Verify login was only called once
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });
}); 