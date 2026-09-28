import "./HomePage.css"
import { FaClipboardList } from "react-icons/fa";

function HomePageAdministrador() {
    return (
        <>
        <div className="ContenedorPrincipal-HomeAdministrador">
            <div className="EncabezadoNombre-HomeAdministrador">
                <h1>Bienvenido de Wilson Flores</h1>
            </div>
            <div className="ContenenedorSuperior-HomeAdministrador">
                <div className="ContenedorSuperior-IzquierdaHome">
                    <div className="TituloContenedorSuperior-HomeAdministrador">
                        <h2>Asistencia</h2>
                    </div>
                    <div className="ListadoContenedorSuperior-HomeAdministrador">
                        <p>Porcentaje de Asistencia: 89.9%</p>
                        <p>Porcentaje de Inasistencia: 10.1%</p>
                    </div>
                </div>
                <div className="ContenendorSuperior-DerechaHome">
                    <div className="TituloContenedorSuperior-HomeAdministrador">
                        <h2>Boxes</h2>
                    </div>
                    <div className="ListadoContenedorSuperior-HomeAdministrador">
                        <p>Boxes Activos: 5</p>
                        <p>Boxes Inactivos: 10</p>
                    </div>
                </div>
            </div>
            <div className="ContenedorInferior-HomeAdministrador">
                <div className="ContenedorInferior-IzquierdaHome">
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
                <div className="ContenedorDerecha-DerechaHome">
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
        </>
    )
}

export default HomePageAdministrador;
