import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTestToTake, 
  submitTest, 
  TestToTake, 
  TestSubmission, 
  TestQuestion,
  PictureVocabularyAnswers,
  SequenceOrderAnswers,
  FillInTheBlankAnswers,
  ListeningSelectionAnswers
} from '../api/index';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useAuth } from '../context/AuthContext';

type QuestionType = 'picture_vocabulary' | 'sequence_order' | 'fill_in_the_blank' | 'listening_selection';

interface BaseAnswerValidation {
  isValid: boolean;
  error?: string;
}

const TakeTest: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState<TestToTake | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  // Debug function to validate question data
  const validateQuestionData = (question: TestQuestion): BaseAnswerValidation => {
    const questionType = question.question_type;
    const validTypes: QuestionType[] = ['picture_vocabulary', 'sequence_order', 'fill_in_the_blank', 'listening_selection'];
    
    if (!validTypes.includes(questionType)) {
      return { isValid: false, error: `Invalid question type: ${question.question_type}` };
    }

    if (!question.possible_answers) {
      return { isValid: false, error: 'Missing possible_answers' };
    }

    try {
      switch (questionType) {
        case 'picture_vocabulary': {
          const answers = question.possible_answers as PictureVocabularyAnswers;
          const hasMediaUrl = Boolean(answers.media_url);
          const hasOptions = Array.isArray(answers.options) && answers.options.length > 0;

          if (!hasMediaUrl) {
            return { isValid: false, error: 'Picture vocabulary question missing media_url' };
          }
          if (!hasOptions) {
            return { isValid: false, error: 'Picture vocabulary question missing options' };
          }
          return { isValid: true };
        }

        case 'sequence_order': {
          const answers = question.possible_answers as SequenceOrderAnswers;
          const hasSequence = Array.isArray(answers.sequence) && answers.sequence.length > 0;

          if (!hasSequence) {
            return { isValid: false, error: 'Sequence order question missing sequence array' };
          }
          return { isValid: true };
        }

        case 'fill_in_the_blank': {
          const answers = question.possible_answers as FillInTheBlankAnswers;
          const hasChoices = Array.isArray(answers.choices) && answers.choices.length > 0;
          const hasSentence = typeof answers.sentence === 'string';

          if (!hasChoices) {
            return { isValid: false, error: 'Fill in the blank question missing choices' };
          }
          if (!hasSentence) {
            return { isValid: false, error: 'Fill in the blank question missing sentence' };
          }
          return { isValid: true };
        }

        case 'listening_selection': {
          const answers = question.possible_answers as ListeningSelectionAnswers;
          const hasAudioUrl = Boolean(answers.audio_url);
          const hasOptions = Array.isArray(answers.options) && answers.options.length > 0;

          if (!hasAudioUrl) {
            return { isValid: false, error: 'Listening selection question missing audio_url' };
          }
          if (!hasOptions) {
            return { isValid: false, error: 'Listening selection question missing options' };
          }
          return { isValid: true };
        }

        default:
          return { isValid: false, error: `Unsupported question type: ${questionType}` };
      }
    } catch (err) {
      console.error('Error validating question:', err);
      return { 
        isValid: false, 
        error: err instanceof Error ? err.message : 'Unknown error validating question'
      };
    }
  };

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setError('Test ID is missing');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Please log in to take the test');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Attempting to fetch test:', testId);
        const testData = await getTestToTake(parseInt(testId));
        console.log('Received test data:', testData);
        
        // Validate test data
        if (!testData.questions?.length) {
          console.error('Test has no questions:', testData);
          setError('This test has no questions');
          return;
        }

        // Validate each question
        const invalidQuestions = testData.questions
          .map(q => ({ question: q, validation: validateQuestionData(q) }))
          .filter(({ validation }) => !validation.isValid);

        if (invalidQuestions.length > 0) {
          console.error('Invalid questions found:', {
            invalidQuestions,
            testData
          });
          setError(invalidQuestions[0].validation.error || 'Some questions in this test are invalid');
          return;
        }

        setTest(testData);
      } catch (err) {
        console.error('Error loading test:', {
          error: err,
          testId,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          errorObject: err
        });
        if (err instanceof Error && err.message.includes('404')) {
          setError('Test not found or not assigned. Please check with your teacher.');
        } else {
          setError('Failed to load test. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchTest();
  }, [testId, user]);

  const handleAnswer = (questionId: number, answerIndex: number) => {
    if (submitting) return;
    
    console.log('Saving answer:', { questionId, answerIndex });
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    if (!test || !testId || !user) {
      console.error('Missing required data for submission:', { test: !!test, testId, user: !!user });
      setError('Missing required data for submission. Please try again.');
      return;
    }

    if (Object.keys(answers).length !== test.questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    // Confirm submission
    if (!window.confirm('Are you sure you want to submit your test? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate answer format
      const formattedAnswers = Object.entries(answers).reduce((acc, [questionId, answer]) => {
        const parsedAnswer = parseInt(answer.toString());
        if (isNaN(parsedAnswer)) {
          throw new Error(`Invalid answer format for question ${questionId}`);
        }
        return {
          ...acc,
          [questionId]: parsedAnswer
        };
      }, {});

      console.log('Submitting answers:', {
        raw: answers,
        formatted: formattedAnswers
      });

      const submission: TestSubmission = {
        assignment_id: test.assignment_id,
        answers: formattedAnswers,
        time_taken: Math.floor((Date.now() - startTime) / 1000) // Convert to seconds
      };

      const result = await submitTest(parseInt(testId), submission);
      console.log('Submission result:', result);
      
      // Show success message before redirecting
      alert(`Test submitted successfully! Your score: ${result.score}%`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      console.error('Error submitting test:', err);
      if (err instanceof Error && err.message.includes('Invalid answer format')) {
        setError(err.message);
      } else {
        setError('Failed to submit test. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: TestQuestion) => {
    const validation = validateQuestionData(question);
    
    if (!validation.isValid) {
      return (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {validation.error}
        </div>
      );
    }

    const questionType = question.question_type as QuestionType;
    const selectedAnswer = answers[question.question_id];

    try {
      switch (questionType) {
        case 'picture_vocabulary': {
          const answers = question.possible_answers as PictureVocabularyAnswers;
          return (
            <div className={styles.questionContent}>
              <div className={styles.mediaContainer}>
                <img 
                  src={answers.media_url} 
                  alt="Question" 
                  className={styles.questionImage}
                  onError={(e) => {
                    e.currentTarget.src = '/fallback-image.png';
                  }}
                />
              </div>
              <div className={styles.optionsGrid}>
                {answers.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(question.question_id, index)}
                    className={`${styles.optionButton} ${
                      selectedAnswer === index ? styles.selected : ''
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        case 'sequence_order': {
          const answers = question.possible_answers as SequenceOrderAnswers;
          return (
            <div className={styles.questionContent}>
              <div className={styles.sequenceContainer}>
                {answers.sequence.map((item: string, index: number) => (
                  <div key={index} className={styles.sequenceItem}>
                    <span className={styles.sequenceNumber}>{index + 1}</span>
                    <div className={styles.sequenceContent}>
                      <p>{item}</p>
                      {answers.media_urls?.[index] && (
                        <img 
                          src={answers.media_urls[index]} 
                          alt={`Sequence ${index + 1}`}
                          className={styles.sequenceImage}
                          onError={(e) => {
                            e.currentTarget.src = '/fallback-image.png';
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.optionsGrid}>
                {answers.sequence.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(question.question_id, index)}
                    className={`${styles.optionButton} ${
                      selectedAnswer === index ? styles.selected : ''
                    }`}
                  >
                    Position {index + 1}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        case 'fill_in_the_blank': {
          const answers = question.possible_answers as FillInTheBlankAnswers;
          return (
            <div className={styles.questionContent}>
              {answers.context && (
                <div className={styles.context}>
                  <p>{answers.context}</p>
                </div>
              )}
              <div className={styles.sentence}>
                <p>{answers.sentence}</p>
              </div>
              <div className={styles.optionsGrid}>
                {answers.choices.map((choice: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(question.question_id, index)}
                    className={`${styles.optionButton} ${
                      selectedAnswer === index ? styles.selected : ''
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        case 'listening_selection': {
          const answers = question.possible_answers as ListeningSelectionAnswers;
          return (
            <div className={styles.questionContent}>
              <div className={styles.audioContainer}>
                <audio 
                  controls 
                  src={answers.audio_url}
                  className={styles.audioPlayer}
                />
              </div>
              <div className={styles.optionsGrid}>
                {answers.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(question.question_id, index)}
                    className={`${styles.optionButton} ${
                      selectedAnswer === index ? styles.selected : ''
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        default:
          return (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              Unsupported question type: {questionType}
            </div>
          );
      }
    } catch (err) {
      console.error('Error rendering question:', err);
      return (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          Error rendering question
        </div>
      );
    }
  };

  if (loading) {
    return (
      <DashboardTemplate title="Take Test" onLogout={() => navigate('/login')} role="student">
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading test...</p>
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  if (error || !test) {
    return (
      <DashboardTemplate title="Take Test" onLogout={() => navigate('/login')} role="student">
        <div className={styles.container}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error || 'Test not found'}
          </div>
          <div className={styles.buttonGroup}>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate('/student/dashboard')}
            >
              Back to Dashboard
            </button>
            {error && (
              <button
                className={styles.primaryButton}
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </DashboardTemplate>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const hasAnsweredCurrent = currentQuestion && currentQuestion.question_id in answers;

  return (
    <DashboardTemplate title={`Take Test: ${test.theme}`} onLogout={() => navigate('/login')} role="student">
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerContent}>
              <h2>Question {currentQuestionIndex + 1} of {test.questions.length}</h2>
              <div className={styles.testInfo}>
                <span className={styles.badge}>Level {test.level}</span>
                <span className={styles.progressText}>
                  Progress: {Math.round((Object.keys(answers).length / test.questions.length) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(Object.keys(answers).length / test.questions.length) * 100}%` }}
            />
          </div>

          <div className={styles.questionContainer}>
            {currentQuestion && renderQuestion(currentQuestion)}
            {!hasAnsweredCurrent && (
              <div className={styles.hint}>
                Please select an answer to proceed
              </div>
            )}
          </div>

          <div className={styles.navigationContainer}>
            <div className={styles.navigationButtons}>
              {currentQuestionIndex > 0 && (
                <button
                  className={styles.secondaryButton}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  disabled={submitting}
                >
                  Previous Question
                </button>
              )}

              {!isLastQuestion ? (
                <button
                  className={styles.primaryButton}
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={submitting || !hasAnsweredCurrent}
                >
                  Next Question
                </button>
              ) : (
                <button
                  className={`${styles.primaryButton} ${styles.submitButton}`}
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length !== test.questions.length}
                >
                  {submitting ? (
                    <>
                      <div className={styles.spinner}></div>
                      Submitting Test...
                    </>
                  ) : (
                    'Submit Test'
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardTemplate>
  );
};

export default TakeTest;
