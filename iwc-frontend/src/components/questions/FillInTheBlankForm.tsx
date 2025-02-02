import React, { useState } from 'react';
import styles from '../../styles/QuestionForms.module.css';
import { Question, FillInTheBlankAnswers } from '../../types/test';

interface FillInTheBlankFormProps {
  onSubmit: (questionData: Omit<Question, 'question_id'>) => void;
  onBack: () => void;
  initialData?: Question;
  isEditing?: boolean;
}

const FillInTheBlankForm: React.FC<FillInTheBlankFormProps> = ({
  onSubmit,
  onBack,
  initialData,
  isEditing = false,
}) => {
  const defaultValue = (
    isEditing && initialData
      ? (initialData.possible_answers as FillInTheBlankAnswers).context || ''
      : ''
  );
  const [context, setContext] = useState<string>(defaultValue);
  const [sentence, setSentence] = useState<string>(
    isEditing && initialData
      ? (initialData.possible_answers as FillInTheBlankAnswers).sentence
      : ''
  );
  const [options, setOptions] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as FillInTheBlankAnswers).choices
      : ['', '', '', '']
  );
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(
    isEditing && initialData
      ? options.indexOf(initialData.correct_answer)
      : -1
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sentence.trim()) {
      alert('Please provide the sentence with blank');
      return;
    }

    if (options.some(option => !option.trim())) {
      alert('Please provide all options');
      return;
    }

    if (selectedCorrectIndex === -1) {
      alert('Please select a correct answer');
      return;
    }

    onSubmit({
      question_type: 'fill_in_the_blank',
      possible_answers: {
        context,
        sentence,
        options,
        choices: options,
      },
      correct_answer: options[selectedCorrectIndex],
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{isEditing ? 'Edit Fill in the Blank Question' : 'Create Fill in the Blank Question'}</h3>

      <div className={styles.formContainer}>
        <div className={styles.formSection}>
          <h4>Question Text</h4>
          <div className={styles.formGroup}>
            <label>Context (Optional)</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Enter context for the question (optional)"
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Sentence with Blank</label>
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Enter sentence with ___ for blank (e.g., 'The cat ___ on the mat.')"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h4>Answer Options</h4>
          <div className={styles.gridContainer}>
            {options.map((option, index) => (
              <div key={index} className={styles.imageInputGroup}>
                <label>Option {index + 1}</label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Enter option ${index + 1}`}
                  className={styles.input}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h4>Correct Answer</h4>
          <select
            value={selectedCorrectIndex}
            onChange={(e) => setSelectedCorrectIndex(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value="-1">Select correct option</option>
            {options.map((option, index) => (
              option && <option key={index} value={index}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" onClick={onBack} className={styles.secondaryButton}>
          Back
        </button>
        <button type="submit" className={styles.primaryButton}>
          {isEditing ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  );
};

export default FillInTheBlankForm; 