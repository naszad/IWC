import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import theme from './styles/theme';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProficiencyTracking from './pages/ProficiencyTracking';
import CreateAssessment from './pages/CreateAssessment';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import TakeAssessment from './pages/TakeAssessment';
import AssessmentResults from './pages/AssessmentResults';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              
              {/* Assessment routes */}
              <Route
                path="/assessments"
                element={
                  <ProtectedRoute>
                    <Assessments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments/:id"
                element={
                  <ProtectedRoute>
                    <AssessmentDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments/:id/take"
                element={
                  <ProtectedRoute>
                    <TakeAssessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessments/:id/results"
                element={
                  <ProtectedRoute>
                    <AssessmentResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/proficiency"
                element={
                  <ProtectedRoute>
                    <ProficiencyTracking />
                  </ProtectedRoute>
                }
              />

              {/* Instructor-only routes */}
              <Route
                path="/assessments/create"
                element={
                  <ProtectedRoute requiredRole="instructor">
                    <CreateAssessment />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
