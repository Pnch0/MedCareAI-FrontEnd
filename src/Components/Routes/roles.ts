export type UserRole = 'paciente' | 'medico' | 'recepcionista' | 'administrador';

export const HOME_POR_ROL: Record<UserRole, string> = {
    paciente: '/main-page-paciente',
    medico: '/home-page-medico',
    recepcionista: '/home-page-recepcionista',
    administrador: '/home-page-administrador',
};

const ROLES_VALIDOS: UserRole[] = ['paciente', 'medico', 'recepcionista', 'administrador'];

export const getUserRole = (): UserRole => {
    const role = localStorage.getItem('userRole') as UserRole | null;
    return role && ROLES_VALIDOS.includes(role) ? role : 'paciente';
};

export const getHomePorRol = (role: UserRole = getUserRole()): string => HOME_POR_ROL[role];
