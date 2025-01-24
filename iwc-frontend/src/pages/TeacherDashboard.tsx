import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Teacher } from '../types/user';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { getTeacherTests, getTeacherStudents, assignTest, StudentInfo } from '../api/index';
import { Test } from '../types/test';

// Types
interface DashboardStats {
  totalTests: number;
  activeStudents: number;
  pendingAssignments: number;
  completedTests: number;
  averageScore: number;
}

interface ExtendedTest extends Test {
  completed: boolean;
}

interface AssignTestModalProps {
  onClose: () => void;
  onAssign: (studentIds: number[], dueDate?: string) => void;
  students: StudentInfo[];
}

// Helper Functions
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

const getPerformanceClass = (score: number): string => {
  if (score >= 90) return styles.excellentPerformance;
  if (score >= 75) return styles.goodPerformance;
  if (score >= 60) return styles.averagePerformance;
  return styles.needsImprovement;
};

// Components
const StatsCard: React.FC<{ title: string; value: number; icon: string }> = ({ title, value, icon }) => (
  <div className={styles.statsCard}>
    <div className={styles.statsIcon}>{icon}</div>
    <div className={styles.statsContent}>
      <h3 className={styles.statsValue}>{value}</h3>
      <p className={styles.statsTitle}>{title}</p>
    </div>
  </div>
);

const AssignTestModal: React.FC<AssignTestModalProps> = ({ onClose, onAssign, students }) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedStudents, dueDate || undefined);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Assign Test to Students</h3>
          <button onClick={onClose} className={styles.closeButton}>��</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Select Students:</label>
            <div className={styles.studentCheckboxes}>
              {students.map((student) => (
                <label key={student.student_id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.student_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.student_id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.student_id));
                      }
                    }}
                  />
                  <span className={styles.checkmark}></span>
                  <span className={styles.studentName}>
                    {student.full_name}
                    <span className={styles.studentLevel}>Level {student.level}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dueDate">Due Date (Optional):</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryButton}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={selectedStudents.length === 0}
            >
              Assign Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const teacher = user as Teacher;
  
  // State
  const [tests, setTests] = useState<ExtendedTest[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    activeStudents: 0,
    pendingAssignments: 0,
    completedTests: 0,
    averageScore: 0
  });

  // Effects
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [fetchedTests, fetchedStudents] = await Promise.all([
          getTeacherTests(),
          getTeacherStudents()
        ]);
        const testsWithStatus = fetchedTests.map(test => ({
          ...test,
          completed: Math.random() > 0.5 // This should be replaced with actual completion logic
        }));
        setTests(testsWithStatus);
        setStudents(fetchedStudents);
        
        setStats({
          totalTests: testsWithStatus.length,
          activeStudents: fetchedStudents.length,
          pendingAssignments: testsWithStatus.filter(t => !t.completed).length,
          completedTests: testsWithStatus.filter(t => t.completed).length,
          averageScore: 0
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handlers
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTest = () => {
    navigate('/create-test');
  };

  const handleAssignClick = (testId: number) => {
    setSelectedTestId(testId);
    setShowAssignModal(true);
  };

  const handleAssignTest = async (studentIds: number[], dueDate?: string) => {
    if (!selectedTestId) return;

    try {
      await assignTest(selectedTestId, studentIds, dueDate);
      setShowAssignModal(false);
      setSelectedTestId(null);
      // Refresh data after assignment
      const [updatedTests, updatedStudents] = await Promise.all([
        getTeacherTests(),
        getTeacherStudents()
      ]);
      const testsWithStatus = updatedTests.map(test => ({
        ...test,
        completed: Math.random() > 0.5 // This should be replaced with actual completion logic
      }));
      setTests(testsWithStatus);
      setStudents(updatedStudents);
    } catch (err) {
      setError('Failed to assign test. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render
  return (
    <DashboardTemplate
      title={`Welcome, ${teacher.full_name}`}
      onLogout={handleLogout}
      role="teacher"
    >
      <div className={styles.dashboardContent}>
        {/* Stats Section */}
        <section className={styles.statsSection}>
          <StatsCard title="Total Tests" value={stats.totalTests} icon="📝" />
          <StatsCard title="Active Students" value={stats.activeStudents} icon="👥" />
          <StatsCard title="Pending Assignments" value={stats.pendingAssignments} icon="⏳" />
          <StatsCard title="Completed Tests" value={stats.completedTests} icon="✅" />
        </section>

        {/* Tests Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Tests</h2>
              <p className={styles.sectionSubtitle}>Manage and track your created tests</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.primaryButton}
                onClick={handleCreateTest}
              >
                <span className={styles.buttonIcon}>+</span>
                Create New Test
              </button>
            </div>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading tests...</p>
            </div>
          )}
          
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div className={styles.cardGrid}>
              {tests.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📝</span>
                  <h3>No Tests Created</h3>
                  <p>Start by creating your first test</p>
                </div>
              ) : (
                tests.map(test => (
                  <div key={test.test_id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{test.theme}</h3>
                      <span className={`${styles.badge} ${test.completed ? styles.successBadge : styles.warningBadge}`}>
                        {test.completed ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <div className={styles.cardContent}>
                      <p>Level: {test.level}</p>
                      <p>Created: {formatDate(test.created_at)}</p>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => handleAssignClick(test.test_id)}
                      >
                        Assign to Students
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Students Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Students</h2>
              <p className={styles.sectionSubtitle}>Monitor student progress and performance</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate('/students')}
              >
                <span className={styles.buttonIcon}>👥</span>
                View All Students
              </button>
            </div>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading students...</p>
            </div>
          )}
          
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div className={styles.cardGrid}>
              {students.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>👥</span>
                  <h3>No Students Yet</h3>
                  <p>Students will appear here once they join your class</p>
                </div>
              ) : (
                students.slice(0, 4).map(student => (
                  <div key={student.student_id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{student.full_name}</h3>
                      <span className={`${styles.levelBadge} ${getLevelClass(student.level)}`}>
                        Level {student.level}
                      </span>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.studentStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Tests Taken</span>
                          <span className={styles.statValue}>{student.tests_taken}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Average Score</span>
                          <span className={`${styles.statValue} ${getPerformanceClass(student.average_score)}`}>
                            {student.average_score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {students.length > 4 && (
                <div className={styles.card + ' ' + styles.viewMoreCard}>
                  <div className={styles.viewMoreContent}>
                    <p>+{students.length - 4} more students</p>
                    <button 
                      className={styles.secondaryButton}
                      onClick={() => navigate('/students')}
                    >
                      View All Students
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {showAssignModal && (
        <AssignTestModal
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignTest}
          students={students}
        />
      )}
    </DashboardTemplate>
  );
};

export default TeacherDashboard;