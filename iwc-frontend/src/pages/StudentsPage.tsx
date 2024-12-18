import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardTemplate from '../components/templates/DashboardTemplate';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';
import { StudentInfo, StudentProgress, getTeacherStudents, getStudentProgress } from '../api';

interface StudentDetailsModalProps {
  student: StudentInfo;
  progress: StudentProgress[];
  onClose: () => void;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, progress, onClose }) => {
  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Student Details</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.studentDetails}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{student.full_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Language</span>
              <span className={styles.detailValue}>{student.language}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Level</span>
              <span className={styles.detailValue}>{student.level}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Tests Taken</span>
              <span className={styles.detailValue}>{student.tests_taken}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Average Score</span>
              <span className={styles.detailValue}>{student.average_score}%</span>
            </div>
          </div>

          <div className={styles.progressSection}>
            <h4>Recent Progress</h4>
            {progress.length > 0 ? (
              <div className={styles.progressList}>
                {progress.map((item, index) => (
                  <div key={index} className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <h5>{item.test_name}</h5>
                      <span className={styles.progressDate}>
                        {new Date(item.attempt_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.progressStats}>
                      <span>Score: {item.score}%</span>
                      <span>Correct: {item.correct_answers}/{item.total_questions}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noProgress}>No test attempts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const fetchedStudents = await getTeacherStudents();
        setStudents(fetchedStudents);
      } catch (err) {
        setError('Failed to load students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleStudentClick = async (student: StudentInfo) => {
    try {
      const progress = await getStudentProgress(student.student_id);
      setStudentProgress(progress);
      setSelectedStudent(student);
    } catch (err) {
      setError('Failed to load student progress.');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || student.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

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
      <div className={styles.dashboardContent}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Your Students</h2>
              <p className={styles.sectionSubtitle}>Manage and track student progress</p>
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
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className={styles.levelFilter}
              >
                <option value="all">All Levels</option>
                <option value="A">Level A</option>
                <option value="B">Level B</option>
                <option value="C">Level C</option>
                <option value="D">Level D</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading students...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className={styles.studentsGrid}>
              {filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>👥</span>
                  <h3>No students found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className={styles.studentCard}
                    onClick={() => handleStudentClick(student)}
                  >
                    <div className={styles.studentHeader}>
                      <h3>{student.full_name}</h3>
                      <span className={`${styles.levelBadge} ${styles[`level${student.level}`]}`}>
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
                    <div className={styles.studentMeta}>
                      <span className={styles.language}>{student.language}</span>
                      <span className={styles.joinDate}>
                        Joined {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {selectedStudent && (
          <StudentDetailsModal
            student={selectedStudent}
            progress={studentProgress}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    </DashboardTemplate>
  );
};

export default StudentsPage; 