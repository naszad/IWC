import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentLevel } from '../types/user';
import styles from '../styles/Auth.module.css';

const StudentRegisterForm: React.FC = () => {
  const { registerStudent } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    language: '',
    level: 'A' as StudentLevel
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await registerStudent(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="full_name">Full Name</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="language">Language</label>
        <input
          type="text"
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="level">Level</label>
        <select
          id="level"
          name="level"
          value={formData.level}
          onChange={handleChange}
          required
          className={styles.select}
        >
          <option value="A">Level A</option>
          <option value="B">Level B</option>
          <option value="C">Level C</option>
          <option value="D">Level D</option>
        </select>
      </div>

      <button type="submit" className={styles.button}>
        Register
      </button>
    </form>
  );
};

export default StudentRegisterForm; 