import { render, screen } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import AuthContext from '../../src/context/AuthContext';
import PrivateRoute from '../../src/components/PrivateRoute';
import '@testing-library/jest-dom';
import { Student, Teacher } from '../../src/types/user';

// Test component to render inside PrivateRoute
const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

// Mock user data
const mockStudent: Student = {
  id: 1,
  username: 'student1',
  full_name: 'Test Student',
  role: 'student',
  created_at: '2024-01-24T00:00:00Z',
  student_id: 1,
  language: 'English',
  level: 'A'
};

const mockTeacher: Teacher = {
  id: 2,
  username: 'teacher1',
  full_name: 'Test Teacher',
  role: 'teacher',
  created_at: '2024-01-24T00:00:00Z',
  teacher_id: 1,
  email: 'teacher@test.com'
};

// Mock context values
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  registerStudent: jest.fn(),
  registerTeacher: jest.fn(),
  logout: jest.fn()
};

describe('PrivateRoute', () => {
  it('allows access to authenticated users', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, isAuthenticated: true, user: mockTeacher }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, isAuthenticated: false, user: null }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('handles role-based access control', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, isAuthenticated: true, user: mockStudent }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('preserves the redirect location', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, isAuthenticated: false, user: null }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={<PrivateRoute />}>
              <Route index element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
}); 