import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, getHomePorRol } from './roles.ts';
import type { UserRole } from './roles.ts';

const haySesionActiva = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  return (token && token !== 'null' && token !== 'undefined') || userRole;
};

export const ProtectedRoute = () => {
  return haySesionActiva() ? <Outlet /> : <Navigate to="/" replace />;
};

export const PublicRoute = () => {
  const { pathname } = useLocation();

  if (haySesionActiva()) {
    const destino = getHomePorRol();

    if (pathname !== destino) {
      return <Navigate to={destino} replace />;
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
