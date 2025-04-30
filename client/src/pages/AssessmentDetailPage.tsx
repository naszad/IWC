import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Assessment, Question } from '../types';
import {
  studentGetAssessmentDetails,
  instructorGetAssessment,
  studentSubmitAssessment
} from '../api';

interface StudentAnswers {
  [questionId: string]: string | string[];
}

const AssessmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);

  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        if (role === 'student') {
          const data = await studentGetAssessmentDetails(id);
          setAssessment(data);
          setQuestions(data.questions || []);
        } else if (role === 'instructor' || role === 'admin') {
          const data = await instructorGetAssessment(id);
          setAssessment(data);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentDetails();
  }, [id, role]);

  // Timer functionality for student assessment
  useEffect(() => {
    if (!assessmentStarted || role !== 'student' || !assessment?.duration_minutes) return;
    
    // Initialize timer
    setTimeRemaining(assessment.duration_minutes * 60);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          // Auto-submit when time is up
          if (!submitted) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [assessmentStarted, assessment, role, submitted]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!id || !user) return;
    
    try {
      setSubmitting(true);
      await studentSubmitAssessment(id, answers);
      setSubmitted(true);
      // Redirect to results page after submission
      navigate(`/submissions/results/${id}`);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const startAssessment = () => {
    setAssessmentStarted(true);
  };

  if (loading) {
    return <div className="loading">Loading assessment...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!assessment) {
    return <div className="error-message">Assessment not found</div>;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const isAssessmentOpen = new Date(assessment.open_at) <= new Date() && new Date(assessment.close_at) >= new Date();

  return (
    <div className="assessment-detail-page">
      <h1>{assessment.title}</h1>
      {assessment.description && <p className="assessment-description">{assessment.description}</p>}
      
      <div className="assessment-meta">
        <div className="meta-item">
          <span className="meta-label">Level:</span>
          <span className="meta-value">{assessment.level}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Theme:</span>
          <span className="meta-value">{assessment.theme}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Duration:</span>
          <span className="meta-value">{assessment.duration_minutes} minutes</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Available:</span>
          <span className="meta-value">
            {new Date(assessment.open_at).toLocaleDateString()} - {new Date(assessment.close_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {role === 'student' && (
        <>
          {!isAssessmentOpen ? (
            <div className="assessment-closed">
              {new Date(assessment.open_at) > new Date() ? (
                <p>This assessment is not yet open. It will be available on {new Date(assessment.open_at).toLocaleString()}.</p>
              ) : (
                <p>This assessment is closed. It was available until {new Date(assessment.close_at).toLocaleString()}.</p>
              )}
            </div>
          ) : (
            <div className="student-assessment">
              {!assessmentStarted ? (
                <div className="assessment-start">
                  <p>This assessment will take {assessment.duration_minutes} minutes to complete. Once started, you must complete it in one session.</p>
                  <button 
                    className="button start-button"
                    onClick={startAssessment}
                  >
                    Start Assessment
                  </button>
                </div>
              ) : (
                <>
                  {timeRemaining !== null && (
                    <div className="timer">
                      Time Remaining: {formatTime(timeRemaining)}
                    </div>
                  )}
                  
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {questions.map(question => (
                      <div key={question.id} className="question-container">
                        <h3 className="question-prompt">{question.prompt}</h3>
                        
                        {question.type === 'multiple_choice' && (
                          <div className="question-options">
                            {Array.isArray(question.options) && question.options.map((option: string, index: number) => (
                              <div key={index} className="option">
                                <input
                                  type="radio"
                                  id={`q-${question.id}-opt-${index}`}
                                  name={`question-${question.id}`}
                                  value={option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                  required
                                />
                                <label htmlFor={`q-${question.id}-opt-${index}`}>{option}</label>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.type === 'essay' && (
                          <textarea
                            className="essay-answer"
                            name={`question-${question.id}`}
                            rows={8}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            required
                          />
                        )}
                        
                        {question.type === 'short_answer' && (
                          <input
                            type="text"
                            className="short-answer"
                            name={`question-${question.id}`}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            required
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="submission-controls">
                      <button 
                        type="submit" 
                        className="button submit-button"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </>
      )}
      
      {role === 'instructor' && (
        <div className="instructor-view">
          <div className="question-list">
            <h2>Questions</h2>
            {questions.length === 0 ? (
              <p>No questions have been added to this assessment yet.</p>
            ) : (
              <div className="questions">
                {questions.map((question, index) => (
                  <div key={question.id} className="question-item">
                    <h3>Question {index + 1}: {question.prompt}</h3>
                    <div className="question-details">
                      <span>Type: {question.type}</span>
                      <span>Points: {question.points}</span>
                    </div>
                    
                    {question.type === 'multiple_choice' && (
                      <div className="question-options">
                        <h4>Options:</h4>
                        <ul>
                          {Array.isArray(question.options) && question.options.map((option, i) => (
                            <li key={i}>
                              {option} {question.correct_answer === option && <span className="correct">(Correct)</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="action-buttons">
              <button 
                className="button"
                onClick={() => navigate(`/assessments/${id}/edit`)}
              >
                Edit Assessment
              </button>
              <button 
                className="button"
                onClick={() => navigate(`/assessments/${id}/submissions`)}
              >
                View Submissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDetailPage; 