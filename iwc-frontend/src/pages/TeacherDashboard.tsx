import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Teacher } from '../types/user';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { getTeacherTests, getTeacherStudents, assignTest, StudentInfo } from '../api/index';
import { Test } from '../types/test';
import StudentManagement from '../components/StudentManagement';

// Types
interface DashboardStats {
  totalTests: number;
  activeStudents: number;
  pendingAssignments: number;
  completedTests: number;
}

interface AssignTestModalProps {
  onClose: () => void;
  onAssign: (studentIds: number[], dueDate?: string) => void;
  students: StudentInfo[];
}

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
          <button onClick={onClose} className={styles.closeButton}>×</button>
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
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    activeStudents: 0,
    pendingAssignments: 0,
    completedTests: 0
  });

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedTests, fetchedStudents] = await Promise.all([
          getTeacherTests(),
          getTeacherStudents()
        ]);
        setTests(fetchedTests);
        setStudents(fetchedStudents);
        
        // Calculate stats
        setStats({
          totalTests: fetchedTests.length,
          activeStudents: fetchedStudents.length,
          pendingAssignments: fetchedTests.filter(t => !t.completed).length,
          completedTests: fetchedTests.filter(t => t.completed).length
        });
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      setTests(updatedTests);
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
      role="teacher"  // Pass role prop
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
          
          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}
          
          {!loading && !error && (
            <div className={styles.cardGrid}>
              {tests.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📝</span>
                  <h3>No tests created yet</h3>
                  <p>Start by creating your first test!</p>
                  <button 
                    className={styles.primaryButton}
                    onClick={handleCreateTest}
                  >
                    Create Test
                  </button>
                </div>
              ) : (
                tests.map((test) => (
                  <div key={test.test_id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3>{test.theme}</h3>
                      <span className={test.completed ? styles.successBadge : styles.warningBadge}>
                        {test.completed ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.testInfo}>
                        <span>
                          <span className={styles.infoIcon}>📊</span>
                          Level {test.level}
                        </span>
                        <span>
                          <span className={styles.infoIcon}>📅</span>
                          {formatDate(test.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button 
                        onClick={() => handleAssignClick(test.test_id)}
                        className={styles.secondaryButton}
                      >
                        <span className={styles.buttonIcon}>👥</span>
                        Assign
                      </button>
                      <button 
                        onClick={() => navigate(`/test/${test.test_id}`)}
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
          )}
        </section>

        {/* Student Management Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Student Management</h2>
              <p className={styles.sectionSubtitle}>Manage your students and their progress</p>
            </div>
          </div>
          <StudentManagement />
        </section>

        {/* Modal */}
        {showAssignModal && (
          <AssignTestModal
            onClose={() => {
              setShowAssignModal(false);
              setSelectedTestId(null);
            }}
            onAssign={handleAssignTest}
            students={students}
          />
        )}
      </div>
    </DashboardTemplate>
  );
};

export default TeacherDashboard;