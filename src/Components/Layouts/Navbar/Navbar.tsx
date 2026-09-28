import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { FaSignOutAlt  } from "react-icons/fa";
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Services/supabaseClient.ts';
import { getUserRole } from '../../Routes/roles.ts';
import { NAV_CONFIG } from './navConfig.tsx';

const NOMBRE_POR_DEFECTO = 'Wilson Flores';

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

    const nombreUsuario = localStorage.getItem('userName') || NOMBRE_POR_DEFECTO;
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
