import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Assessment, Submission } from '../types';
import {
  studentListAssessments,
  instructorListAssessments,
  instructorListSubmissions
} from '../api';

const DashboardPage = () => {
  const { user, role } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (role === 'student') {
          const assessmentData = await studentListAssessments();
          setAssessments(assessmentData);
        } 
        else if (role === 'instructor') {
          const assessmentData = await instructorListAssessments();
          setAssessments(assessmentData);
          
          // Get recent submissions for the first few assessments
          if (assessmentData.length > 0) {
            const recentSubmissionsPromises = assessmentData
              .slice(0, 3)
              .map(assessment => instructorListSubmissions(assessment.id));
              
            const submissionsResults = await Promise.all(recentSubmissionsPromises);
            
            setSubmissions(
              submissionsResults.flat().sort((a, b) => 
                new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
              ).slice(0, 5)
            );
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <h1>Welcome, {user?.username}!</h1>
      
      {role === 'student' && (
        <div className="dashboard-section">
          <h2>Your Assessments</h2>
          {assessments.length === 0 ? (
            <p>No assessments are available for you at the moment.</p>
          ) : (
            <div className="assessment-list">
              {assessments.map(assessment => (
                <div key={assessment.id} className="assessment-card">
                  <h3>{assessment.title}</h3>
                  <p>{assessment.description}</p>
                  <div className="assessment-meta">
                    <span>Level: {assessment.level}</span>
                    <span>Theme: {assessment.theme}</span>
                    <span>Due: {new Date(assessment.close_at).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/assessments/${assessment.id}`} className="button">
                    View Assessment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {role === 'instructor' && (
        <>
          <div className="dashboard-section">
            <h2>Your Assessments</h2>
            <div className="section-header">
              <Link to="/assessments/create" className="button">Create New Assessment</Link>
            </div>
            
            {assessments.length === 0 ? (
              <p>You haven't created any assessments yet.</p>
            ) : (
              <div className="assessment-list">
                {assessments.map(assessment => (
                  <div key={assessment.id} className="assessment-card">
                    <h3>{assessment.title}</h3>
                    <p>{assessment.description}</p>
                    <div className="assessment-meta">
                      <span>Level: {assessment.level}</span>
                      <span>Theme: {assessment.theme}</span>
                      <span>Due: {new Date(assessment.close_at).toLocaleDateString()}</span>
                    </div>
                    <Link to={`/assessments/${assessment.id}`} className="button">
                      Manage Assessment
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="dashboard-section">
            <h2>Recent Submissions</h2>
            {submissions.length === 0 ? (
              <p>No recent submissions to display.</p>
            ) : (
              <div className="submissions-list">
                {submissions.map(submission => (
                  <div key={submission.id} className="submission-item">
                    <div className="submission-details">
                      <span>Student: {submission.student?.username || submission.student_id}</span>
                      <span>Assessment: {assessments.find(a => a.id === submission.assessment_id)?.title || 'Unknown'}</span>
                      <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                      <span className={`submission-score ${submission.score ? '' : 'pending'}`}>
                        {submission.score ? `Score: ${submission.score}` : 'Pending Review'}
                      </span>
                    </div>
                    <Link to={`/submissions/${submission.id}`} className="button">
                      Review Submission
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {role === 'admin' && (
        <div className="dashboard-admin">
          <h2>Admin Dashboard</h2>
          <div className="admin-links">
            <Link to="/admin/users" className="admin-card">
              <h3>Manage Users</h3>
              <p>Create, update, or delete user accounts</p>
            </Link>
            <Link to="/admin/assessments" className="admin-card">
              <h3>All Assessments</h3>
              <p>View and manage all assessments in the system</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 