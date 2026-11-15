import { useEffect, useState } from "react";
import "./HomePage.css";
import { FaClipboardList, FaCheckCircle, FaBell, FaUserPlus, FaExchangeAlt, FaInfoCircle } from "react-icons/fa";
import { toast } from "sonner";
import { ModalDetalleOMRO } from "../../../Components/ModalDetalleOMRO/ModalDetalleOMRO.tsx";
import {
    obtenerConfiguracionAccion,
    obtenerHistorialOMRO,
    resolverTareaOMRO,
    type ResolutionTask,
    type TipoAccionOMRO
} from "../../../Services/omroService.ts";

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
        } catch {
            toast.error("Error al procesar la decisión OMRO");
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
                        ) : tareasOMRO.length === 0 ? (
                            <div className="EmptyState-OMRO">
                                <p>No hay registros recientes en el historial OMRO.</p>
                            </div>
                        ) : (
                            tareasOMRO.map((tarea) => {
                                const esSeleccionada = tarea.id === tareaActiva?.id;
                                const estadoLower = tarea.status.toLowerCase();
                                const configAccion = obtenerConfiguracionAccion(tarea.aiPlan.tipoAccion);
                                return (
                                    <div
                                        key={tarea.id}
                                        className={`Card-ListadoOMRO ${esSeleccionada ? "seleccionada" : ""}`}
                                        onClick={() => {
                                            if (estadoLower === "pending") {
                                                setTareaSeleccionadaId(tarea.id);
                                            }
                                        }}
                                        style={{ cursor: estadoLower === "pending" ? "pointer" : "default" }}
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
                                            <div
                                                className={`ContenedorLetra-CardOMRO ${configAccion.claseCss}`}
                                                title={configAccion.nombreCompleto}
                                                aria-label={`Acción de tipo ${configAccion.nombreCompleto}`}
                                            >
                                                <h1>{configAccion.letra}</h1>
                                            </div>
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
                        <div className="EstadoVacio-DecisionOMRO">
                            <FaCheckCircle className="Icono-SinPendientes" />
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
        </>
    );
}

export default HomePageAdministrador;
