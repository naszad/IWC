import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuestionType } from '../types/test';
import { addQuestion } from '../api/index';
import styles from '../styles/CreateTest.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import PictureVocabularyForm from '../components/questions/PictureVocabularyForm';
import SequenceOrderForm from '../components/questions/SequenceOrderForm';
import FillInTheBlankForm from '../components/questions/FillInTheBlankForm';
import ListeningSelectionForm from '../components/questions/ListeningSelectionForm';

const CreateQuestion: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuestionTypeSelect = (type: QuestionType) => {
    setCurrentQuestion(type);
  };

  const handleQuestionSubmit = async (questionData: any) => {
    if (!testId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addQuestion(parseInt(testId), questionData);
      navigate(`/test/${testId}`);
    } catch (err) {
      setError('Failed to add question. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderQuestionTypeSelection = () => (
    <div className={styles.questionTypeSelection}>
      <h2>Select Question Type</h2>
      <div className={styles.questionTypes}>
        <button
          onClick={() => handleQuestionTypeSelect('picture_vocabulary')}
          className={styles.questionTypeButton}
          disabled={isSubmitting}
        >
          Picture Vocabulary
        </button>
        <button
          onClick={() => handleQuestionTypeSelect('sequence_order')}
          className={styles.questionTypeButton}
          disabled={isSubmitting}
        >
          Sequence Order
        </button>
        <button
          onClick={() => handleQuestionTypeSelect('fill_in_the_blank')}
          className={styles.questionTypeButton}
          disabled={isSubmitting}
        >
          Fill in the Blank
        </button>
        <button
          onClick={() => handleQuestionTypeSelect('listening_selection')}
          className={styles.questionTypeButton}
          disabled={isSubmitting}
        >
          Listening Selection
        </button>
      </div>
    </div>
  );

  const renderQuestionForm = () => {
    const commonProps = {
      onSubmit: handleQuestionSubmit,
      onBack: () => setCurrentQuestion('')
    };

    switch (currentQuestion) {
      case 'picture_vocabulary':
        return <PictureVocabularyForm {...commonProps} />;
      case 'sequence_order':
        return <SequenceOrderForm {...commonProps} />;
      case 'fill_in_the_blank':
        return <FillInTheBlankForm {...commonProps} />;
      case 'listening_selection':
        return <ListeningSelectionForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <DashboardTemplate
      title="Add New Question"
      onLogout={() => navigate('/login')}
    >
      <div className={styles.createTestContainer}>
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${!currentQuestion ? styles.active : ''}`}>
            Select Type
          </div>
          <div className={`${styles.progressStep} ${currentQuestion ? styles.active : ''}`}>
            Question Details
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.contentSection}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/test/${testId}`)}
          >
            Back to Test
          </button>

          {!currentQuestion ? renderQuestionTypeSelection() : renderQuestionForm()}
        </div>
      </div>
    </DashboardTemplate>
  );
};

export default CreateQuestion;