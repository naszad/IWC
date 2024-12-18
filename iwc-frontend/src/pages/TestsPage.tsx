import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';
import { Test, TestAssignment, getTeacherTests, getTeacherAssignments, deleteTest } from '../api';

interface TestDetailsModalProps {
  test: Test;
  assignments: TestAssignment[];
  onClose: () => void;
  onDelete: () => void;
}

const TestDetailsModal: React.FC<TestDetailsModalProps> = ({ test, assignments, onClose, onDelete }) => {
  const navigate = useNavigate();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    onDelete();
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Test Details</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.testDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Theme</span>
              <span className={styles.detailValue}>{test.theme}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Level</span>
              <span className={styles.detailValue}>{test.level}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Questions</span>
              <span className={styles.detailValue}>{test.question_count}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.detailValue}>
                {new Date(test.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className={styles.assignmentsSection}>
            <h4>Recent Assignments</h4>
            {assignments.length > 0 ? (
              <div className={styles.assignmentsList}>
                {assignments.map((assignment) => (
                  <div key={assignment.assignment_id} className={styles.assignmentItem}>
                    <div className={styles.assignmentHeader}>
                      <h5>{assignment.student_name}</h5>
                      <span className={`${styles.statusBadge} ${styles[assignment.status]}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.assignmentStats}>
                      <span>
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                      {assignment.due_date && (
                        <span>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.score !== null && (
                        <span>Score: {assignment.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noAssignments}>No assignments yet</p>
            )}
          </div>

          <div className={styles.modalActions}>
            {!showConfirmDelete ? (
              <>
                <button
                  onClick={() => navigate(`/test/${test.test_id}`)}
                  className={styles.primaryButton}
                >
                  Edit Test
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className={styles.deleteButton}
                >
                  Delete Test
                </button>
              </>
            ) : (
              <div className={styles.confirmDelete}>
                <p>Are you sure you want to delete this test?</p>
                <div className={styles.confirmActions}>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className={styles.secondaryButton}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className={styles.deleteButton}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedTests, fetchedAssignments] = await Promise.all([
          getTeacherTests(),
          getTeacherAssignments()
        ]);
        setTests(fetchedTests);
        setAssignments(fetchedAssignments);
      } catch (err) {
        setError('Failed to load tests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTestClick = (test: Test) => {
    const testAssignments = assignments.filter(a => a.test_id === test.test_id);
    setSelectedTest(test);
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;

    try {
      await deleteTest(selectedTest.test_id);
      setTests(tests.filter(t => t.test_id !== selectedTest.test_id));
      setSelectedTest(null);
    } catch (err) {
      setError('Failed to delete test. Please try again.');
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || test.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getTestStatus = (test: Test) => {
    const testAssignments = assignments.filter(a => a.test_id === test.test_id);
    if (testAssignments.length === 0) return 'Not Assigned';
    const hasActive = testAssignments.some(a => ['assigned', 'in_progress'].includes(a.status));
    if (hasActive) return 'Active';
    return 'Completed';
  };

  return (
    <DashboardTemplate
      title="Test Management"
      onLogout={() => navigate('/login')}
      role="teacher"
    >
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Tests</h2>
              <p className={styles.sectionSubtitle}>Manage and track your created tests</p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.filterControls}>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className={styles.levelFilter}
                >
                  <option value="all">All Levels</option>
                  <option value="A">Level A</option>
                  <option value="B">Level B</option>
                  <option value="C">Level C</option>
                  <option value="D">Level D</option>
                </select>
              </div>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate('/create-test')}
              >
                <span className={styles.buttonIcon}>+</span>
                Create Test
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
            <div className={styles.testsGrid}>
              {filteredTests.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📝</span>
                  <h3>No tests found</h3>
                  <p>Start by creating your first test!</p>
                  <button 
                    className={styles.primaryButton}
                    onClick={() => navigate('/create-test')}
                  >
                    Create Test
                  </button>
                </div>
              ) : (
                filteredTests.map((test) => (
                  <div
                    key={test.test_id}
                    className={styles.testCard}
                    onClick={() => handleTestClick(test)}
                  >
                    <div className={styles.testHeader}>
                      <h3>{test.theme}</h3>
                      <span className={`${styles.statusBadge} ${styles[getTestStatus(test).toLowerCase().replace(' ', '_')]}`}>
                        {getTestStatus(test)}
                      </span>
                    </div>
                    <div className={styles.testStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Level</span>
                        <span className={styles.statValue}>{test.level}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Questions</span>
                        <span className={styles.statValue}>{test.question_count}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Assignments</span>
                        <span className={styles.statValue}>
                          {assignments.filter(a => a.test_id === test.test_id).length}
                        </span>
                      </div>
                    </div>
                    <div className={styles.testMeta}>
                      <span className={styles.createdDate}>
                        Created {new Date(test.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {selectedTest && (
          <TestDetailsModal
            test={selectedTest}
            assignments={assignments.filter(a => a.test_id === selectedTest.test_id)}
            onClose={() => setSelectedTest(null)}
            onDelete={handleDeleteTest}
          />
        )}
      </div>
    </DashboardTemplate>
  );
};

export default TestsPage;