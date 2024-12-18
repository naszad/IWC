import React, { useState, useEffect } from 'react';
import { getTeacherStudents, getStudentProgress } from '../api/index';
import { StudentInfo, StudentProgress } from '../api/index';
import styles from '../styles/Dashboard.module.css';
import { useNavigate } from 'react-router-dom';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setError(null);
        setLoading(true);
        const fetchedStudents = await getTeacherStudents();
        setStudents(fetchedStudents);
      } catch (err) {
        setError('Failed to load students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleViewDetails = (studentId: number) => {
    // Navigate to student details page (you'll need to implement this route)
    navigate(`/student/${studentId}`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        {error}
      </div>
    );
  }

  return (
    <div className={styles.cardGrid}>
      {students.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>👥</span>
          <h3>No students yet</h3>
          <p>Students will appear here once they join your class</p>
        </div>
      ) : (
        students.map((student) => (
          <div key={student.student_id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>{student.full_name}</h3>
              <span className={student.average_score >= 75 ? styles.successBadge : styles.warningBadge}>
                Level {student.level}
              </span>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.studentInfo}>
                <span>
                  <span className={styles.infoIcon}>📊</span>
                  Average Score: {student.average_score ? `${Math.round(student.average_score)}%` : 'N/A'}
                </span>
                <span>
                  <span className={styles.infoIcon}>📝</span>
                  Tests Taken: {student.tests_taken}
                </span>
                <span>
                  <span className={styles.infoIcon}>🌍</span>
                  Language: {student.language}
                </span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button 
                onClick={() => handleViewDetails(student.student_id)}
                className={styles.primaryButton}
              >
                <span className={styles.buttonIcon}>👁️</span>
                View Details
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentManagement; 