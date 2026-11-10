import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../Services/supabaseClient.ts';
import './MainPage.css';
import { FaUserCircle, FaChevronLeft, FaChevronRight, FaCalendarCheck } from "react-icons/fa";
import { Contador } from '../../Components/Contador/Contador.tsx'
import { ModalReserva } from '../../Components/ModalReserva/ModalReserva.tsx';
import medico from '../../Assets/medico.jpg';
import CENTROMEDICO from '../../assets/CENTRO MEDICO.jfif';
import SALADEESPERA from '../../assets/SALA DE ESPERA.jfif';
import BOXATENCION from '../../assets/BOX ATENCION.jfif';
import SALAESCANER from '../../assets/SALA ESCANER.jfif';

const imagenesCarrusel = [
    { src: CENTROMEDICO, alt: "Centro Médico", label: "Centro Médico" },
    { src: SALADEESPERA, alt: "Sala de Espera", label: "Sala de Espera" },
    { src: BOXATENCION, alt: "Box de Atención", label: "Box de Atención" },
    { src: SALAESCANER, alt: "Sala de Escáner", label: "Sala de Escáner" },
];

function MainPage(){
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [nombreUsuario, setNombreUsuario] = useState<string>('');
    const [slideActual, setSlideActual] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleAbrirReserva = () => {
        if (isAuthenticated) {
            setIsModalOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };
    const closeModal = () => setIsModalOpen(false);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('userRole');
            const name = localStorage.getItem('userName');

            if (token && token !== 'null' && token !== 'undefined' && role) {
                setIsAuthenticated(true);
                setNombreUsuario(name || (role === 'paciente' ? 'Paciente' : role));
            } else {
                setIsAuthenticated(false);
                setNombreUsuario('');
            }
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setIsAuthenticated(true);
                const storedName = localStorage.getItem('userName');
                setNombreUsuario(storedName || session.user.email?.split('@')[0] || 'Paciente');
            } else {
                const token = localStorage.getItem('token');
                if (!token) {
                    setIsAuthenticated(false);
                    setNombreUsuario('');
                }
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setSlideActual((prev) => (prev + 1) % imagenesCarrusel.length);
        }, 4500);
        return () => clearInterval(timer);
    }, [isPaused]);

    const anteriorSlide = () => {
        setSlideActual((prev) => (prev === 0 ? imagenesCarrusel.length - 1 : prev - 1));
    };

    const siguienteSlide = () => {
        setSlideActual((prev) => (prev + 1) % imagenesCarrusel.length);
    };

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
        localStorage.removeItem('userName');
        setIsAuthenticated(false);
        setNombreUsuario('');
        setIsDropdownOpen(false);
        toast.success('Sesión cerrada exitosamente');
        navigate('/');
    };

    return(
        <>
        <div className="Contenedor-Navbar">
            <button className='Boton-Reserva' onClick={handleAbrirReserva}>
                Reservar Hora
            </button>
            <div className="Contenedor-Usuario-Dropdown" ref={dropdownRef}>
                <button 
                    type="button"
                    className='Boton-Usuario' 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="Menú de usuario"
                >
                    <FaUserCircle className='Icono-Usuario'/>
                </button>
                {isDropdownOpen && (
                    <div className="Dropdown-Menu">
                        {isAuthenticated ? (
                            <>
                                <div className="Dropdown-Usuario-Info">
                                    <span className="Dropdown-Usuario-Saludo">Hola,</span>
                                    <span className="Dropdown-Usuario-Nombre">{nombreUsuario}</span>
                                </div>
                                <div className="Dropdown-Divider" />
                                <button type="button" className="Dropdown-Item-Logout" onClick={handleLogout}>
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    type="button" 
                                    className="Dropdown-Item-Login" 
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate('/login');
                                    }}
                                >
                                    Iniciar Sesión
                                </button>
                                <button 
                                    type="button" 
                                    className="Dropdown-Item-Register" 
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate('/register-page');
                                    }}
                                >
                                    Registrarse
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div 
            className="Contenedor-ImagenPrincipal"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {imagenesCarrusel.map((item, index) => (
                <div 
                    key={index} 
                    className={`Carrusel-Slide ${index === slideActual ? 'activo' : ''}`}
                >
                    <img src={item.src} alt={item.alt} />
                    <div className="Carrusel-Label">{item.label}</div>
                </div>
            ))}

            <button 
                type="button" 
                className="Carrusel-Boton Carrusel-Boton-Prev" 
                onClick={anteriorSlide}
                aria-label="Imagen anterior"
            >
                <FaChevronLeft />
            </button>
            <button 
                type="button" 
                className="Carrusel-Boton Carrusel-Boton-Next" 
                onClick={siguienteSlide}
                aria-label="Siguiente imagen"
            >
                <FaChevronRight />
            </button>

            <div className="Carrusel-Puntos">
                {imagenesCarrusel.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`Carrusel-Punto ${index === slideActual ? 'activo' : ''}`}
                        onClick={() => setSlideActual(index)}
                        aria-label={`Ir a imagen ${index + 1}`}
                    />
                ))}
            </div>
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
                <img src={medico} alt="Foto Medico" />
            </div>
        </div>

        <div className="Contenedor-AgendaHoras">
            <h2>Agenda tu atención hoy mismo</h2>
            <p>No postergues el cuidado de tu salud ni el de tu familia. Te invitamos a reservar tu cita médica en simples pasos: elige el especialista que necesitas, selecciona el horario que mejor se adapte a tu rutina y asegura tu atención sin filas ni demoras. Estamos listos para brindarte el cuidado y la dedicación que mereces.</p>
            <button onClick={handleAbrirReserva}>
                Agenda tu Cita
            </button>
        </div>

        {isAuthModalOpen && (
            <div className="ModalAuth-Overlay" onClick={closeAuthModal}>
                <div className="ModalAuth-Contenedor" onClick={(e) => e.stopPropagation()}>
                    <button 
                        type="button" 
                        className="ModalAuth-BotonCerrar" 
                        onClick={closeAuthModal}
                        aria-label="Cerrar ventana"
                    >
                        ✕
                    </button>
                    <div className="ModalAuth-Icono">
                        <FaCalendarCheck />
                    </div>
                    <h2>Agenda tu atención en MedCareAI</h2>
                    <p>
                        Para reservar tu cita médica y vincularla a tu ficha clínica, por favor inicia sesión con tu cuenta o regístrate en simples pasos.
                    </p>
                    <div className="ModalAuth-Botones">
                        <button 
                            type="button" 
                            className="ModalAuth-BotonLogin"
                            onClick={() => {
                                closeAuthModal();
                                navigate('/login');
                            }}
                        >
                            Iniciar Sesión
                        </button>
                        <button 
                            type="button" 
                            className="ModalAuth-BotonRegister"
                            onClick={() => {
                                closeAuthModal();
                                navigate('/register-page');
                            }}
                        >
                            Crear Cuenta
                        </button>
                    </div>
                </div>
            </div>
        )}

        <ModalReserva isOpen={isModalOpen} onClose={closeModal} />
        </>
    )
}

export default MainPage;