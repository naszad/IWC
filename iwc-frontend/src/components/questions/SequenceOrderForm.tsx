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
  const [sequence, setSequence] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as SequenceOrderAnswers).sequence
      : ['0', '1', '2', '3']
  );
  const [imageErrors, setImageErrors] = useState<boolean[]>([false, false, false, false]);

  const handleImageError = (index: number) => {
    const newImageErrors = [...imageErrors];
    newImageErrors[index] = true;
    setImageErrors(newImageErrors);
  };

  const handleImageLoad = (index: number) => {
    const newImageErrors = [...imageErrors];
    newImageErrors[index] = false;
    setImageErrors(newImageErrors);
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
    
    const newImageErrors = [...imageErrors];
    newImageErrors[index] = false;
    setImageErrors(newImageErrors);
  };

  const handleSequenceChange = (currentIndex: number, direction: 'up' | 'down') => {
    const newSequence = [...sequence];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newSequence[currentIndex], newSequence[swapIndex]] = [newSequence[swapIndex], newSequence[currentIndex]];
    setSequence(newSequence);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (images.some(img => !img.trim())) {
      alert('Please provide all image URLs');
      return;
    }

    if (imageErrors.some(error => error)) {
      alert('One or more image URLs are invalid. Please check the images.');
      return;
    }

    onSubmit({
      question_type: 'sequence_order',
      possible_answers: {
        images,
        sequence,
      },
      correct_answer: sequence.join(','),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{isEditing ? 'Edit Sequence Order Question' : 'Create Sequence Order Question'}</h3>

      <div className={styles.formContainer}>
        <div className={styles.formSection}>
          <h4>Images</h4>
          <div className={styles.gridContainer}>
            {images.map((image, index) => (
              <div key={index} className={styles.imageInputGroup}>
                <label>Image {index + 1}</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder={`Enter image URL ${index + 1}`}
                  className={`${styles.input} ${imageErrors[index] ? styles.inputError : ''}`}
                />
                {image && (
                  <div className={styles.imagePreview}>
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      onError={() => handleImageError(index)}
                      onLoad={() => handleImageLoad(index)}
                    />
                    {imageErrors[index] && (
                      <p className={styles.errorText}>Invalid image URL</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <h4>Sequence Order</h4>
          <p className={styles.helpText}>Arrange the images in the correct order using the up/down buttons</p>
          <div className={styles.sequenceContainer}>
            {sequence.map((_, index) => (
              <div key={index} className={styles.sequenceItem}>
                <span className={styles.sequenceNumber}>{index + 1}</span>
                <div className={styles.imagePreview}>
                  {images[parseInt(sequence[index])] && (
                    <img
                      src={images[parseInt(sequence[index])]}
                      alt={`Sequence ${index + 1}`}
                    />
                  )}
                </div>
                <div className={styles.sequenceControls}>
                  <button
                    type="button"
                    onClick={() => handleSequenceChange(index, 'up')}
                    disabled={index === 0}
                    className={styles.sequenceButton}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSequenceChange(index, 'down')}
                    disabled={index === sequence.length - 1}
                    className={styles.sequenceButton}
                  >
                    ↓
                  </button>
                </div>
              </div>
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