import { useState } from "react";
import "./HomePage.css";
import { FaClipboardList } from "react-icons/fa";
import RegisterPatientModal from "../../../Components/ModalRegistro/ModalRegistro";

function HomePageRecepcionista() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const nombreUsuario = localStorage.getItem('userName') || 'Recepcionista';

    return (
        <>
        <div className="ContenendorPrincipal-HomePage">
            <div className="ContenedorSuperior-HomePage">
                <div className="ContenedorSuperior-Izquierda">
                    <h1>Bienvenido {nombreUsuario}</h1>
                </div>
                <div className="ContenedorSuperior-Derecha">
                    <button onClick={() => setIsModalOpen(true)}>
                        Registrar Paciente
                    </button>
                </div>
            </div>
            <div className="ContenedorInferior-HomePageRecepcionista">
                <div className="ContenedorIzquierda-HomePageRecepcionista">
                    <div className="EncabezadoContenedorIzquierda-HomePageRecepcionista">
                        <h2>
                            Citas
                        </h2>
                    </div>
                    <div className="ListadoCitas-HomePageRecepcionista">
                        <div className="Card-ListadoCitas">
                            <div className="CardIzquierda-ListadoCitas">
                                <h3>Francisco Espinoza</h3>
                                <p>08-09-2026, 15:00</p>
                            </div>
                            <div className="CardDerecha-ListadoCitas">
                                <button className="BTN-Asistio">Asistió</button>
                                <button className="BTN-NoAsistio">No Asistió</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ContenedorDerecha-HomePageRecepcionista">
                    <div className="ContenedorDerecha-SuperiorRecepcionista">
                        <div className="EncabezadoContenedor-SuperiorDerecha">
                            <h2>Historial OMRO</h2>
                        </div>
                        <div className="Card-ListadoOMRO-Recepcionista">
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
                    <div className="ContenedorDerecha-InferiorRecepcionista">
                        <div className="Contenedor-InfoBoxes">
                            <div className="Encabezado-InfoBoxes">
                                <h2>Boxes</h2>
                            </div>
                            <div className="InfoBoxes-Recepcionista">
                                <h3>Boxes Activos: 5</h3>
                                <h3>Boxes Inactivos: 10</h3>
                            </div>
                        </div>
                        <div className="Contenedor-AccionesOMRO">
                            <div className="ContenedorTitulo-AccionesOMRO">
                                <h2>¿Desea generar sobrecupo?</h2>
                            </div>
                            <div className="ContenedorBotones-AccionesOMRO">
                                <button type="button" className="Btn-AccionOMRO">Rechazar</button>
                                <button type="button" className="Btn-AccionOMRO">Aprobar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {isModalOpen && (
            <RegisterPatientModal onClose={() => setIsModalOpen(false)} />
        )}
        </>
    );
}

export default HomePageRecepcionista;
