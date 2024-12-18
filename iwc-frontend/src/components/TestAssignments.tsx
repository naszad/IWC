import React, { useState, useEffect } from 'react';
import { getTeacherAssignments, assignTest, updateAssignmentStatus, deleteAssignment, getTeacherStudents } from '../api/index';
import { TestAssignment, StudentInfo, AssignmentStatus } from '../api/index';
import styles from '../styles/Dashboard.module.css';

interface AssignTestModalProps {
  onClose: () => void;
  onAssign: (studentIds: number[], dueDate?: string) => void;
  students: StudentInfo[];
}

const AssignTestModal: React.FC<AssignTestModalProps> = ({ onClose, onAssign, students }) => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedStudents, dueDate || undefined);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Assign Test to Students</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Select Students:</label>
            <div className={styles.studentCheckboxes}>
              {students.map((student) => (
                <label key={student.student_id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.student_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.student_id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.student_id));
                      }
                    }}
                  />
                  {student.full_name} (Level {student.level})
                </label>
              ))}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dueDate">Due Date (Optional):</label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.secondaryButton}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={selectedStudents.length === 0}
            >
              Assign Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TestAssignmentsProps {
  testId: number;
}

const TestAssignments: React.FC<TestAssignmentsProps> = ({ testId }) => {
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedAssignments, fetchedStudents] = await Promise.all([
          getTeacherAssignments(),
          getTeacherStudents()
        ]);
        setAssignments(fetchedAssignments.filter(a => a.test_id === testId));
        setStudents(fetchedStudents);
      } catch (err) {
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId]);

  const handleAssignTest = async (studentIds: number[], dueDate?: string) => {
    try {
      const newAssignments = await assignTest(testId, studentIds, dueDate);
      setAssignments([...assignments, ...newAssignments]);
      setShowAssignModal(false);
    } catch (err) {
      setError('Failed to assign test. Please try again.');
    }
  };

  const handleStatusUpdate = async (assignmentId: number, status: AssignmentStatus) => {
    try {
      const updatedAssignment = await updateAssignmentStatus(assignmentId, status);
      setAssignments(assignments.map(a => 
        a.assignment_id === assignmentId ? updatedAssignment : a
      ));
    } catch (err) {
      setError('Failed to update assignment status.');
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.assignment_id !== assignmentId));
    } catch (err) {
      setError('Failed to delete assignment.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <p className={styles.loading}>Loading assignments...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.assignmentsSection}>
      <div className={styles.sectionHeader}>
        <h3>Test Assignments</h3>
        <button
          className={styles.primaryButton}
          onClick={() => setShowAssignModal(true)}
        >
          Assign to Students
        </button>
      </div>

      {showAssignModal && (
        <AssignTestModal
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignTest}
          students={students}
        />
      )}

      <div className={styles.assignmentsList}>
        {assignments.length === 0 ? (
          <p>No assignments yet. Assign this test to students using the button above.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.assignment_id} className={styles.assignmentCard}>
              <div className={styles.assignmentHeader}>
                <h4>{assignment.student_name}</h4>
                <div className={styles.assignmentActions}>
                  <select
                    value={assignment.status}
                    onChange={(e) => handleStatusUpdate(assignment.assignment_id, e.target.value as AssignmentStatus)}
                    className={styles.statusSelect}
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.assignmentInfo}>
                <span>Assigned: {formatDate(assignment.assigned_at)}</span>
                {assignment.due_date && (
                  <span>Due: {formatDate(assignment.due_date)}</span>
                )}
                {assignment.attempt_date && (
                  <span>Completed: {formatDate(assignment.attempt_date)}</span>
                )}
                {assignment.score > 0 && (
                  <span>Score: {assignment.score}%</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestAssignments; 