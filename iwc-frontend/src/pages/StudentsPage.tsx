import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentInfo } from '../api/index';
import styles from '../styles/Dashboard.module.css';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { getTeacherStudents } from '../api/index';

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <DashboardTemplate
      title="Students"
      onLogout={() => navigate('/login')}
      role="teacher"
    >
      <div className={styles.container}>
        {loading && <div>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && (
          <div className={styles.studentList}>
            {students.map(student => (
              <div key={student.student_id} className={styles.studentCard}>
                <h3>{student.full_name}</h3>
                <p>Level: {student.level}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
};

export default StudentsPage; 