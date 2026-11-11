import { useState, useEffect, useMemo } from "react";
import "./HomePage.css";
import { FaClipboardList, FaCalendarTimes } from "react-icons/fa";
import { toast } from "sonner";
import RegisterPatientModal from "../../../Components/ModalRegistro/ModalRegistro";
import {
    obtenerCitasDelDiaRecepcion,
    guardarAsistenciaCita,
    type CitaRecepcion,
    type EstadoAsistencia
} from "../../../Services/agenda.ts";

function HomePageRecepcionista() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citas, setCitas] = useState<CitaRecepcion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const nombreUsuario = localStorage.getItem('userName') || 'Recepcionista';

    const fechaHoyTexto = useMemo(() => {
        const hoy = new Date();
        const texto = hoy.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }, []);

    const resumen = useMemo(() => {
        const total = citas.length;
        const asistieron = citas.filter(c => c.estadoAsistencia === 'asistio').length;
        const pendientes = citas.filter(c => c.estadoAsistencia === 'pendiente').length;
        return { total, asistieron, pendientes };
    }, [citas]);

    const cargarCitas = async () => {
        try {
            setCargando(true);
            const lista = await obtenerCitasDelDiaRecepcion(new Date());
            setCitas(lista);
        } catch (error) {
            console.error('Error al cargar citas del día para recepción:', error);
            toast.error('Error al cargar el listado de citas');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCitas();
    }, []);

    const handleMarcarAsistencia = async (citaId: string, nuevoEstado: EstadoAsistencia) => {
        const cita = citas.find(c => c.id === citaId);
        const nombrePaciente = cita ? cita.paciente : 'Paciente';

        // Actualización optimista en UI
        setCitas(prev => prev.map(c => {
            if (c.id === citaId) {
                const ahora = new Date();
                const horaMarcada = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
                return { ...c, estadoAsistencia: nuevoEstado, horaMarcada };
            }
            return c;
        }));

        if (nuevoEstado === 'asistio') {
            toast.success(`Asistencia confirmada para ${nombrePaciente}`);
        } else {
            toast.warning(`Inasistencia registrada para ${nombrePaciente}`);
        }

        await guardarAsistenciaCita(citaId, nuevoEstado);
    };

    const handleRevertirAsistencia = async (citaId: string) => {
        setCitas(prev => prev.map(c => {
            if (c.id === citaId) {
                return { ...c, estadoAsistencia: 'pendiente', horaMarcada: undefined };
            }
            return c;
        }));
        await guardarAsistenciaCita(citaId, 'pendiente');
        toast.info('Estado de asistencia restablecido a pendiente');
    };

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
                        <div className="EncabezadoCitas-TituloRow">
                            <h2>Citas del Día</h2>
                            <span className="EncabezadoCitas-Pill">
                                {resumen.total === 0
                                    ? '0 citas hoy'
                                    : `${resumen.total} citas • ${resumen.asistieron} presentes`}
                            </span>
                        </div>
                        <p className="EncabezadoCitas-Fecha">{fechaHoyTexto}</p>
                    </div>
                    <div className="ListadoCitas-HomePageRecepcionista">
                        {cargando ? (
                            <div className="ListadoCitas-EstadoMensaje">
                                <p>Cargando citas del día...</p>
                            </div>
                        ) : citas.length === 0 ? (
                            <div className="ListadoCitas-EstadoMensaje">
                                <div className="EstadoVacio-Icono">
                                    <FaCalendarTimes />
                                </div>
                                <h3>No hay citas programadas para hoy</h3>
                                <p>No se registran atenciones médicas agendadas para la fecha actual en la base de datos.</p>
                            </div>
                        ) : (
                            citas.map((cita) => (
                                <div className="Card-ListadoCitas" key={cita.id}>
                                    <div className="CardIzquierda-ListadoCitas">
                                        <h3>{cita.paciente}</h3>
                                        <p>{cita.hora} hrs • Box {cita.box} • {cita.medicoNombre}</p>
                                    </div>
                                    <div className="CardDerecha-ListadoCitas">
                                        {cita.estadoAsistencia === 'pendiente' ? (
                                            <>
                                                <button 
                                                    type="button"
                                                    className="BTN-Asistio"
                                                    onClick={() => handleMarcarAsistencia(cita.id, 'asistio')}
                                                >
                                                    Asistió
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="BTN-NoAsistio"
                                                    onClick={() => handleMarcarAsistencia(cita.id, 'no_asistio')}
                                                >
                                                    No Asistió
                                                </button>
                                            </>
                                        ) : cita.estadoAsistencia === 'asistio' ? (
                                            <div className="ContenedorEstado-Asistencia">
                                                <span className="Badge-Asistencia-Asistio">
                                                    ✓ Asistió {cita.horaMarcada ? `(${cita.horaMarcada})` : ''}
                                                </span>
                                                <button 
                                                    type="button"
                                                    className="BTN-CambiarAsistencia"
                                                    onClick={() => handleRevertirAsistencia(cita.id)}
                                                    title="Modificar estado de asistencia"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="ContenedorEstado-Asistencia">
                                                <span className="Badge-Asistencia-NoAsistio">
                                                    ✕ No Asistió
                                                </span>
                                                <button 
                                                    type="button"
                                                    className="BTN-CambiarAsistencia"
                                                    onClick={() => handleRevertirAsistencia(cita.id)}
                                                    title="Modificar estado de asistencia"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
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
