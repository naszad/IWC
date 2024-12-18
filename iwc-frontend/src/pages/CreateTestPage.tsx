import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionType, StudentLevel } from '../types/user';
import { Question, TestCreate } from '../types/test';
import styles from '../styles/CreateTest.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import PictureVocabularyForm from '../components/questions/PictureVocabularyForm';
import SequenceOrderForm from '../components/questions/SequenceOrderForm';
import FillInTheBlankForm from '../components/questions/FillInTheBlankForm';
import ListeningSelectionForm from '../components/questions/ListeningSelectionForm';
import { createTest } from '../api/index';

interface TestFormData extends TestCreate {}

const INITIAL_FORM_DATA: TestFormData = {
  theme: '',
  level: 'A',
  questions: []
};

const QUESTION_TYPES = [
  { 
    type: 'picture_vocabulary' as QuestionType,
    label: 'Picture Vocabulary',
    icon: '🖼️',
    description: 'Students match pictures with correct vocabulary words'
  },
  {
    type: 'sequence_order' as QuestionType,
    label: 'Sequence Order',
    icon: '📝',
    description: 'Students arrange items in the correct sequence'
  },
  {
    type: 'fill_in_the_blank' as QuestionType,
    label: 'Fill in the Blank',
    icon: '📝',
    description: 'Students complete sentences by filling in missing words'
  },
  {
    type: 'listening_selection' as QuestionType,
    label: 'Listening Selection',
    icon: '🎧',
    description: 'Students listen to audio and select the correct answer'
  }
];

const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TestFormData>(INITIAL_FORM_DATA);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.theme.trim()) {
      setStep(2);
    }
  };

  const handleQuestionTypeSelect = (type: QuestionType) => {
    setCurrentQuestion(type);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/tests');
    } else {
      setStep(step - 1);
      setCurrentQuestion('');
    }
  };

  const handleQuestionSubmit = (questionData: Omit<Question, 'question_id'>) => {
    const newQuestions = [...formData.questions];
    const newQuestion = {
      ...questionData,
      question_id: formData.questions.length + 1,
    };
    newQuestions.push(newQuestion);
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
    setStep(2);
    setCurrentQuestion('');
  };

  const handleTestSubmit = async () => {
    if (formData.questions.length === 0) {
      setError('Please add at least one question to the test');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTest(formData);
      navigate('/tests');
    } catch (err) {
      setError('Failed to create test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <form onSubmit={handleBasicInfoSubmit} className={styles.form}>
      <h2>Basic Test Information</h2>
      <div className={styles.formGroup}>
        <label htmlFor="theme">Test Theme</label>
        <input
          type="text"
          id="theme"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          placeholder="Enter test theme"
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="level">Student Level</label>
        <select
          id="level"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value as StudentLevel })}
        >
          <option value="A">Level A</option>
          <option value="B">Level B</option>
          <option value="C">Level C</option>
          <option value="D">Level D</option>
        </select>
      </div>
      <div className={styles.buttonGroup}>
        <button type="button" onClick={handleBack} className={styles.secondaryButton}>
          <span>←</span> Back to Tests
        </button>
        <button type="submit" className={styles.primaryButton}>
          Next: Add Questions <span>→</span>
        </button>
      </div>
    </form>
  );

  const renderQuestionTypeSelection = () => (
    <div className={styles.questionTypeSelection}>
      <h2>Add Questions</h2>
      <div className={styles.questionSummary}>
        <p>Current questions: {formData.questions.length}</p>
        {formData.questions.length > 0 && (
          <button
            onClick={handleTestSubmit}
            className={styles.primaryButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Test...' : 'Finish & Create Test'}
          </button>
        )}
      </div>

      {formData.questions.length > 0 && (
        <div className={styles.questionPreview}>
          <div className={styles.questionPreviewHeader}>
            <h3 className={styles.questionPreviewTitle}>Questions Added</h3>
          </div>
          {formData.questions.map((question, index) => (
            <div key={question.question_id} className={styles.questionPreviewItem}>
              <span className={styles.questionNumber}>#{index + 1}</span>
              <span className={styles.questionType}>
                {QUESTION_TYPES.find(t => t.type === question.question_type)?.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.questionTypes}>
        {QUESTION_TYPES.map((type) => (
          <button
            key={type.type}
            onClick={() => handleQuestionTypeSelect(type.type)}
            className={styles.questionTypeButton}
            disabled={isSubmitting}
          >
            <span className={styles.questionTypeIcon}>{type.icon}</span>
            <span className={styles.questionTypeLabel}>{type.label}</span>
            <span className={styles.questionTypeDescription}>{type.description}</span>
          </button>
        ))}
      </div>
      <div className={styles.buttonGroup}>
        <button 
          onClick={handleBack} 
          className={styles.secondaryButton}
          disabled={isSubmitting}
        >
          <span>←</span> Back to Basic Info
        </button>
      </div>
    </div>
  );

  const renderQuestionForm = () => {
    const commonProps = {
      onSubmit: handleQuestionSubmit,
      onBack: () => setStep(2)
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
      title="Create New Test"
      onLogout={() => navigate('/login')}
    >
      <div className={styles.createTestContainer}>
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
            Basic Info
          </div>
          <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
            Add Questions
          </div>
          <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
            Question Details
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {step === 1 && renderBasicInfo()}
        {step === 2 && renderQuestionTypeSelection()}
        {step === 3 && renderQuestionForm()}
      </div>
    </DashboardTemplate>
  );
};

export default CreateTestPage; 