import { useState } from "react";
import "./HomePage.css"
import { FaClipboardList } from "react-icons/fa";
import RegisterPatientModal from "../../../Components/ModalRegistro/ModalRegistro";

function HomePageRecepcionista() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
        <div className="ContenendorPrincipal-HomePage">
            <div className="ContenedorSuperior-HomePage">
                <div className="ContenedorSuperior-Izquierda">
                    <h1>Bienvenido Wilson Flores</h1>
                </div>
                <div className="ContenedorSuperior-Derecha">
                    <button onClick={() => setIsModalOpen(true)}>
                        Registrar Paciente
                    </button>
                </div>
            </div>
            <div className="ContenedorInferior-HomePageRecepcionista">
                <div className="ContenedorInferiorSuperior-HomePageRecepcionista">
                    <div className="ContenedorIzquierda-HomePageRecepcionista">
                        <div className="EncabezadoListado-CitasRecepcionista">
                            <h2>Citas</h2>
                        </div>
                        <div className="Listado-CitasRecepcionista">
                            <div className="Card-CitasRecepcionista">
                                <div className="Card-CitasRecepcionista-Izquierda">
                                    <h3>Gonzalo Yañez</h3>
                                    <p>08-09-2026, 15:00</p>
                                </div>
                                <div className="Card-CitasRecepcionista-Derecha">
                                    <button className="Btn-Asistio">Asistió</button>
                                    <button className="Btn-NoAsistio">No Asistió</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ContenedorDerecha-HomePageRecepcionista">
                        <div className="EncabezadoListado-InformacionBoxes">
                            <h2>Boxes</h2>
                        </div>
                        <div className="Listado-InformacionBoxes">
                            <h3>Boxes Activos: 5</h3>
                            <h3>Boxes Inactivos: 10</h3>
                        </div>
                    </div>
                </div>
                <div className="ContenedorInferiorInferior-HomePageRecepcionista">
                    <div className="ContenedorInferiorInferior-Izquierda">
                        <div className="ContenedorEncabezado-IzquierdaHome">
                            <h1>Historial OMRO</h1>
                        </div>
                        <div className="ContenedorListado-IzquierdaHome">
                            <div className="Card-ListadoOMRO">
                                <div className="ContenedorIcono-CardOMRO">
                                    <FaClipboardList className="Icono-OMRO"/>
                                </div>
                                <div className="ContenedorDatos-CardOMRO">
                                    <h3>Enviar Recordatorio</h3>
                                    <p>28-08-2026</p>
                                </div>
                                <div className="ContenedorEstado-CardOMRO">
                                    <div className="ContenedorLetra-CardOMRO">
                                        <h1>R</h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ContenedorInferiorInferior-Derecha">
                        <div className="ContenedorTitulo-DerechaHome">
                            <h2>¿Desea generar sobrecupo?</h2>
                        </div>
                        <div className="ContenedorBotones-DerechaHome">
                            <button>Rechazar</button>
                            <button>Aprobar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {isModalOpen && (
            <RegisterPatientModal onClose={() => setIsModalOpen(false)} />
        )}
        </>
    )
}

export default HomePageRecepcionista;