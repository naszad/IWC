import React from 'react';
import styles from '../../styles/Dashboard.module.css';

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
  return (
    <div className={`${styles.dashboard} ${styles[role]}`}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <button onClick={onLogout} className={styles.logoutButton}>
          Logout ({role})
        </button>
      </header>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};

export default DashboardTemplate;