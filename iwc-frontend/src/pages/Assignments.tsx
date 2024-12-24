import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentAssignment } from '../api';
import { getStudentAssignments } from '../api';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useNavigate } from 'react-router-dom';

const Assignments: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <DashboardTemplate
      title="Assignments"
      onLogout={logout}
      role="student"
    >
      <div className={styles.container}>
        {loading && <div>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && (
          <div className={styles.assignmentsList}>
            {assignments.map(assignment => (
              <div key={assignment.assignment_id} className={styles.assignmentCard}>
                <h3>{assignment.theme}</h3>
                <p>Level: {assignment.level}</p>
                <button
                  className={styles.button}
                  onClick={() => {
                    try {
                      navigate(`/test/${assignment.test_id}/take`);
                    } catch (err) {
                      setError('Failed to load test. Please try again.');
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Take Test'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
};

export default Assignments;