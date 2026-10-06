import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../Services/supabaseClient.ts';
import './MainPage.css';
import { FaUserCircle } from "react-icons/fa";
import { Contador } from '../../Components/Contador/Contador.tsx'
import { ModalReserva } from '../../Components/ModalReserva/ModalReserva.tsx';


function MainPage(){
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        toast.success('Sesión cerrada exitosamente');
        navigate('/');
    };

    return(
        <>
        <div className="Contenedor-Navbar">
            <button className='Boton-Reserva' onClick={openModal}>
                Reservar Hora
            </button>
            <div className="Contenedor-Usuario-Dropdown" ref={dropdownRef}>
                <button className='Boton-Usuario' onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <FaUserCircle className='Icono-Usuario'/>
                </button>
                {isDropdownOpen && (
                    <div className="Dropdown-Menu">
                        <button className="Dropdown-Item-Logout" onClick={handleLogout}>
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="Contenedor-ImagenPrincipal">

        </div>

        <div className="Contenedor-SobreNosotros">
            <div className="ContenedorTexto-SobreNosotros">
                <div className="Contenedor-TextoSuperior">
                    <h1>SOBRE NOSOTROS</h1>
                    <h3>Tu salud en manos expertas y de confianza</h3>
                    <p>En nuestro centro médico nos dedicamos a cuidar de ti y de tu familia con un trato cercano, humano y profesional. Ofrecemos una atención integral con tecnología moderna e instalaciones pensadas para que tu experiencia sea cómoda, rápida y segura desde el primer momento.</p>
                </div>
                <div className="Contenedor-TextoInferior">
                    <div className="Contenedor-Izquierda">
                        <div className="Contenedor-Numero">
                            <Contador target={20000} duration={2500} prefix="+" />
                        </div>
                        <div className="Contenedor-Texto">
                            <h3>Pacientes Atendidos</h3>
                            <p>Miles de familias confían en nosotros día a día para el cuidado y prevención de su salud, respaldados por una atención oportuna y de calidad.</p>
                        </div>
                    </div>
                    <div className="Contenedor-Derecha">
                        <div className="Contenedor-Numero">
                            <Contador target={15} duration={1800} prefix="+" />
                        </div>
                        <div className="Contenedor-Texto">
                            <h3>Especialistas Médicos</h3>
                            <p>Contamos con un equipo de doctores y profesionales de la salud en diversas áreas para resolver todas tus consultas y necesidades en un solo lugar.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="ContenedorImagen-SobreNosotros">

            </div>
        </div>

        <div className="Contenedor-AgendaHoras">
            <h2>Agenda tu atención hoy mismo</h2>
            <p>No postergues el cuidado de tu salud ni el de tu familia. Te invitamos a reservar tu cita médica en simples pasos: elige el especialista que necesitas, selecciona el horario que mejor se adapte a tu rutina y asegura tu atención sin filas ni demoras. Estamos listos para brindarte el cuidado y la dedicación que mereces.</p>
            <button onClick={openModal}>
                Agenda tu Cita
            </button>
        </div>

        <ModalReserva isOpen={isModalOpen} onClose={closeModal} />
        </>
    )
}

export default MainPage;