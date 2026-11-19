import { useState, useEffect, useMemo } from "react";
import "./HomePage.css";
import {
    FaClipboardList,
    FaCalendarTimes,
    FaCheckCircle,
    FaBell,
    FaUserPlus,
    FaExchangeAlt,
    FaInfoCircle
} from "react-icons/fa";
import { toast } from "sonner";
import RegisterPatientModal from "../../../Components/ModalRegistro/ModalRegistro";
import { ModalDetalleOMRO } from "../../../Components/ModalDetalleOMRO/ModalDetalleOMRO.tsx";
import { ModalHistorialOMRO } from "../../../Components/ModalHistorialOMRO/ModalHistorialOMRO.tsx";
import {
    obtenerCitasDelDiaRecepcion,
    guardarAsistenciaCita,
    type CitaRecepcion,
    type EstadoAsistencia
} from "../../../Services/agenda.ts";
import {
    obtenerConfiguracionAccion,
    obtenerHistorialOMRO,
    resolverTareaOMRO,
    type ResolutionTask,
    type TipoAccionOMRO
} from "../../../Services/omroService.ts";

function renderizarIconoAccionOMRO(tipo: TipoAccionOMRO) {
    switch (tipo) {
        case "Sobrecupo":
            return <FaUserPlus className="Icono-OMRO" />;
        case "Recordatorio":
            return <FaBell className="Icono-OMRO" />;
        case "Reasignacion":
            return <FaExchangeAlt className="Icono-OMRO" />;
        default:
            return <FaClipboardList className="Icono-OMRO" />;
    }
}

function traducirEstadoOMRO(status: string): string {
    const lower = status.toLowerCase();
    if (lower === "pending") return "Pendiente";
    if (lower === "approved") return "Aprobada";
    if (lower === "rejected") return "Rechazada";
    if (lower === "executed") return "Ejecutada";
    return status;
}

