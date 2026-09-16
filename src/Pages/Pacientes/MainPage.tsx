import './MainPage.css';
import { FaUserCircle } from "react-icons/fa";


function MainPage(){

    return(
        <>
        <div className="Contenedor-Navbar">
            <button className='Boton-Reserva'>
                Reservar Hora
            </button>
            <button className='Boton-Usuario'>
                <FaUserCircle className='Icono-Usuario'/>
            </button>
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
                            +20000
                        </div>
                        <div className="Contenedor-Texto">
                            <h3>Pacientes Atendidos</h3>
                            <p>Miles de familias confían en nosotros día a día para el cuidado y prevención de su salud, respaldados por una atención oportuna y de calidad.</p>
                        </div>
                    </div>
                    <div className="Contenedor-Derecha">
                        <div className="Contenedor-Numero">
                            +15
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
            <button>
                Agenda tu Cita
            </button>
        </div>
        </>
    )
}

export default MainPage;