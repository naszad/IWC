import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Layout = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title">
          <h1>Integrated Writing Companion</h1>
        </div>
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/assessments">Assessments</Link>
            </li>
            {role === 'admin' && (
              <li>
                <Link to="/admin/users">Manage Users</Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="user-menu">
          <span>Hello, {user?.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      
      <main className="app-content">
        <Outlet />
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Integrated Writing Companion</p>
      </footer>
    </div>
  );
};

export default Layout; 