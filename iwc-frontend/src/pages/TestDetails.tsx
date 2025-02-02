import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Test, Question } from '../types/test';
import { getTestById, deleteTest, deleteQuestion, updateTest } from '../api/index';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useAuth } from '../context/AuthContext';

const TestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<Test & { questions?: Question[] }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');
  const [editedLevel, setEditedLevel] = useState<string>('');
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState<number | null>(null);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        if (!id) return;
        
        const testData = await getTestById(parseInt(id));
        setTest(testData);
        setEditedTheme(testData.theme);
        setEditedLevel(testData.level);
      } catch (err) {
        setError('Failed to load test details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [id]);

  const handleDeleteTest = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    setIsDeletingTest(true);
    try {
      await deleteTest(parseInt(id));
      navigate('/teacher/dashboard');
    } catch (err) {
      setError('Failed to delete test. Please try again.');
    } finally {
      setIsDeletingTest(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!id || !window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    setIsDeletingQuestion(questionId);
    try {
      const updatedTest = await deleteQuestion(parseInt(id), questionId);
      setTest(updatedTest);
    } catch (err) {
      setError('Failed to delete question. Please try again.');
    } finally {
      setIsDeletingQuestion(null);
    }
  };

  const handleUpdateTest = async () => {
    if (!id) return;

    try {
      const updatedTest = await updateTest(parseInt(id), {
        theme: editedTheme,
        level: editedLevel as any,
      });
      setTest(updatedTest);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update test. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardTemplate
        title="Test Details"
        onLogout={() => {/* handle logout */}}
        role={user?.role || 'teacher'}
      >
        <div className={styles.dashboardContent}>
          <p>Loading test details...</p>
        </div>
      </DashboardTemplate>
    );
  }

  if (error) {
    return (
      <DashboardTemplate
        title="Test Details"
        onLogout={() => {/* handle logout */}}
        role={user?.role || 'teacher'}
      >
        <div className={styles.dashboardContent}>
          <p className={styles.error}>{error}</p>
          <button 
            className={styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </DashboardTemplate>
    );
  }

  if (!test) {
    return (
      <DashboardTemplate
        title="Test Details"
        onLogout={() => {/* handle logout */}}
        role={user?.role || 'teacher'}
      >
        <div className={styles.dashboardContent}>
          <p className={styles.error}>Test not found</p>
          <button 
            className={styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </DashboardTemplate>
    );
  }

  return (
    <DashboardTemplate
      title={`Test Details: ${test.theme}`}
      onLogout={() => {/* handle logout */}}
      role={user?.role || 'teacher'}
    >
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Test Information</h2>
            <div className={styles.headerActions}>
              <button 
                className={styles.secondaryButton}
                onClick={() => navigate(-1)}
              >
                Back to Dashboard
              </button>
              {user?.role === 'teacher' && (
                <>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Test'}
                  </button>
                  <button
                    className={`${styles.secondaryButton} ${styles.deleteButton}`}
                    onClick={handleDeleteTest}
                    disabled={isDeletingTest}
                  >
                    {isDeletingTest ? 'Deleting...' : 'Delete Test'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.testDetails}>
            {isEditing ? (
              <form onSubmit={handleUpdateTest}>
                <div className={styles.formGroup}>
                  <label htmlFor="theme">Theme:</label>
                  <input
                    type="text"
                    id="theme"
                    value={editedTheme}
                    onChange={(e) => setEditedTheme(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="level">Level:</label>
                  <select
                    id="level"
                    value={editedLevel}
                    onChange={(e) => setEditedLevel(e.target.value)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className={styles.headerActions}>
                  <button type="submit" className={styles.primaryButton}>
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.testInfo}>
                <p><strong>Theme:</strong> {test.theme}</p>
                <p><strong>Level:</strong> {test.level}</p>
                <p><strong>Created:</strong> {formatDate(test.created_at)}</p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Questions</h2>
            {user?.role === 'teacher' && (
              <div className={styles.headerActions}>
                <button
                  className={styles.primaryButton}
                  onClick={() => navigate(`/test/${test.test_id}/question/create`)}
                >
                  Add Question
                </button>
              </div>
            )}
          </div>

          <div className={styles.cardGrid}>
            {test.questions.length === 0 ? (
              <p>No questions added yet.</p>
            ) : (
              test.questions.map((question, index) => (
                <div key={question.question_id} className={styles.card}>
                  <div className={styles.questionHeader}>
                    <h3>Question {index + 1}</h3>
                    <span className={styles.questionType}>{question.question_type}</span>
                  </div>
                  <div className={styles.questionContent}>
                    {question.question_text && (
                      <p className={styles.questionText}>{question.question_text}</p>
                    )}
                  </div>
                  {user?.role === 'teacher' && (
                    <div className={styles.headerActions}>
                      <button
                        className={styles.secondaryButton}
                        onClick={() => navigate(`/edit-question/${id}/${question.question_id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteQuestion(question.question_id)}
                        disabled={isDeletingQuestion === question.question_id}
                      >
                        {isDeletingQuestion === question.question_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardTemplate>
  );
};

export default TestDetails;