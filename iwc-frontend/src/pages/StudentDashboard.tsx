import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Student } from '../types/user';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { getStudentAssignments, StudentAssignment } from '../api/index';

// Types
interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageScore: number;
}

// Components
const StatsCard: React.FC<{ title: string; value: number | string; icon: string }> = ({ title, value, icon }) => (
  <div className={styles.statsCard}>
    <div className={styles.statsIcon}>{icon}</div>
    <div className={styles.statsContent}>
      <h3 className={styles.statsValue}>{value}</h3>
      <p className={styles.statsTitle}>{title}</p>
    </div>
  </div>
);

// Helper Functions
const getStatusClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return styles.successBadge;
    case 'pending':
      return styles.warningBadge;
    case 'overdue':
      return styles.errorBadge;
    default:
      return '';
  }
};

const getPerformanceClass = (score: number | null): string => {
  if (score === null) return '';
  if (score >= 90) return styles.excellentPerformance;
  if (score >= 75) return styles.goodPerformance;
  if (score >= 60) return styles.averagePerformance;
  return styles.needsImprovement;
};

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const student = user as Student;
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageScore: 0
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getStudentAssignments();
        setAssignments(data);
        
        // Calculate stats
        const completed = data.filter(a => a.status === 'completed').length;
        const totalScore = data
          .filter(a => a.score !== null)
          .reduce((sum, a) => sum + (a.score || 0), 0);
        const averageScore = completed > 0 ? Math.round(totalScore / completed) : 0;
        
        setStats({
          totalAssignments: data.length,
          completedAssignments: completed,
          pendingAssignments: data.filter(a => a.status === 'assigned').length, // Changed 'pending' to 'assigned'
          averageScore
        });
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardTemplate
      title={`Welcome, ${student.full_name}`}
      onLogout={handleLogout}
      role="student"
    >
      <div className={styles.dashboardContent}>
        {/* Stats Section */}
        <section className={styles.statsSection}>
          <StatsCard title="Total Assignments" value={stats.totalAssignments} icon="📚" />
          <StatsCard title="Completed" value={stats.completedAssignments} icon="✅" />
          <StatsCard title="Pending" value={stats.pendingAssignments} icon="⏳" />
          <StatsCard title="Average Score" value={`${stats.averageScore}%`} icon="📊" />
        </section>

        {/* Assignments Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Assignments</h2>
              <p className={styles.sectionSubtitle}>View and complete your assigned tests</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate('/assignments')}
              >
                <span className={styles.buttonIcon}>📝</span>
                View All Assignments
              </button>
            </div>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading assignments...</p>
            </div>
          )}
          
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div className={styles.cardGrid}>
              {assignments.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📚</span>
                  <h3>No Assignments Yet</h3>
                  <p>Your assignments will appear here when teachers assign them to you</p>
                </div>
              ) : (
                assignments.slice(0, 4).map((assignment) => (
                  <div key={assignment.assignment_id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{assignment.theme}</h3>
                      <span className={`${styles.badge} ${getStatusClass(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.studentStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Level</span>
                          <span className={styles.statValue}>{assignment.level}</span>
                        </div>
                        {assignment.score !== null && (
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Score</span>
                            <span className={`${styles.statValue} ${getPerformanceClass(assignment.score)}`}>
                              {assignment.score}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={styles.studentInfo}>
                        <span>
                          <span className={styles.infoIcon}>📅</span>
                          Due: {formatDate(assignment.due_date)}
                        </span>
                        {assignment.attempt_date && (
                          <span>
                            <span className={styles.infoIcon}>✍️</span>
                            Attempted: {formatDate(assignment.attempt_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    {assignment.status !== 'completed' && (
                      <div className={styles.cardActions}>
                        <button
                          className={styles.primaryButton}
                          onClick={() => navigate(`/test/${assignment.test_id}/take`)}
                        >
                          Take Test
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {assignments.length > 4 && (
                <div className={`${styles.card} ${styles.viewMoreCard}`}>
                  <div className={styles.viewMoreContent}>
                    <p>+{assignments.length - 4} more assignments</p>
                    <button 
                      className={styles.secondaryButton}
                      onClick={() => navigate('/assignments')}
                    >
                      View All Assignments
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Progress Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Progress</h2>
              <p className={styles.sectionSubtitle}>Track your learning journey</p>
            </div>
          </div>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Current Level</h3>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.studentStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Level</span>
                    <span className={styles.statValue}>{student.level}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Tests Completed</span>
                    <span className={styles.statValue}>{stats.completedAssignments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardTemplate>
  );
};

export default StudentDashboard;