function HomePageRecepcionista() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citas, setCitas] = useState<CitaRecepcion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const nombreUsuario = localStorage.getItem('userName') || 'Recepcionista';

    const [tareasOMRO, setTareasOMRO] = useState<ResolutionTask[]>([]);
    const [cargandoOMRO, setCargandoOMRO] = useState<boolean>(true);
    const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
    const [procesandoOMRO, setProcesandoOMRO] = useState<boolean>(false);
    const [tareaModalOMRO, setTareaModalOMRO] = useState<ResolutionTask | null>(null);
    const [modalHistorialAbierto, setModalHistorialAbierto] = useState<boolean>(false);

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

    useEffect(() => {
        let montado = true;
        const cargarOMRO = async (): Promise<void> => {
            setCargandoOMRO(true);
            try {
                const tareas = await obtenerHistorialOMRO();
                if (!montado) return;
                setTareasOMRO(tareas);
                const primeraPendiente = tareas.find((t) => t.status.toLowerCase() === "pending");
                if (primeraPendiente) {
                    setTareaSeleccionadaId(primeraPendiente.id);
                } else if (tareas.length > 0) {
                    setTareaSeleccionadaId(tareas[0].id);
                }
            } catch (err: unknown) {
                console.error("Error al cargar resoluciones OMRO en Recepcionista:", err);
            } finally {
                if (montado) setCargandoOMRO(false);
            }
        };

        void cargarOMRO();
        return () => {
            montado = false;
        };
    }, []);

    const tareasPendientesOMRO = tareasOMRO.filter((t) => t.status.toLowerCase() === "pending");
    const tareaActivaOMRO =
        tareasPendientesOMRO.find((t) => t.id === tareaSeleccionadaId) ||
        tareasPendientesOMRO[0] ||
        null;

    const manejarDecisionOMRO = async (decision: "Approved" | "Rejected"): Promise<void> => {
        if (!tareaActivaOMRO || procesandoOMRO) return;
        setProcesandoOMRO(true);
        try {
            const exito = await resolverTareaOMRO(tareaActivaOMRO.id, decision);
            if (exito) {
                setTareasOMRO((prev) =>
                    prev.map((t) => (t.id === tareaActivaOMRO.id ? { ...t, status: decision } : t))
                );
                toast.success(
                    decision === "Approved"
                        ? "Acción OMRO aprobada y registrada"
                        : "Acción OMRO rechazada"
                );
            } else {
                toast.error("No se pudo registrar la decisión en OMRO");
            }
        } catch (err: unknown) {
            console.error("Error al resolver tarea OMRO:", err);
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : "Error al procesar la acción OMRO";
            toast.error(mensaje);
        } finally {
            setProcesandoOMRO(false);
        }
    };

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
                            <>
                                {[1, 2, 3, 4].map((item) => (
                                    <div className="Card-ListadoCitas Card-ListadoCitas-Skeleton" key={`skeleton-${item}`}>
                                        <div className="CardIzquierda-ListadoCitas">
                                            <div className="Skeleton-Elemento Skeleton-Titulo"></div>
                                            <div className="Skeleton-Elemento Skeleton-Subtitulo"></div>
                                        </div>
                                        <div className="CardDerecha-ListadoCitas">
                                            <div className="Skeleton-Elemento Skeleton-Boton"></div>
                                            <div className="Skeleton-Elemento Skeleton-Boton"></div>
                                        </div>
                                    </div>
                                ))}
                            </>
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
                            <h2>Panel de Orquestación</h2>
                            <div className="Header-ColumnaHistorial-Recepcionista">
                                <button
                                    type="button"
                                    className="Btn-EncabezadoHistorial-Recepcionista"
                                    onClick={() => setModalHistorialAbierto(true)}
                                    title="Ver Historial completo de OMRO"
                                    aria-label="Abrir ventana modal de Historial OMRO"
                                >
                                    Historial
                                </button>
                            </div>
                        </div>
                        <div className="ContenedorListado-OMRO-Recepcionista">
                            {cargandoOMRO ? (
                                [1, 2].map((idx) => (
                                    <div key={idx} className="Card-ListadoOMRO-Recepcionista Card-OMRO-Skeleton-Recepcionista">
                                        <div className="Skeleton-OMRO-Circle" />
                                        <div className="Skeleton-OMRO-Text">
                                            <div className="Skeleton-OMRO-Line1" />
                                            <div className="Skeleton-OMRO-Line2" />
                                        </div>
                                    </div>
                                ))
                            ) : tareasPendientesOMRO.length === 0 ? (
                                <div className="EmptyState-OMRO-Recepcionista" role="status">
                                    <p>No hay acciones pendientes por realizar en el Panel de Orquestación.</p>
                                    {tareasOMRO.length > 0 && (
                                        <button
                                            type="button"
                                            className="Btn-VerHistorialVacio-Recepcionista"
                                            onClick={() => setModalHistorialAbierto(true)}
                                        >
                                            Ver Historial OMRO ({tareasOMRO.length})
                                        </button>
                                    )}
                                </div>
                            ) : (
                                tareasPendientesOMRO.map((tarea) => {
                                    const esSeleccionada = tarea.id === tareaActivaOMRO?.id;
                                    const estadoLower = tarea.status.toLowerCase();
                                    const configAccion = obtenerConfiguracionAccion(tarea.aiPlan.tipoAccion);
                                    return (
                                        <div
                                            key={tarea.id}
                                            className={`Card-ListadoOMRO-Recepcionista ${esSeleccionada ? "seleccionada" : ""}`}
                                            onClick={() => setTareaSeleccionadaId(tarea.id)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="ContenedorIcono-CardOMRO">
                                                {renderizarIconoAccionOMRO(tarea.aiPlan.tipoAccion)}
                                            </div>
                                            <div className="ContenedorDatos-CardOMRO">
                                                <h3>{tarea.aiPlan.titulo}</h3>
                                                <p className="Resumen-CardOMRO" title={tarea.aiPlan.descripcion}>
                                                    {tarea.aiPlan.descripcion}
                                                </p>
                                                <div className="MetaDatos-CardOMRO">
                                                    <p>{tarea.createdAt}</p>
                                                    <span className={`Badge-RiesgoOMRO ${tarea.riskProbability >= 70 ? "alto" : "medio"}`}>
                                                        Riesgo {tarea.riskProbability}%
                                                    </span>
                                                    <span className={`Badge-EstadoOMRO ${estadoLower}`}>
                                                        {traducirEstadoOMRO(tarea.status)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="Btn-VerJustificacionOMRO"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTareaModalOMRO(tarea);
                                                        }}
                                                    >
                                                        <FaInfoCircle aria-hidden="true" />
                                                        Ver justificación
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="ContenedorEstado-CardOMRO">
                                                <button
                                                    type="button"
                                                    className={`ContenedorLetra-CardOMRO Btn-LetraHistorial ${configAccion.claseCss}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setModalHistorialAbierto(true);
                                                    }}
                                                    title={`Historial OMRO · ${configAccion.nombreCompleto}`}
                                                    aria-label={`Abrir Historial OMRO. Tipo de acción: ${configAccion.nombreCompleto}`}
                                                >
                                                    <h1>{configAccion.letra}</h1>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
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
                            {cargandoOMRO ? (
                                <div className="EstadoVacio-AccionesOMRO">
                                    <p>Consultando OMRO...</p>
                                </div>
                            ) : tareaActivaOMRO ? (
                                <>
                                    <div className="ContenedorTitulo-AccionesOMRO">
                                        <span className="Pill-RiesgoDecision-Recepcionista">
                                            Riesgo: {tareaActivaOMRO.riskProbability}%
                                        </span>
                                        <h2>{tareaActivaOMRO.aiPlan.titulo}</h2>
                                        <button
                                            type="button"
                                            className="Btn-VerAnalisisCompleto-Recepcionista"
                                            onClick={() => setTareaModalOMRO(tareaActivaOMRO)}
                                        >
                                            <FaInfoCircle aria-hidden="true" />
                                            Ver análisis completo
                                        </button>
                                    </div>
                                    <div className="ContenedorBotones-AccionesOMRO">
                                        <button
                                            type="button"
                                            className="Btn-AccionOMRO"
                                            disabled={procesandoOMRO}
                                            onClick={() => void manejarDecisionOMRO("Rejected")}
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            type="button"
                                            className="Btn-AccionOMRO"
                                            disabled={procesandoOMRO}
                                            onClick={() => void manejarDecisionOMRO("Approved")}
                                        >
                                            {procesandoOMRO ? "..." : "Aprobar"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="EstadoVacio-AccionesOMRO" role="status">
                                    <FaCheckCircle className="Icono-SinPendientes-Recepcionista" aria-hidden="true" />
                                    <h3>Sin decisiones pendientes</h3>
                                    <p>OMRO no tiene acciones por aprobar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {isModalOpen && (
            <RegisterPatientModal onClose={() => setIsModalOpen(false)} />
        )}
        <ModalDetalleOMRO
            isOpen={tareaModalOMRO !== null}
            tarea={tareaModalOMRO}
            onClose={() => setTareaModalOMRO(null)}
        />
        <ModalHistorialOMRO
            isOpen={modalHistorialAbierto}
            onClose={() => setModalHistorialAbierto(false)}
            tareas={tareasOMRO}
            cargando={cargandoOMRO}
            onSeleccionarAccion={(id) => {
                setTareaSeleccionadaId(id);
                setModalHistorialAbierto(false);
            }}
        />
        </>
    );
}

export default HomePageRecepcionista;
