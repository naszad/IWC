// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateTestPage from './pages/CreateTestPage';
import TestDetails from './pages/TestDetails';
import EditQuestion from './pages/EditQuestion';
import CreateQuestion from './pages/CreateQuestion';
import TakeTest from './pages/TakeTest';
import StudentsPage from './pages/StudentsPage';
import TestsPage from './pages/TestsPage';
import Assignments from './pages/Assignments';

// Protected Route component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'student' | 'teacher';
}> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/${user?.role}/dashboard`} />;
  }

  return <>{children}</>;
};

// Dashboard redirect component
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  return <Navigate to={`/${user?.role}/dashboard`} replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/student/dashboard" element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />

        <Route path="/tests" element={
          <ProtectedRoute requiredRole="teacher">
            <TestsPage />
          </ProtectedRoute>
        } />

        <Route path="/students" element={
          <ProtectedRoute requiredRole="teacher">
            <StudentsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/create-test" element={
          <ProtectedRoute requiredRole="teacher">
            <CreateTestPage />
          </ProtectedRoute>
        } />
        
        <Route path="/test/:id" element={
          <ProtectedRoute>
            <TestDetails />
          </ProtectedRoute>
        } />

        <Route path="/test/:id/take" element={
          <ProtectedRoute requiredRole="student">
            <TakeTest />
          </ProtectedRoute>
        } />
        
        <Route path="/test/:testId/question/:questionId/edit" element={
          <ProtectedRoute requiredRole="teacher">
            <EditQuestion />
          </ProtectedRoute>
        } />
        
        <Route path="/test/:testId/question/create" element={
          <ProtectedRoute requiredRole="teacher">
            <CreateQuestion />
          </ProtectedRoute>
        } />
        
        <Route path="/assignments" element={<Assignments />} />
        
        <Route path="/" element={<DashboardRedirect />} />
      </Routes>
    </Router>
  );
};

export default App;