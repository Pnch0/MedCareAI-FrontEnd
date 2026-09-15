import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  const isAuthenticated = token && token !== 'null' && token !== 'undefined';

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export const PublicRoute = () => {
  const token = localStorage.getItem('token');
  
  const isAuthenticated = token && token !== 'null' && token !== 'undefined';

  return !isAuthenticated ? <Outlet /> : <Navigate to="/main-page" replace />;
};