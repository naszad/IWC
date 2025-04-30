import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Assessment } from '../types';
import {
  studentListAssessments,
  instructorListAssessments
} from '../api';

const AssessmentListPage = () => {
  const { role } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        let data: Assessment[] = [];
        
        if (role === 'student') {
          data = await studentListAssessments();
        } else if (role === 'instructor') {
          data = await instructorListAssessments();
        } else if (role === 'admin') {
          // Admin should have a different way to view all assessments
          navigate('/admin/assessments');
          return;
        }
        
        // Sort by open date (newest first)
        data.sort((a, b) => new Date(b.open_at).getTime() - new Date(a.open_at).getTime());
        setAssessments(data);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [role, navigate]);

  if (loading) {
    return <div className="loading">Loading assessments...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assessments-page">
      <div className="page-header">
        <h1>Assessments</h1>
        {role === 'instructor' && (
          <Link to="/assessments/create" className="button create-button">
            Create New Assessment
          </Link>
        )}
      </div>
      
      {assessments.length === 0 ? (
        <div className="empty-state">
          <p>No assessments found.</p>
          {role === 'instructor' && (
            <p>
              Get started by <Link to="/assessments/create">creating your first assessment</Link>.
            </p>
          )}
        </div>
      ) : (
        <div className="assessment-grid">
          {assessments.map(assessment => {
            const isOpen = new Date(assessment.open_at) <= new Date() && new Date(assessment.close_at) >= new Date();
            const isPast = new Date(assessment.close_at) < new Date();
            const isFuture = new Date(assessment.open_at) > new Date();
            
            return (
              <div 
                key={assessment.id} 
                className={`assessment-card ${isOpen ? 'open' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
              >
                <div className="card-status">
                  {isOpen && <span className="status open">Open</span>}
                  {isPast && <span className="status past">Closed</span>}
                  {isFuture && <span className="status future">Upcoming</span>}
                </div>
                
                <h2>{assessment.title}</h2>
                {assessment.description && <p className="assessment-description">{assessment.description}</p>}
                
                <div className="assessment-details">
                  <div className="detail-item">
                    <span className="detail-label">Level:</span>
                    <span className="detail-value">{assessment.level}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Theme:</span>
                    <span className="detail-value">{assessment.theme}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{assessment.duration_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Available:</span>
                    <span className="detail-value">
                      {new Date(assessment.open_at).toLocaleDateString()} - {new Date(assessment.close_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Link 
                  to={`/assessments/${assessment.id}`} 
                  className="button view-button"
                >
                  {role === 'instructor' ? 'Manage Assessment' : 'View Assessment'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentListPage; 