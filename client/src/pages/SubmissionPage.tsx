import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Submission, SubmissionAnswer, Question } from '../types';
import { 
  studentGetAssessmentResults,
  instructorGradeSubmission
} from '../api';

const SubmissionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<SubmissionAnswer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [graded, setGraded] = useState(false);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        let data;
        if (role === 'student') {
          // For students, we're getting their own results
          data = await studentGetAssessmentResults(id);
        } else {
          // For instructors, this would be a different endpoint that gets a specific submission
          // For now, we'll assume a similar structure
          data = await studentGetAssessmentResults(id); // replace with instructor endpoint when available
        }
        
        setSubmission(data);
        setAnswers(data.answers || []);
        setQuestions(data.assessment?.questions || []);
        
        if (data.feedback) {
          setFeedback(data.feedback);
        }
        
        if (data.score !== undefined) {
          setScore(data.score);
          setGraded(true);
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError('Failed to load submission details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [id, role]);

  const handleGradeSubmit = async () => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      await instructorGradeSubmission(id, { score, feedback });
      setGraded(true);
      alert('Submission graded successfully');
    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  const findQuestion = (questionId: string) => {
    return questions.find(q => q.id === questionId);
  };

  if (loading) {
    return <div className="loading">Loading submission...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!submission) {
    return <div className="error-message">Submission not found</div>;
  }

  return (
    <div className="submission-page">
      <div className="submission-header">
        <h1>
          {role === 'student' 
            ? 'Your Assessment Results' 
            : `Submission by ${submission.student?.username || submission.student_id}`}
        </h1>
        
        <div className="submission-meta">
          <div className="meta-item">
            <span className="meta-label">Assessment:</span>
            <span className="meta-value">
              {submission.assessment?.title || 'Unknown Assessment'}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Submitted:</span>
            <span className="meta-value">
              {new Date(submission.submitted_at).toLocaleString()}
            </span>
          </div>
          {graded && (
            <div className="meta-item score">
              <span className="meta-label">Score:</span>
              <span className="meta-value">{submission.score}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="submission-content">
        <h2>Responses</h2>
        
        {answers.length === 0 ? (
          <p>No responses found for this submission.</p>
        ) : (
          <div className="answers-list">
            {answers.map((answer, index) => {
              const question = findQuestion(answer.question_id);
              
              return (
                <div key={answer.id} className="answer-item">
                  <div className="question">
                    <h3>Question {index + 1}:</h3>
                    <p>{question?.prompt || 'Unknown question'}</p>
                    
                    {question?.type === 'multiple_choice' && question.options && (
                      <div className="question-options">
                        <h4>Options:</h4>
                        <ul>
                          {Array.isArray(question.options) && question.options.map((option, i) => (
                            <li key={i} className={answer.answer === option ? 'selected' : ''}>
                              {option}
                              {answer.is_correct !== undefined && answer.answer === option && (
                                <span className={answer.is_correct ? 'correct' : 'incorrect'}>
                                  {answer.is_correct ? ' (Correct)' : ' (Incorrect)'}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="answer">
                    <h4>Response:</h4>
                    {question?.type === 'essay' ? (
                      <div className="essay-response">{answer.answer}</div>
                    ) : (
                      <p>{answer.answer}</p>
                    )}
                    
                    {answer.is_correct !== undefined && (
                      <div className={`answer-status ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                        {answer.is_correct ? 'Correct' : 'Incorrect'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Feedback section */}
        {graded && feedback && (
          <div className="feedback-section">
            <h2>Feedback</h2>
            <div className="feedback-content">
              {feedback}
            </div>
          </div>
        )}
        
        {/* Instructor grading form */}
        {role === 'instructor' && !graded && (
          <div className="grading-form">
            <h2>Grade Submission</h2>
            <div className="form-group">
              <label htmlFor="score">Score</label>
              <input
                type="number"
                id="score"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="feedback">Feedback</label>
              <textarea
                id="feedback"
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <button 
              className="button submit-grade"
              onClick={handleGradeSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        )}
        
        <div className="submission-footer">
          <Link 
            to={role === 'student' ? '/dashboard' : `/assessments/${submission.assessment_id}/submissions`}
            className="button back-button"
          >
            {role === 'student' ? 'Back to Dashboard' : 'Back to Submissions'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage; 