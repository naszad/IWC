import React, { useState } from 'react';
import styles from '../../styles/QuestionForms.module.css';
import { Question, SequenceOrderAnswers } from '../../types/test';

interface SequenceOrderFormProps {
  onSubmit: (questionData: Omit<Question, 'question_id'>) => void;
  onBack: () => void;
  initialData?: Question;
  isEditing?: boolean;
}

const SequenceOrderForm: React.FC<SequenceOrderFormProps> = ({
  onSubmit,
  onBack,
  initialData,
  isEditing = false,
}) => {
  const [images, setImages] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as SequenceOrderAnswers).images
      : ['', '', '', '']
  );
  const [descriptions, setDescriptions] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as SequenceOrderAnswers).descriptions
      : ['', '', '', '']
  );
  const [sequence, setSequence] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as SequenceOrderAnswers).sequence
      : ['0', '1', '2', '3']
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.some(img => !img.trim())) {
      alert('Please provide all image URLs');
      return;
    }

    if (descriptions.some(desc => !desc.trim())) {
      alert('Please provide all descriptions');
      return;
    }

    onSubmit({
      question_type: 'sequence_order',
      possible_answers: {
        images,
        descriptions,
        sequence,
      },
      correct_answer: sequence.join(','),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{isEditing ? 'Edit Sequence Order Question' : 'Sequence Order Question'}</h3>

      <div className={styles.gridContainer}>
        {images.map((image, index) => (
          <div key={index} className={styles.imageInputGroup}>
            <label>Image URL {index + 1}</label>
            <input
              type="text"
              value={image}
              onChange={(e) => {
                const newImages = [...images];
                newImages[index] = e.target.value;
                setImages(newImages);
              }}
              placeholder={`Enter image URL ${index + 1}`}
            />
            {image && (
              <div className={styles.imagePreview}>
                <img src={image} alt={`Preview ${index + 1}`} />
              </div>
            )}
          </div>
        ))}

        {descriptions.map((description, index) => (
          <div key={index} className={styles.descriptionInputGroup}>
            <label>Description {index + 1}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                const newDescriptions = [...descriptions];
                newDescriptions[index] = e.target.value;
                setDescriptions(newDescriptions);
              }}
              placeholder={`Enter description ${index + 1}`}
            />
          </div>
        ))}

        <div className={styles.sequenceGroup}>
          <label>Correct Sequence</label>
          <div className={styles.sequenceButtons}>
            {sequence.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const newSequence = [...sequence];
                  if (index > 0) {
                    [newSequence[index], newSequence[index - 1]] = [newSequence[index - 1], newSequence[index]];
                    setSequence(newSequence);
                  }
                }}
                disabled={index === 0}
                className={styles.sequenceButton}
              >
                {index + 1}
              </button>
            ))}
          </div>
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

export default SequenceOrderForm; 