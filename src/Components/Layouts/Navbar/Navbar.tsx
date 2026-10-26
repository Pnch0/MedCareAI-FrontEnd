import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { FaSignOutAlt  } from "react-icons/fa";
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Services/supabaseClient.ts';
import { apiClient } from '../../../Services/apiClient.ts';
import { getUserRole } from '../../Routes/roles.ts';
import { NAV_CONFIG } from './navConfig.tsx';

const NOMBRE_POR_DEFECTO = 'Usuario';

const obtenerIniciales = (nombre: string) =>
    nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? '')
        .join('');


function Navbar(){
    const navigate = useNavigate();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [nombreUsuario, setNombreUsuario] = useState<string>(() => {
        const guardado = localStorage.getItem('userName');
        return (guardado && guardado !== 'Wilson Flores') ? guardado : NOMBRE_POR_DEFECTO;
    });

    useEffect(() => {
        const resolverNombre = async () => {
            const guardado = localStorage.getItem('userName');
            if (guardado && guardado !== 'Wilson Flores') {
                setNombreUsuario(guardado);
                return;
            }

            try {
                const { data: authData } = await supabase.auth.getUser();
                const user = authData?.user;
                if (!user) return;

                const userEmail = user.email || '';
                const userId = user.id;

                try {
                    const staffList = await apiClient('/api/Staff', { method: 'GET' });
                    if (Array.isArray(staffList)) {
                        const staffMember = staffList.find((s: any) =>
                            (s.userId && s.userId === userId) ||
                            (s.email && s.email.toLowerCase() === userEmail.toLowerCase())
                        );
                        if (staffMember && (staffMember.firstName || staffMember.lastName)) {
                            const nombreReal = `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
                            setNombreUsuario(nombreReal);
                            localStorage.setItem('userName', nombreReal);
                            return;
                        }
                    }
                } catch {
                    // Si falla consulta a staff, usar metadata de Supabase
                }

                const meta = user.user_metadata;
                const nombreMeta = meta?.full_name ||
                    (meta?.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : '') ||
                    (userEmail ? userEmail.split('@')[0] : 'Usuario');

                setNombreUsuario(nombreMeta);
                localStorage.setItem('userName', nombreMeta);
            } catch (err) {
                console.error('Error al resolver nombre de usuario en Navbar:', err);
            }
        };

        resolverNombre();
    }, []);

    useEffect(() => {
        const manejarClickFuera = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setMenuAbierto(false);
            }
        };

        const manejarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuAbierto(false);
            }
        };

        document.addEventListener('mousedown', manejarClickFuera);
        document.addEventListener('keydown', manejarTecla);

        return () => {
            document.removeEventListener('mousedown', manejarClickFuera);
            document.removeEventListener('keydown', manejarTecla);
        };
    }, []);

    const userRole = getUserRole();
    const enlaces = NAV_CONFIG[userRole];

    const iniciales = obtenerIniciales(nombreUsuario);

    const abrirMenu = () => {
        clearTimeout(timerRef.current);
        setMenuAbierto(true);
    };

    const cerrarMenu = () => {
        timerRef.current = setTimeout(() => setMenuAbierto(false), 150);
    };

    const cerrarSesion = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        setMenuAbierto(false);
        navigate('/', { replace: true });
    };

    return(
        <>
            <div className="Contenedor-NavbarPrincipal">
                <div className="Contenedor-PaginasNavbar">
                    <ul>
                        {enlaces.map(({ to, label, icon: Icono }) => (
                            <li key={to}>
                                <NavLink to={to} className = "nav-item" onClick={() => setMenuAbierto(false)}>
                                    <Icono className='Icono-NavbarPrincipal'/> {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
                <div
                    className="Contenedor-NombreNavbar"
                    ref={contenedorRef}
                    onMouseEnter={abrirMenu}
                    onMouseLeave={cerrarMenu}
                >
                    <div className="Contenedor-InicialesNombre">
                        {iniciales}
                    </div>
                    <div className="Contenedor-Nombre">
                        {nombreUsuario}
                    </div>

                    {menuAbierto && (
                        <div className="MenuUsuario-Lista" role="menu">
                            <button
                                type="button"
                                role="menuitem"
                                className="MenuUsuario-Item"
                                onClick={cerrarSesion}
                            >
                                <FaSignOutAlt className="MenuUsuario-Icono" />
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )

}


export default Navbar;
