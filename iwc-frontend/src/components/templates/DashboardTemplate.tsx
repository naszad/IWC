import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/Dashboard.module.css';

interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

interface DashboardTemplateProps {
  title: string;
  onLogout: () => void;
  children: React.ReactNode;
  role: 'teacher' | 'student';  // Added role prop
}

// Define navigation items for both roles
const navigationItems = {
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: '📊' },
    { label: 'Tests', path: '/tests', icon: '📝' },
    { label: 'Students', path: '/students', icon: '👥' },
    { label: 'Reports', path: '/reports', icon: '📈' },
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: '📊' },
    { label: 'Assignments', path: '/assignments', icon: '📝' },
    { label: 'Progress', path: '/progress', icon: '📈' },
  ],
};

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  title,
  onLogout,
  children,
  role,  // Receive role prop
}) => {
  const location = useLocation();
  const navigation = navigationItems[role];  // Get navigation items based on role

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.gradientText}>
            {role === 'teacher' ? 'IWC Teacher' : 'IWC Student'}
          </h2>
        </div>
        <nav className={styles.navigation}>
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.navItemActive : ''
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>{title}</h1>
            </div>
            <div className={styles.headerRight}>
              <button onClick={onLogout} className={styles.logoutButton}>
                <span className={styles.logoutIcon}>👤</span>
                Logout
              </button>
            </div>
          </div>
        </header>
        
        <main className={styles.main}>
          <div className={styles.mainWrapper}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardTemplate;