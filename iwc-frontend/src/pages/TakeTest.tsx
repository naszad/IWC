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

  // Debug function to validate question data
  const validateQuestionData = (question: TestQuestion): BaseAnswerValidation => {
    const questionType = question.question_type as QuestionType;
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

          if (!hasChoices) {
            return { isValid: false, error: 'Fill in the blank question missing choices' };
          }
          return { isValid: true };
        }

        case 'listening_selection': {
          const answers = question.possible_answers as ListeningSelectionAnswers;
          if (!answers.audio_url) {
            return { isValid: false, error: 'Listening selection question missing audio_url' };
          }
          if (!Array.isArray(answers.options) || !answers.options.length) {
            return { isValid: false, error: 'Listening selection question missing options' };
          }
          return { isValid: true };
        }

        default:
          return { isValid: false, error: `Unsupported question type: ${questionType}` };
      }
    } catch (err) {
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
        return;
      }
      
      try {
        const testData = await getTestToTake(parseInt(testId));
        
        // Validate test data
        if (!testData.questions?.length) {
          setError('This test has no questions');
          return;
        }

        // Validate each question
        const invalidQuestions = testData.questions
          .map(q => ({ question: q, validation: validateQuestionData(q) }))
          .filter(({ validation }) => !validation.isValid);

        if (invalidQuestions.length > 0) {
          console.error('Invalid questions found:', invalidQuestions);
          setError(invalidQuestions[0].validation.error || 'Some questions in this test are invalid');
          return;
        }

        setTest(testData);
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  const handleAnswer = (questionId: number, answerIndex: number) => {
    console.log('Saving answer:', { questionId, answerIndex });
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    if (!test || !testId || !user) {
      console.error('Missing required data for submission:', { test: !!test, testId, user: !!user });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Submitting answers:', answers);
      const submission: TestSubmission = {
        assignment_id: test.assignment_id,
        answers: answers,
        time_taken: 0 // We're not tracking time for now
      };

      const result = await submitTest(parseInt(testId), submission);
      console.log('Submission result:', result);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: TestQuestion) => {
    const validation = validateQuestionData(question);
    
    if (!validation.isValid) {
      return <div className={styles.error}>{validation.error}</div>;
    }

    const questionType = question.question_type as QuestionType;
    const selectedAnswer = answers[question.question_id];

    try {
      switch (questionType) {
        case 'picture_vocabulary': {
          const answers = question.possible_answers as PictureVocabularyAnswers;
          return (
            <div className={styles.questionContainer}>
              <div className={styles.singleImageContainer}>
                <img 
                  src={answers.media_url} 
                  alt="Question" 
                  className={styles.questionImage}
                  onError={(e) => {
                    e.currentTarget.src = '/fallback-image.png';
                  }}
                />
                <div className={styles.optionsContainer}>
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
            </div>
          );
        }

        case 'sequence_order': {
          const answers = question.possible_answers as SequenceOrderAnswers;
          return (
            <div className={styles.questionContainer}>
              <div className={styles.sequenceOptions}>
                {answers.sequence.map((item: string, index: number) => (
                  <div key={index} className={styles.sequenceItem}>
                    <span className={styles.sequenceNumber}>{index + 1}</span>
                    {item}
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
                ))}
              </div>
              <div className={styles.options}>
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
            <div className={styles.questionContainer}>
              <div className={styles.fillInBlankContent}>
                {answers.context && (
                  <p className={styles.context}>{answers.context}</p>
                )}
                <div className={styles.optionsContainer}>
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
            </div>
          );
        }

        case 'listening_selection': {
          const answers = question.possible_answers as ListeningSelectionAnswers;
          return (
            <div className={styles.questionContainer}>
              <audio 
                controls 
                src={answers.audio_url}
                className={styles.audioPlayer}
              />
              <div className={styles.options}>
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
          return <div className={styles.error}>Unsupported question type: {questionType}</div>;
      }
    } catch (err) {
      console.error('Error rendering question:', err);
      return <div className={styles.error}>Error rendering question</div>;
    }
  };

  if (loading) {
    return (
      <DashboardTemplate title="Take Test" onLogout={() => navigate('/login')} role="student">
        <div className={styles.container}>
          <p>Loading test...</p>
        </div>
      </DashboardTemplate>
    );
  }

  if (error || !test) {
    return (
      <DashboardTemplate title="Take Test" onLogout={() => navigate('/login')} role="student">
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Test not found'}</div>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate('/student/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardTemplate>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

  return (
    <DashboardTemplate title={`${test.theme} - Question ${currentQuestionIndex + 1}`} onLogout={() => navigate('/login')} role="student">
      <div className={styles.container}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
          />
        </div>

        <div className={styles.testInfo}>
          <p>Level: {test.level}</p>
          <p>Question {currentQuestionIndex + 1} of {test.questions.length}</p>
        </div>

        {currentQuestion && renderQuestion(currentQuestion)}

        <div className={styles.navigationButtons}>
          {currentQuestionIndex > 0 && (
            <button
              className={styles.secondaryButton}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={submitting}
            >
              Previous
            </button>
          )}

          {!isLastQuestion ? (
            <button
              className={styles.primaryButton}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={submitting || !(currentQuestion.question_id in answers)}
            >
              Next
            </button>
          ) : (
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length !== test.questions.length}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </DashboardTemplate>
  );
};

export default TakeTest;
