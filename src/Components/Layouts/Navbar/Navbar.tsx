import { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { FaHome, FaCalendar, FaBook, FaSignOutAlt  } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Services/supabaseClient.ts';


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
        setMenuAbierto(false);
        navigate('/', { replace: true });
    };

    return(
        <>
            <div className="Contenedor-NavbarPrincipal">
                <div className="Contenedor-PaginasNavbar">
                    <ul>
                        <li>
                            <NavLink to="/home-page-medico" className = "nav-item">
                                <FaHome className='Icono-NavbarPrincipal'/> Home
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/agenda-page-medico" className = "nav-item">
                                <FaCalendar  className='Icono-NavbarPrincipal'/> Agenda
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/resumen-page-medico" className = "nav-item">
                                <FaClipboardList  className='Icono-NavbarPrincipal'/> Resumen
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/gestion-citas-page-medico" className = "nav-item">
                                <FaBook  className='Icono-NavbarPrincipal'/> Gestion Citas
                            </NavLink>
                        </li>
                    </ul>
                </div>
                <div
                    className="Contenedor-NombreNavbar"
                    ref={contenedorRef}
                    onMouseEnter={abrirMenu}
                    onMouseLeave={cerrarMenu}
                >
                    <div className="Contenedor-InicialesNombre">
                        WF
                    </div>
                    <div className="Contenedor-Nombre">
                        Wilson Flores
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
