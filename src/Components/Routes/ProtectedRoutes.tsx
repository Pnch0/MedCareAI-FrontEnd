import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = (token && token !== 'null' && token !== 'undefined') || userRole;

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export const PublicRoute = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  const isAuthenticated = (token && token !== 'null' && token !== 'undefined') || userRole;

  if (isAuthenticated) {

    if (userRole === 'medico') {
      return <Navigate to="/home-page-medico" replace />;
    } else {
      return <Navigate to="/main-page-paciente" replace />;
    }
  }

  return <Outlet />;
};