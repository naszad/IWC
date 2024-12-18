// frontend/src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const PrivateRoute: React.FC = () => {
  const authContext = useContext(AuthContext);
  return authContext && authContext.isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
