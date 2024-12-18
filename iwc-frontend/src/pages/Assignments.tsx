
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types/user';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { getStudentAssignments, StudentAssignment } from '../api/index';

const Assignments: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const student = user as Student;
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getStudentAssignments();
        setAssignments(data);
      } catch (err) {
        setError('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return '#f39c12';
      case 'completed':
        return '#27ae60';
      case 'overdue':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  return (
    <DashboardTemplate
      title="Your Assignments"
      onLogout={handleLogout}
      role="student"
    >
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Your Assignments</h2>
          </div>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading assignments...</p>
            </div>
          )}
          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className={styles.assignmentsList}>
              {assignments.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📄</span>
                  <h3>No assignments available</h3>
                  <p>Your teacher hasn't assigned any tests yet.</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.assignment_id}
                    className={styles.assignmentCard}
                  >
                    <div className={styles.assignmentHeader}>
                      <h4>{assignment.theme}</h4>
                      <div className={styles.assignmentActions}>
                        <span
                          style={{
                            color: getStatusColor(assignment.status),
                            fontWeight: 'bold',
                          }}
                        >
                          {assignment.status}
                        </span>
                        {assignment.status === 'assigned' && (
                          <button
                            className={styles.primaryButton}
                            onClick={() =>
                              navigate(`/test/${assignment.test_id}/take`)
                            }
                          >
                            Take Test
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.assignmentInfo}>
                      <span>Level: {assignment.level}</span>
                      <span>
                        Assigned: {formatDate(assignment.assigned_at)}
                      </span>
                      {assignment.due_date && (
                        <span>Due: {formatDate(assignment.due_date)}</span>
                      )}
                      {assignment.score !== null && (
                        <span>Score: {assignment.score}%</span>
                      )}
                      {assignment.attempt_date && (
                        <span>
                          Attempted: {formatDate(assignment.attempt_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardTemplate>
  );
};

export default Assignments;