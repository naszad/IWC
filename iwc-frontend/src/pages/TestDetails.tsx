import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Test, Question, TestAttempt, QuestionType, PictureVocabularyAnswers, SequenceOrderAnswers, FillInTheBlankAnswers, ListeningSelectionAnswers } from '../types/test';
import { getTestById, getTestResults, deleteTest, deleteQuestion, updateTest } from '../api/index';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useAuth } from '../context/AuthContext';
import TestAssignments from '../components/TestAssignments';

interface ExpandedQuestion {
  index: number;
  isExpanded: boolean;
}

const QuestionTypeLabels: Record<QuestionType, string> = {
  picture_vocabulary: 'Picture-Based Vocabulary',
  sequence_order: 'Sequence Order Images',
  fill_in_the_blank: 'Fill in the Blank',
  listening_selection: 'Listening Image Selection'
};

const TestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<Test & { questions?: Question[] }>();
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<ExpandedQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTheme, setEditedTheme] = useState('');
  const [editedLevel, setEditedLevel] = useState<string>('');
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState<number | null>(null);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        if (!id) return;
        
        const [testData, resultsData] = await Promise.all([
          getTestById(parseInt(id)),
          getTestResults(parseInt(id))
        ]);
        
        setTest(testData);
        setEditedTheme(testData.theme);
        setEditedLevel(testData.level);
        setResults(Array.isArray(resultsData) ? resultsData : [resultsData]);
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

  const handleDeleteQuestion = async (questionIndex: number) => {
    if (!id || !window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    setIsDeletingQuestion(questionIndex);
    try {
      const updatedTest = await deleteQuestion(parseInt(id), questionIndex);
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

  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestion(prev => 
      prev?.index === index && prev.isExpanded 
        ? null 
        : { index, isExpanded: true }
    );
  };

  const renderPictureVocabularyQuestion = (question: Question) => {
    const answers = question.possible_answers as PictureVocabularyAnswers;
    return (
      <div className={styles.questionContent}>
        <div className={styles.imagesGrid}>
          {answers.images.map((imageUrl, idx) => (
            <div key={idx} className={styles.imageContainer}>
              <img src={imageUrl} alt={`Option ${idx + 1}`} className={styles.questionImage} />
              <p className={styles.wordOption}>
                {answers.words[idx]}
                {answers.words[idx] === question.correct_answer && (
                  <span className={styles.correctBadge}> (Correct)</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSequenceOrderQuestion = (question: Question) => {
    const answers = question.possible_answers as SequenceOrderAnswers;
    const correctSequence = question.correct_answer.split(',');
    
    return (
      <div className={styles.questionContent}>
        <h5>Image Sequence</h5>
        <div className={styles.sequenceGrid}>
          {answers.images.map((imageUrl, idx) => (
            <div key={idx} className={styles.sequenceItem}>
              <img src={imageUrl} alt={`Sequence ${idx + 1}`} className={styles.questionImage} />
              <p className={styles.sequenceNumber}>
                Position in sequence: {correctSequence.indexOf(idx.toString()) + 1}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFillInBlankQuestion = (question: Question) => {
    const answers = question.possible_answers as FillInTheBlankAnswers;
    
    return (
      <div className={styles.questionContent}>
        <div className={styles.sentenceContainer}>
          <h5>Sentence with Blank</h5>
          <p className={styles.sentence}>{answers.sentence}</p>
        </div>
        <div className={styles.wordOptions}>
          <h5>Word Options</h5>
          <div className={styles.wordsList}>
            {answers.options.map((word, idx) => (
              <span 
                key={idx} 
                className={`${styles.word} ${word === question.correct_answer ? styles.correctWord : ''}`}
              >
                {word}
                {word === question.correct_answer && ' (Correct)'}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderListeningQuestion = (question: Question) => {
    const answers = question.possible_answers as ListeningSelectionAnswers;
    
    return (
      <div className={styles.questionContent}>
        <div className={styles.audioSection}>
          <h5>Audio</h5>
          <audio controls className={styles.audioPlayer}>
            <source src={answers.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
        <div className={styles.imagesGrid}>
          {answers.images.map((imageUrl, idx) => (
            <div 
              key={idx} 
              className={`${styles.imageContainer} ${idx.toString() === question.correct_answer ? styles.correctImage : ''}`}
            >
              <img src={imageUrl} alt={`Option ${idx + 1}`} className={styles.questionImage} />
              {idx.toString() === question.correct_answer && (
                <div className={styles.correctOverlay}>Correct Answer</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestionDetails = (question: Question, index: number) => {
    const isExpanded = expandedQuestion?.index === index && expandedQuestion.isExpanded;
    
    return (
      <div 
        key={index} 
        className={`${styles.questionCard} ${isExpanded ? styles.questionCardExpanded : ''}`}
      >
        <div className={styles.questionHeader}>
          <div className={styles.questionHeaderLeft} onClick={() => toggleQuestionExpand(index)}>
            <h4>Question {index + 1}</h4>
            <span className={styles.questionType}>
              {QuestionTypeLabels[question.question_type]}
            </span>
          </div>
          {isEditing && (
            <div className={styles.questionActions}>
              <button
                className={styles.editButton}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/edit-question/${id}/${index}`);
                }}
              >
                Edit
              </button>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteQuestion(index);
                }}
                disabled={isDeletingQuestion === index}
              >
                {isDeletingQuestion === index ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className={styles.questionDetails}>
            {question.question_type === 'picture_vocabulary' && renderPictureVocabularyQuestion(question)}
            {question.question_type === 'sequence_order' && renderSequenceOrderQuestion(question)}
            {question.question_type === 'fill_in_the_blank' && renderFillInBlankQuestion(question)}
            {question.question_type === 'listening_selection' && renderListeningQuestion(question)}
          </div>
        )}
      </div>
    );
  };

  const handleAddQuestionClick = () => {
    navigate(`/create-question/${id}`);
  };

  if (loading) {
    return (
      <DashboardTemplate 
        title="Test Details"
        onLogout={() => navigate('/login')}
      >
        <div className={styles.dashboardContent}>
          <p>Loading test details...</p>
        </div>
      </DashboardTemplate>
    );
  }

  if (error || !test) {
    return (
      <DashboardTemplate 
        title="Test Details"
        onLogout={() => navigate('/login')}
      >
        <div className={styles.dashboardContent}>
          <p className={styles.error}>{error || 'Test not found'}</p>
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
      onLogout={() => navigate('/login')}
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
                        onClick={() => handleEditQuestion(question.question_id)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteQuestion(question.question_id)}
                      >
                        Delete
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