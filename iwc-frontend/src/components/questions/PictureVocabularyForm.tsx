import React, { useState } from 'react';
import styles from '../../styles/QuestionForms.module.css';
import { Question, PictureVocabularyAnswers } from '../../types/test';

interface PictureVocabularyFormProps {
  onSubmit: (questionData: Omit<Question, 'question_id'>) => void;
  onBack: () => void;
  initialData?: Question;
  isEditing?: boolean;
}

const PictureVocabularyForm: React.FC<PictureVocabularyFormProps> = ({
  onSubmit,
  onBack,
  initialData,
  isEditing = false,
}) => {
  const [images, setImages] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as PictureVocabularyAnswers).images
      : ['', '', '', '']
  );
  const [words, setWords] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as PictureVocabularyAnswers).words
      : ['', '', '', '']
  );
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(
    isEditing && initialData
      ? words.indexOf(initialData.correct_answer)
      : -1
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
    
    // Reset error state when URL changes
    const newImageErrors = [...imageErrors];
    newImageErrors[index] = false;
    setImageErrors(newImageErrors);
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCorrectIndex === -1) {
      alert('Please select a correct answer');
      return;
    }

    if (images.some(img => !img.trim())) {
      alert('Please provide all image URLs');
      return;
    }

    if (imageErrors.some(error => error)) {
      alert('One or more image URLs are invalid. Please check the images.');
      return;
    }

    if (words.some(word => !word.trim())) {
      alert('Please provide all words');
      return;
    }

    onSubmit({
      question_type: 'picture_vocabulary',
      possible_answers: {
        media_url: images[0] || '',
        options: words,
        images,
        words,
      },
      correct_answer: words[selectedCorrectIndex],
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{isEditing ? 'Edit Picture Vocabulary Question' : 'Picture Vocabulary Question'}</h3>
      
      <div className={styles.gridContainer}>
        {images.map((image, index) => (
          <div key={index} className={styles.imageInputGroup}>
            <label>Image URL {index + 1}</label>
            <input
              type="text"
              value={image}
              onChange={(e) => handleImageChange(index, e.target.value)}
              placeholder={`Enter image URL ${index + 1}`}
              className={imageErrors[index] ? styles.inputError : ''}
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

        {words.map((word, index) => (
          <div key={index} className={styles.wordInputGroup}>
            <label>Word {index + 1}</label>
            <input
              type="text"
              value={word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              placeholder={`Enter word ${index + 1}`}
            />
          </div>
        ))}

        <div className={styles.selectGroup}>
          <label>Correct Answer</label>
          <select
            value={selectedCorrectIndex}
            onChange={(e) => setSelectedCorrectIndex(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value="-1">Select correct word</option>
            {words.map((word, index) => (
              word && <option key={index} value={index}>{word}</option>
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

export default PictureVocabularyForm; 