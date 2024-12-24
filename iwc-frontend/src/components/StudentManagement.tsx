import React, { useEffect, useState } from 'react';
import { getTeacherStudents } from '../api/index';
import { StudentInfo } from '../api/index';
import styles from '../styles/Dashboard.module.css';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getTeacherStudents();
        setStudents(data);
      } catch (err) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) return <div>Loading students...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>Students</h2>
      <div className={styles.studentList}>
        {students.map(student => (
          <div key={student.student_id} className={styles.studentCard}>
            <h3>{student.full_name}</h3>
            <p>Level: {student.level}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentManagement; 