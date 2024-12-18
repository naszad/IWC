// frontend/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentRegisterForm from '../components/StudentRegisterForm';
import TeacherRegisterForm from '../components/TeacherRegisterForm';
import styles from '../styles/Auth.module.css';

const RegisterPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className={styles.formWrapper}>
          <h1 className="text-center">Register</h1>
          
          <div className={styles.roleSelector}>
            <button
              className={`${styles.roleButton} ${selectedRole === 'student' ? styles.active : ''}`}
              onClick={() => setSelectedRole('student')}
            >
              Student
            </button>
            <button
              className={`${styles.roleButton} ${selectedRole === 'teacher' ? styles.active : ''}`}
              onClick={() => setSelectedRole('teacher')}
            >
              Teacher
            </button>
          </div>

          {selectedRole === 'student' ? (
            <StudentRegisterForm />
          ) : (
            <TeacherRegisterForm />
          )}

          <p className={`${styles.loginLink} text-center mt-4`}>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;