import React, { useState } from 'react';
import styles from '../../styles/QuestionForms.module.css';
import { Question, ListeningSelectionAnswers } from '../../types/test';

interface ListeningSelectionFormProps {
  onSubmit: (questionData: Omit<Question, 'question_id'>) => void;
  onBack: () => void;
  initialData?: Question;
  isEditing?: boolean;
}

const ListeningSelectionForm: React.FC<ListeningSelectionFormProps> = ({
  onSubmit,
  onBack,
  initialData,
  isEditing = false,
}) => {
  const [audioUrl, setAudioUrl] = useState<string>(
    isEditing && initialData
      ? (initialData.possible_answers as ListeningSelectionAnswers).audio_url
      : ''
  );
  const [images, setImages] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as ListeningSelectionAnswers).images
      : ['', '', '', '']
  );
  const [options, setOptions] = useState<string[]>(
    isEditing && initialData
      ? (initialData.possible_answers as ListeningSelectionAnswers).options
      : ['', '', '', '']
  );
  const [selectedCorrectIndex, setSelectedCorrectIndex] = useState<number>(
    isEditing && initialData
      ? parseInt(initialData.correct_answer)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioUrl.trim()) {
      alert('Please provide the audio URL');
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

    if (options.some(option => !option.trim())) {
      alert('Please provide all options');
      return;
    }

    if (selectedCorrectIndex === -1) {
      alert('Please select a correct answer');
      return;
    }

    onSubmit({
      question_type: 'listening_selection',
      possible_answers: {
        audio_url: audioUrl,
        images,
        options,
      },
      correct_answer: selectedCorrectIndex.toString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h3>{isEditing ? 'Edit Listening Selection Question' : 'Listening Selection Question'}</h3>

      <div className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label>Audio URL</label>
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="Enter audio URL"
            className={styles.input}
          />
          {audioUrl && (
            <div className={styles.audioPreview}>
              <audio controls>
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

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

        {options.map((option, index) => (
          <div key={index} className={styles.formGroup}>
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

        <div className={styles.formGroup}>
          <label>Correct Answer</label>
          <select
            value={selectedCorrectIndex}
            onChange={(e) => setSelectedCorrectIndex(parseInt(e.target.value))}
            className={styles.select}
          >
            <option value="-1">Select correct image</option>
            {images.map((_, index) => (
              <option key={index} value={index}>Image {index + 1}</option>
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

export default ListeningSelectionForm; 