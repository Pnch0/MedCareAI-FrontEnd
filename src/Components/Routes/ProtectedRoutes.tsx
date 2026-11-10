import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, getHomePorRol } from './roles.ts';
import type { UserRole } from './roles.ts';

const haySesionActiva = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  return (token && token !== 'null' && token !== 'undefined') && userRole;
};

export const ProtectedRoute = () => {
  return haySesionActiva() ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
  const { pathname } = useLocation();

  if (haySesionActiva()) {
    const role = getUserRole();
    const esRutaAuth = pathname === '/login' || pathname === '/login-page' || pathname === '/register-page';

    if (esRutaAuth) {
      return <Navigate to={getHomePorRol(role)} replace />;
    }
  }

  return <Outlet />;
};

export const RoleRoute = ({ role }: { role: UserRole }) => {
  const userRole = getUserRole();

  if (userRole !== role) {
    return <Navigate to={getHomePorRol(userRole)} replace />;
  }

  return <Outlet />;
};
