import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import './App.css';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentListPage from './pages/AssessmentListPage';
import AssessmentDetailPage from './pages/AssessmentDetailPage';
import SubmissionPage from './pages/SubmissionPage';

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user?.role && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="assessments" element={<AssessmentListPage />} />
            <Route path="assessments/:id" element={<AssessmentDetailPage />} />
            <Route path="submissions/:id" element={<SubmissionPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
