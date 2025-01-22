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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelClass = (level: string) => {
    switch (level) {
      case 'A': return styles.levelA;
      case 'B': return styles.levelB;
      case 'C': return styles.levelC;
      case 'D': return styles.levelD;
      default: return '';
    }
  };

  const getPerformanceClass = (score: number) => {
    if (score >= 90) return styles.excellentPerformance;
    if (score >= 75) return styles.goodPerformance;
    if (score >= 60) return styles.averagePerformance;
    return styles.needsImprovement;
  };

  return (
    <DashboardTemplate
      title="Student Management"
      onLogout={() => navigate('/login')}
      role="teacher"
    >
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <h2>Students Overview</h2>
            <p className={styles.sectionSubtitle}>
              Manage and monitor student progress
            </p>
          </div>
        </div>

        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className={styles.levelFilter}
          >
            <option value="all">All Levels</option>
            <option value="A">Level A</option>
            <option value="B">Level B</option>
            <option value="C">Level C</option>
            <option value="D">Level D</option>
          </select>
        </div>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading students...</p>
          </div>
        )}
        
        {error && <div className={styles.error}>{error}</div>}
        
        {!loading && !error && (
          <>
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>👥</span>
                <h3>No students found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className={styles.studentsGrid}>
                {filteredStudents.map(student => (
                  <div key={student.student_id} className={styles.studentCard}>
                    <div className={styles.studentHeader}>
                      <h3>{student.full_name}</h3>
                      <span className={`${styles.levelBadge} ${getLevelClass(student.level)}`}>
                        Level {student.level}
                      </span>
                    </div>
                    
                    <div className={styles.studentStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Tests Taken</span>
                        <span className={styles.statValue}>{student.tests_taken}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Average Score</span>
                        <span className={`${styles.statValue} ${getPerformanceClass(student.average_score)}`}>
                          {student.average_score}%
                        </span>
                      </div>
                    </div>

                    <div className={styles.studentInfo}>
                      <span>
                        <span className={styles.infoIcon}>🌍</span>
                        Language: {student.language}
                      </span>
                      <span>
                        <span className={styles.infoIcon}>📅</span>
                        Joined: {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardTemplate>
  );
};

export default StudentsPage; 