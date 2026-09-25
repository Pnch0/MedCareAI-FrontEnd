import './Navbar.css';
import { FaHome, FaCalendar, FaBook  } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';


function Navbar(){
    const navigate = useNavigate();

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
                <div className="Contenedor-NombreNavbar">
                    <div className="Contenedor-InicialesNombre">
                        WF
                    </div>
                    <div className="Contenedor-Nombre">
                        Wilson Flores
                    </div>
                </div>
            </div>
        </>
    )

}


export default Navbar;