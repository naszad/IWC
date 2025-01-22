import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/Dashboard.module.css';
import cyberpunkStyles from '../../styles/Cyberpunk.module.css';
import logo from '../../../iwc-logo.svg';

export interface DashboardTemplateProps {
  children: React.ReactNode;
  title: string;
  onLogout: () => void | Promise<void>;
  role: 'teacher' | 'student';
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  title,
  onLogout,
  role
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const teacherNavItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tests', label: 'Tests', icon: '📝' },
    { path: '/students', label: 'Students', icon: '👥' },
    { path: '/create-test', label: 'Create Test', icon: '➕' }
  ];

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/assignments', label: 'Assignments', icon: '📚' }
  ];

  const navItems = role === 'teacher' ? teacherNavItems : studentNavItems;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={`${styles.sidebarHeader} ${cyberpunkStyles.neonBorder}`}>
          <img src={logo} alt="IWC Logo" className={styles.logo} />
        </div>
        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className={styles.mainContent}>
        <header className={`${styles.header} ${cyberpunkStyles.scanline}`}>
          <div className={styles.headerContent}>
            <h1 className={cyberpunkStyles.glowText}>{title}</h1>
            <div className={styles.headerActions}>
              <button 
                onClick={onLogout} 
                className={`${styles.logoutButton} ${cyberpunkStyles.neonButton}`}
              >
                <span className={styles.logoutIcon}>⏻</span>
                Logout ({role})
              </button>
            </div>
          </div>
        </header>

        <main className={`${styles.content} ${cyberpunkStyles.hologramOverlay}`}>
          <div className={styles.mainWrapper}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardTemplate;