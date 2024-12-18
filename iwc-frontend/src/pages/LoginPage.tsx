// frontend/src/pages/LoginPage.tsx
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import styles from '../styles/Auth.module.css';

const LoginPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className={styles.formWrapper}>
          <h1 className="text-center">Login</h1>
          <LoginForm />
          <p className={`${styles.registerLink} text-center mt-4`}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
