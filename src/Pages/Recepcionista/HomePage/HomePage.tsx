import { useState, useEffect, useMemo, useCallback } from "react";
import "./HomePage.css";
import {
    FaClipboardList,
    FaCalendarTimes,
    FaCheckCircle,
    FaBell,
    FaUserPlus,
    FaExchangeAlt,
    FaInfoCircle,
    FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "sonner";
import RegisterPatientModal from "../../../Components/ModalRegistro/ModalRegistro";
import { ModalDetalleOMRO } from "../../../Components/ModalDetalleOMRO/ModalDetalleOMRO.tsx";
import { ModalHistorialOMRO } from "../../../Components/ModalHistorialOMRO/ModalHistorialOMRO.tsx";
import { ModalOverrideColision } from "../../../Components/ModalOverrideColision/ModalOverrideColision.tsx";
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
import {
    cancelarTareaRecepcion,
    completarTareaRecepcion,
    obtenerTareasRecepcion,
    tomarTareaRecepcion,
    type ReceptionTaskItem,
    type ReceptionTaskPriorityFilter,
    type ReceptionTaskStatusFilter
} from "../../../Services/receptionTasksService.ts";

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

    // Pestañas del Panel Superior Derecho ("omro" | "recepcion")
    const [tabPanelDerecho, setTabPanelDerecho] = useState<"omro" | "recepcion">("omro");
    const [tareasRecepcion, setTareasRecepcion] = useState<ReceptionTaskItem[]>([]);
    const [cargandoTareasRec, setCargandoTareasRec] = useState<boolean>(false);
    const [filtroEstadoRec, setFiltroEstadoRec] = useState<ReceptionTaskStatusFilter>("");
    const [filtroPrioridadRec, setFiltroPrioridadRec] = useState<ReceptionTaskPriorityFilter>("");
    const [procesandoTareaRecId, setProcesandoTareaRecId] = useState<string | null>(null);
    const [notaCompletarPorId, setNotaCompletarPorId] = useState<Record<string, string>>({});
    const [colisionModalCtx, setColisionModalCtx] = useState<{
        appointmentId: string;
        competingAppointmentId?: string | null;
        descripcion?: string;
    } | null>(null);

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

    const recargarTareasRecepcion = useCallback(async (
        status: ReceptionTaskStatusFilter = filtroEstadoRec,
        priority: ReceptionTaskPriorityFilter = filtroPrioridadRec
    ): Promise<void> => {
        setCargandoTareasRec(true);
        try {
            const res = await obtenerTareasRecepcion({
                status,
                priority,
                page: 1,
                pageSize: 30
            });
            setTareasRecepcion(res.items);
        } catch (err: unknown) {
            console.warn("No se pudieron cargar tareas de recepción:", err);
        } finally {
            setCargandoTareasRec(false);
        }
    }, [filtroEstadoRec, filtroPrioridadRec]);

    useEffect(() => {
        let activo = true;
        const iniciarTareasRec = async (): Promise<void> => {
            try {
                const res = await obtenerTareasRecepcion({
                    status: filtroEstadoRec,
                    priority: filtroPrioridadRec,
                    page: 1,
                    pageSize: 30
                });
                if (activo) {
                    setTareasRecepcion(res.items);
                }
            } catch (err: unknown) {
                console.warn("Error al consultar /api/reception-tasks:", err);
            }
        };
        void iniciarTareasRec();
        return () => {
            activo = false;
        };
    }, [filtroEstadoRec, filtroPrioridadRec]);

    const pendientesRecepcionCount = useMemo(
        () =>
            tareasRecepcion.filter(
                (t) =>
                    t.status.toLowerCase() === "pending" ||
                    t.status.toLowerCase() === "inprogress"
            ).length,
        [tareasRecepcion]
    );

    const manejarTomarTareaRec = async (taskId: string): Promise<void> => {
        if (procesandoTareaRecId) return;
        setProcesandoTareaRecId(taskId);
        try {
            await tomarTareaRecepcion(taskId);
            toast.success("Tarea asignada a tu bandeja.");
            await recargarTareasRecepcion();
        } catch (err: unknown) {
            toast.error(err instanceof Error && err.message ? err.message : "No se pudo tomar la tarea.");
        } finally {
            setProcesandoTareaRecId(null);
        }
    };

    const manejarCompletarTareaRec = async (taskId: string): Promise<void> => {
        if (procesandoTareaRecId) return;
        setProcesandoTareaRecId(taskId);
        try {
            const nota = notaCompletarPorId[taskId] || "";
            await completarTareaRecepcion(taskId, nota);
            toast.success("Tarea completada.");
            setNotaCompletarPorId((prev) => {
                const copia = { ...prev };
                delete copia[taskId];
                return copia;
            });
            await recargarTareasRecepcion();
        } catch (err: unknown) {
            toast.error(err instanceof Error && err.message ? err.message : "No se pudo completar la tarea.");
        } finally {
            setProcesandoTareaRecId(null);
        }
    };

    const manejarCancelarTareaRec = async (taskId: string): Promise<void> => {
        if (procesandoTareaRecId) return;
        setProcesandoTareaRecId(taskId);
        try {
            const nota = notaCompletarPorId[taskId] || "";
            await cancelarTareaRecepcion(taskId, nota);
            toast.info("Tarea cancelada.");
            await recargarTareasRecepcion();
        } catch (err: unknown) {
            toast.error(err instanceof Error && err.message ? err.message : "No se pudo cancelar la tarea.");
        } finally {
            setProcesandoTareaRecId(null);
        }
    };

    const tareasPendientesOMRO = tareasOMRO.filter((t) => t.status.toLowerCase() === "pending");
    const tareaActivaOMRO =
        tareasPendientesOMRO.find((t) => t.id === tareaSeleccionadaId) ||
        tareasPendientesOMRO[0] ||
        null;

    const manejarDecisionOMRO = async (decision: "Approved" | "Rejected"): Promise<void> => {
        if (!tareaActivaOMRO || procesandoOMRO) return;
        setProcesandoOMRO(true);
        try {
            const exito = await resolverTareaOMRO(tareaActivaOMRO.id, decision, tareaActivaOMRO);
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

    const handleMarcarAsistencia = async (citaId: string, nuevoEstado: EstadoAsistencia): Promise<void> => {
        const cita = citas.find(c => c.id === citaId);
        const nombrePaciente = cita ? cita.paciente : 'Paciente';
        const estadoAnterior: EstadoAsistencia = cita ? cita.estadoAsistencia : 'pendiente';
        const horaAnterior = cita?.horaMarcada;

        // Actualización optimista en UI
        setCitas(prev => prev.map(c => {
            if (c.id === citaId) {
                const ahora = new Date();
                const horaMarcada = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
                return { ...c, estadoAsistencia: nuevoEstado, horaMarcada };
            }
            return c;
        }));

        try {
            await guardarAsistenciaCita(citaId, nuevoEstado);
            if (nuevoEstado === 'asistio') {
                toast.success(`Asistencia confirmada para ${nombrePaciente}`);
            } else {
                toast.warning(`Inasistencia registrada para ${nombrePaciente}`);
            }
        } catch (err: unknown) {
            // Revertir estado optimista si el backend rechaza la operación (ej. 409 Conflict / 404 NotFound)
            setCitas(prev => prev.map(c => {
                if (c.id === citaId) {
                    return { ...c, estadoAsistencia: estadoAnterior, horaMarcada: horaAnterior };
                }
                return c;
            }));
            const mensaje = err instanceof Error && err.message
                ? err.message
                : 'No se pudo registrar la asistencia en el servidor';
            toast.error(mensaje);
        }
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
                                {tabPanelDerecho === "omro" && (
                                    <button
                                        type="button"
                                        className="Btn-EncabezadoHistorial-Recepcionista"
                                        onClick={() => setModalHistorialAbierto(true)}
                                        title="Ver Historial completo de OMRO"
                                        aria-label="Abrir ventana modal de Historial OMRO"
                                    >
                                        Historial
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="Tabs-PanelRecepcionista" role="tablist" aria-label="Bandejas de recepción">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tabPanelDerecho === "omro"}
                                className={`Tab-BtnRecepcionista ${tabPanelDerecho === "omro" ? "activo" : ""}`}
                                onClick={() => setTabPanelDerecho("omro")}
                            >
                                Propuestas OMRO (HITL)
                                <span className="Tab-CountPill">{tareasPendientesOMRO.length}</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={tabPanelDerecho === "recepcion"}
                                className={`Tab-BtnRecepcionista ${tabPanelDerecho === "recepcion" ? "activo" : ""}`}
                                onClick={() => setTabPanelDerecho("recepcion")}
                            >
                                Tareas de Recepción
                                <span className="Tab-CountPill">{pendientesRecepcionCount}</span>
                            </button>
                        </div>

                        {tabPanelDerecho === "omro" ? (
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
                                        <button
                                            type="button"
                                            className="Btn-VerHistorialVacio-Recepcionista"
                                            onClick={() => setModalHistorialAbierto(true)}
                                        >
                                            Ver Historial OMRO{tareasOMRO.length > 0 ? ` (${tareasOMRO.length})` : ""}
                                        </button>
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
                        ) : (
                            <div className="ContenedorListado-OMRO-Recepcionista">
                                <div className="Filtros-TareasRecepcion">
                                    <select
                                        className="Select-FiltroRecepcion"
                                        aria-label="Filtrar por estado"
                                        value={filtroEstadoRec}
                                        onChange={(e) =>
                                            setFiltroEstadoRec(e.target.value as ReceptionTaskStatusFilter)
                                        }
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="Pending">Pendientes</option>
                                        <option value="InProgress">En progreso</option>
                                        <option value="Completed">Completadas</option>
                                        <option value="Cancelled">Canceladas</option>
                                    </select>
                                    <select
                                        className="Select-FiltroRecepcion"
                                        aria-label="Filtrar por prioridad"
                                        value={filtroPrioridadRec}
                                        onChange={(e) =>
                                            setFiltroPrioridadRec(e.target.value as ReceptionTaskPriorityFilter)
                                        }
                                    >
                                        <option value="">Todas las prioridades</option>
                                        <option value="Urgent">Urgente</option>
                                        <option value="High">Alta</option>
                                        <option value="Medium">Media</option>
                                        <option value="Low">Baja</option>
                                    </select>
                                </div>

                                {cargandoTareasRec ? (
                                    <div className="EmptyState-OMRO-Recepcionista" role="status">
                                        <p>Cargando tareas de recepción...</p>
                                    </div>
                                ) : tareasRecepcion.length === 0 ? (
                                    <div className="EmptyState-OMRO-Recepcionista" role="status">
                                        <p>No hay tareas de recepción para los filtros seleccionados.</p>
                                    </div>
                                ) : (
                                    tareasRecepcion.map((task) => {
                                        const stLower = task.status.toLowerCase();
                                        const esCerrada = stLower === "completed" || stLower === "cancelled";
                                        const esColision =
                                            task.taskType.toUpperCase().includes("COLLISION") ||
                                            task.title.toUpperCase().includes("COLIS") ||
                                            task.description.toUpperCase().includes("COLIS");
                                        const ocupada = procesandoTareaRecId === task.id;

                                        return (
                                            <div key={task.id} className="Card-TareaRecepcion">
                                                <div className="Card-TareaRecepcion-Top">
                                                    <span className="Badge-TipoTareaRec">{task.taskType}</span>
                                                    <span className={`Badge-PrioridadRec ${task.priority.toLowerCase()}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`Badge-EstadoOMRO ${stLower}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <h3 className="Titulo-TareaRec">{task.title}</h3>
                                                {task.description && (
                                                    <p className="Desc-TareaRec">{task.description}</p>
                                                )}
                                                {!esCerrada && (
                                                    <div className="Acciones-TareaRec">
                                                        <input
                                                            type="text"
                                                            className="Input-NotaTareaRec"
                                                            placeholder="Nota de resolución / motivo (opcional)"
                                                            value={notaCompletarPorId[task.id] || ""}
                                                            onChange={(e) =>
                                                                setNotaCompletarPorId((prev) => ({
                                                                    ...prev,
                                                                    [task.id]: e.target.value
                                                                }))
                                                            }
                                                            disabled={ocupada}
                                                        />
                                                        <div className="Botones-TareaRec-Row">
                                                            {stLower === "pending" && (
                                                                <button
                                                                    type="button"
                                                                    className="Btn-TareaRec tomar"
                                                                    disabled={ocupada}
                                                                    onClick={() => void manejarTomarTareaRec(task.id)}
                                                                >
                                                                    Tomar
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="Btn-TareaRec completar"
                                                                disabled={ocupada}
                                                                onClick={() => void manejarCompletarTareaRec(task.id)}
                                                            >
                                                                Completar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="Btn-TareaRec cancelar"
                                                                disabled={ocupada}
                                                                onClick={() => void manejarCancelarTareaRec(task.id)}
                                                            >
                                                                Cancelar
                                                            </button>
                                                            {(esColision || task.appointmentId) && (
                                                                <button
                                                                    type="button"
                                                                    className="Btn-TareaRec override"
                                                                    disabled={ocupada || !task.appointmentId}
                                                                    onClick={() => {
                                                                        if (task.appointmentId) {
                                                                            setColisionModalCtx({
                                                                                appointmentId: task.appointmentId,
                                                                                competingAppointmentId:
                                                                                    task.competingAppointmentId,
                                                                                descripcion: task.description
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <FaExclamationTriangle aria-hidden="true" />
                                                                    Override Colisión
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
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
        <ModalOverrideColision
            isOpen={colisionModalCtx !== null}
            appointmentId={colisionModalCtx?.appointmentId ?? null}
            competingAppointmentId={colisionModalCtx?.competingAppointmentId ?? null}
            descripcionContexto={colisionModalCtx?.descripcion}
            onClose={() => setColisionModalCtx(null)}
            onSuccess={() => {
                void recargarTareasRecepcion();
            }}
        />
        </>
    );
}

export default HomePageRecepcionista;
