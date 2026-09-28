import { FaHome, FaCalendar, FaBook } from 'react-icons/fa';
import { FaClipboardList, FaUsers, FaBoxesStacked, FaClock } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import type { UserRole } from '../../Routes/roles.ts';

export type NavLinkConfig = {
    to: string;
    label: string;
    icon: IconType;
};

export const NAV_CONFIG: Record<UserRole, NavLinkConfig[]> = {
    medico: [
        { to: '/home-page-medico', label: 'Home', icon: FaHome },
        { to: '/agenda-page-medico', label: 'Agenda', icon: FaCalendar },
        { to: '/resumen-page-medico', label: 'Resumen', icon: FaClipboardList },
        { to: '/gestion-citas-page-medico', label: 'Gestion Citas', icon: FaBook },
    ],
    administrador: [
        { to: '/home-page-administrador', label: 'Home', icon: FaHome },
        { to: '/gestion-usuarios-page-administrador', label: 'Gestion Usuarios', icon: FaUsers },
        { to: '/gestion-boxes-page-administrador', label: 'Boxes', icon: FaBoxesStacked },
        { to: '/gestion-horarios-page-administrador', label: 'Horarios', icon: FaClock },
    ],
    recepcionista: [
        { to: '/home-page-recepcionista', label: 'Home', icon: FaHome },
    ],
    paciente: [],
};
