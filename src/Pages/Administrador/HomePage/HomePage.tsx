import { useEffect, useState } from "react";
import "./HomePage.css";
import { FaClipboardList, FaCheckCircle, FaBell, FaUserPlus, FaExchangeAlt, FaInfoCircle } from "react-icons/fa";
import { toast } from "sonner";
import { ModalDetalleOMRO } from "../../../Components/ModalDetalleOMRO/ModalDetalleOMRO.tsx";
import { ModalHistorialOMRO } from "../../../Components/ModalHistorialOMRO/ModalHistorialOMRO.tsx";
import {
    obtenerConfiguracionAccion,
    obtenerHistorialOMRO,
    resolverTareaOMRO,
    type ResolutionTask,
    type TipoAccionOMRO
} from "../../../Services/omroService.ts";
import {
    obtenerMetricasAusentismo,
    type ResumenKPIsDTO
} from "../../../Services/dashboardAdmin.ts";

function renderizarIconoAccion(tipo: TipoAccionOMRO) {
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

function traducirEstado(status: string): string {
    const lower = status.toLowerCase();
    if (lower === "pending") return "Pendiente";
    if (lower === "approved") return "Aprobada";
    if (lower === "rejected") return "Rechazada";
    if (lower === "executed") return "Ejecutada";
    return status;
}

function HomePageAdministrador() {
    const nombreUsuario = localStorage.getItem('userName') || 'Administrador';

    const [tareasOMRO, setTareasOMRO] = useState<ResolutionTask[]>([]);
    const [cargandoOMRO, setCargandoOMRO] = useState<boolean>(true);
    const [tareaSeleccionadaId, setTareaSeleccionadaId] = useState<string | null>(null);
    const [procesando, setProcesando] = useState<boolean>(false);
    const [tareaModal, setTareaModal] = useState<ResolutionTask | null>(null);
    const [modalHistorialAbierto, setModalHistorialAbierto] = useState<boolean>(false);
    const [kpisAsistencia, setKpisAsistencia] = useState<ResumenKPIsDTO | null>(null);
    const [cargandoKpis, setCargandoKpis] = useState<boolean>(true);

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
                console.error("Error al cargar resoluciones OMRO:", err);
            } finally {
                if (montado) setCargandoOMRO(false);
            }
        };

        void cargarOMRO();
        return () => {
            montado = false;
        };
    }, []);

    useEffect(() => {
        let montado = true;
        const cargarMetricas = async (): Promise<void> => {
            try {
                const resultado = await obtenerMetricasAusentismo();
                if (montado) {
                    setKpisAsistencia(resultado.kpis);
                }
            } catch (err: unknown) {
                console.warn("No se pudieron cargar métricas de asistencia para el Home:", err);
            } finally {
                if (montado) {
                    setCargandoKpis(false);
                }
            }
        };

        void cargarMetricas();
        return () => {
            montado = false;
        };
    }, []);

    const tareasPendientes = tareasOMRO.filter((t) => t.status.toLowerCase() === "pending");
    const tareaActiva =
        tareasPendientes.find((t) => t.id === tareaSeleccionadaId) ||
        tareasPendientes[0] ||
        null;

    const manejarDecision = async (decision: "Approved" | "Rejected"): Promise<void> => {
        if (!tareaActiva || procesando) return;
        setProcesando(true);
        try {
            const exito = await resolverTareaOMRO(tareaActiva.id, decision);
            if (exito) {
                setTareasOMRO((prev) =>
                    prev.map((t) => (t.id === tareaActiva.id ? { ...t, status: decision } : t))
                );
                toast.success(
                    decision === "Approved"
                        ? "Acción OMRO aprobada y registrada"
                        : "Acción OMRO rechazada"
                );
                const siguientePendiente = tareasPendientes.find((t) => t.id !== tareaActiva.id);
                setTareaSeleccionadaId(siguientePendiente ? siguientePendiente.id : null);
            } else {
                toast.error("No se pudo registrar la decisión en el servidor");
            }
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : "Error al procesar la decisión OMRO";
            toast.error(mensaje);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <>
        <div className="ContenedorPrincipal-HomeAdministrador">
            <div className="EncabezadoNombre-HomeAdministrador">
                <h1>Bienvenido {nombreUsuario}</h1>
            </div>
            <div className="ContenenedorSuperior-HomeAdministrador">
                <div className="ContenedorSuperior-IzquierdaHome">
                    <div className="TituloContenedorSuperior-HomeAdministrador">
                        <h2>Asistencia</h2>
                    </div>
                    <div className="ListadoContenedorSuperior-HomeAdministrador">
                        <p>
                            Porcentaje de Asistencia:{" "}
                            {cargandoKpis
                                ? "..."
                                : `${(kpisAsistencia?.tasaAsistencia ?? 89.9).toFixed(1)}%`}
                        </p>
                        <p>
                            Porcentaje de Inasistencia:{" "}
                            {cargandoKpis
                                ? "..."
                                : `${(kpisAsistencia?.tasaAusentismo ?? 10.1).toFixed(1)}%`}
                        </p>
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
                        <h1>Panel de Orquestación</h1>
                        <div className="Header-ColumnaHistorial">
                            <button
                                type="button"
                                className="Btn-EncabezadoHistorial"
                                onClick={() => setModalHistorialAbierto(true)}
                                title="Ver Historial completo de OMRO"
                                aria-label="Abrir ventana modal de Historial OMRO"
                            >
                                Historial
                            </button>
                        </div>
                    </div>
                    <div className="ContenedorListado-IzquierdaHome">
                        {cargandoOMRO ? (
                            [1, 2, 3].map((idx) => (
                                <div key={idx} className="Card-ListadoOMRO Card-OMRO-Skeleton">
                                    <div className="Skeleton-OMRO-Circle" />
                                    <div className="Skeleton-OMRO-Text">
                                        <div className="Skeleton-OMRO-Line1" />
                                        <div className="Skeleton-OMRO-Line2" />
                                    </div>
                                </div>
                            ))
                        ) : tareasPendientes.length === 0 ? (
                            <div className="EmptyState-OMRO" role="status">
                                <p>No hay acciones pendientes por realizar en el Panel de Orquestación.</p>
                                {tareasOMRO.length > 0 && (
                                    <button
                                        type="button"
                                        className="Btn-VerHistorialVacio"
                                        onClick={() => setModalHistorialAbierto(true)}
                                    >
                                        Ver Historial OMRO ({tareasOMRO.length})
                                    </button>
                                )}
                            </div>
                        ) : (
                            tareasPendientes.map((tarea) => {
                                const esSeleccionada = tarea.id === tareaActiva?.id;
                                const estadoLower = tarea.status.toLowerCase();
                                const configAccion = obtenerConfiguracionAccion(tarea.aiPlan.tipoAccion);
                                return (
                                    <div
                                        key={tarea.id}
                                        className={`Card-ListadoOMRO ${esSeleccionada ? "seleccionada" : ""}`}
                                        onClick={() => setTareaSeleccionadaId(tarea.id)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="ContenedorIcono-CardOMRO">
                                            {renderizarIconoAccion(tarea.aiPlan.tipoAccion)}
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
                                                    {traducirEstado(tarea.status)}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="Btn-VerJustificacionOMRO"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTareaModal(tarea);
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
                <div className="ContenedorDerecha-DerechaHome">
                    {cargandoOMRO ? (
                        <div className="EstadoVacio-DecisionOMRO">
                            <p>Consultando motor orquestador...</p>
                        </div>
                    ) : tareaActiva ? (
                        <>
                            <div className="ContenedorTitulo-DerechaHome Decision-ConDetalle">
                                <span className="Pill-RiesgoDecision">
                                    Riesgo de inasistencia: {tareaActiva.riskProbability}%
                                </span>
                                <h2>{tareaActiva.aiPlan.titulo}</h2>
                                <button
                                    type="button"
                                    className="Btn-VerAnalisisCompleto"
                                    onClick={() => setTareaModal(tareaActiva)}
                                >
                                    <FaInfoCircle aria-hidden="true" />
                                    Ver análisis completo
                                </button>
                            </div>
                            <div className="ContenedorBotones-DerechaHome">
                                <button
                                    type="button"
                                    disabled={procesando}
                                    onClick={() => void manejarDecision("Rejected")}
                                >
                                    Rechazar
                                </button>
                                <button
                                    type="button"
                                    disabled={procesando}
                                    onClick={() => void manejarDecision("Approved")}
                                >
                                    {procesando ? "Procesando..." : "Aprobar"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="EstadoVacio-DecisionOMRO" role="status">
                            <FaCheckCircle className="Icono-SinPendientes" aria-hidden="true" />
                            <h3>Sin decisiones pendientes</h3>
                            <p>El motor OMRO no tiene acciones pendientes por aprobar en este momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <ModalDetalleOMRO
            isOpen={tareaModal !== null}
            tarea={tareaModal}
            onClose={() => setTareaModal(null)}
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

export default HomePageAdministrador;
