import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Question } from '../types/test';
import { getTestById, updateQuestion } from '../api';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import PictureVocabularyForm from '../components/questions/PictureVocabularyForm';
import SequenceOrderForm from '../components/questions/SequenceOrderForm';
import FillInTheBlankForm from '../components/questions/FillInTheBlankForm';
import ListeningSelectionForm from '../components/questions/ListeningSelectionForm';

const EditQuestion: React.FC = () => {
  const { testId, questionIndex } = useParams<{ testId: string; questionIndex: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!testId || !questionIndex) return;
      
      try {
        const test = await getTestById(parseInt(testId));
        const questionData = test.questions?.[parseInt(questionIndex)];
        
        if (!questionData) {
          setError('Question not found');
          return;
        }
        
        setQuestion(questionData);
      } catch (err) {
        setError('Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [testId, questionIndex]);

  const handleQuestionSubmit = async (questionData: Omit<Question, 'question_id'>) => {
    if (!testId || !questionIndex || !question) return;

    try {
      const updatedQuestion = {
        ...questionData,
        question_id: question.question_id,
      };
      await updateQuestion(parseInt(testId), parseInt(questionIndex), updatedQuestion);
      navigate(`/test/${testId}`);
    } catch (err) {
      setError('Failed to update question. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(`/test/${testId}`);
  };

  if (loading) {
    return (
      <DashboardTemplate title="Edit Question" onLogout={() => navigate('/login')}>
        <div className={styles.container}>
          <p>Loading question...</p>
        </div>
      </DashboardTemplate>
    );
  }

  if (error || !question) {
    return (
      <DashboardTemplate title="Edit Question" onLogout={() => navigate('/login')}>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Question not found'}</div>
          <button
            className={styles.secondaryButton}
            onClick={handleBack}
          >
            Back to Test
          </button>
        </div>
      </DashboardTemplate>
    );
  }

  const commonProps = {
    onSubmit: handleQuestionSubmit,
    onBack: handleBack,
    initialData: question,
    isEditing: true,
  };

  return (
    <DashboardTemplate title="Edit Question" onLogout={() => navigate('/login')}>
      <div className={styles.container}>
        {question.question_type === 'picture_vocabulary' && (
          <PictureVocabularyForm {...commonProps} />
        )}
        {question.question_type === 'sequence_order' && (
          <SequenceOrderForm {...commonProps} />
        )}
        {question.question_type === 'fill_in_the_blank' && (
          <FillInTheBlankForm {...commonProps} />
        )}
        {question.question_type === 'listening_selection' && (
          <ListeningSelectionForm {...commonProps} />
        )}
      </div>
    </DashboardTemplate>
  );
};

export default EditQuestion; 