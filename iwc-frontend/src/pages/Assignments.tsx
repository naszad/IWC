import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentAssignment } from '../api';
import { getStudentAssignments } from '../api';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useNavigate } from 'react-router-dom';

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
  if (!score) return '';
  if (score >= 90) return styles.excellentPerformance;
  if (score >= 75) return styles.goodPerformance;
  if (score >= 60) return styles.averagePerformance;
  return styles.needsImprovement;
};

const getLevelClass = (level: string): string => {
  switch (level.toUpperCase()) {
    case 'A':
      return styles.levelA;
    case 'B':
      return styles.levelB;
    case 'C':
      return styles.levelC;
    case 'D':
      return styles.levelD;
    default:
      return styles.levelA;
  }
};

const Assignments: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || assignment.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

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
      title="Your Assignments"
      onLogout={logout}
      role="student"
    >
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>All Assignments</h2>
              <p className={styles.sectionSubtitle}>View and complete your assigned tests</p>
            </div>
            <div className={styles.filterControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={styles.levelFilter}
              >
                <option value="all">All Levels</option>
                <option value="A">Level A</option>
                <option value="B">Level B</option>
                <option value="C">Level C</option>
                <option value="D">Level D</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.statusFilter}
              >
                <option value="all">All Status</option>
                <option value="assigned">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
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
              {filteredAssignments.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📚</span>
                  <h3>No Assignments Found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredAssignments.map((assignment) => (
                  <div key={assignment.assignment_id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{assignment.theme}</h3>
                      <span className={`${styles.badge} ${getStatusClass(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    
                    <div className={styles.studentStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Level</span>
                        <span className={`${styles.statValue} ${getLevelClass(assignment.level)}`}>
                          {assignment.level}
                        </span>
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

                    {assignment.status !== 'completed' && (
                      <div className={styles.cardActions}>
                        <button
                          className={styles.primaryButton}
                          onClick={() => navigate(`/test/${assignment.test_id}/take`)}
                          disabled={loading}
                        >
                          Take Test
                        </button>
                      </div>
                    )}
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