import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    FaCalendarCheck,
    FaUserSlash,
    FaBolt,
    FaClock,
    FaBell,
    FaChartBar,
    FaChartPie,
    FaExclamationTriangle,
    FaCheckCircle,
    FaRedo
} from "react-icons/fa";
import {
    obtenerMetricasAusentismo,
    obtenerMetricasSobrecupo,
    type DashboardAusentismoDTO,
    type CitaRiesgoDTO
} from "../../../Services/dashboardAdmin.ts";
import "./DashboardAdministrador.css";

function formatearMonedaCLP(monto: number): string {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(monto);
}

function DashboardAdministrador() {
    const [datos, setDatos] = useState<DashboardAusentismoDTO | null>(null);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [estadoActivoDonut, setEstadoActivoDonut] = useState<string | null>(null);
    const [refrescandoSobrecupo, setRefrescandoSobrecupo] = useState<boolean>(false);

    const cargarDatos = async (): Promise<void> => {
        setCargando(true);
        setError(null);
        try {
            const respuesta = await obtenerMetricasAusentismo();
            setDatos(respuesta);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "No se pudieron cargar las métricas";
            setError(mensaje);
            toast.error("Error al cargar el dashboard analítico");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        void cargarDatos();
    }, []);

    const manejarRefrescarSobrecupo = async (): Promise<void> => {
        if (refrescandoSobrecupo) return;
        setRefrescandoSobrecupo(true);
        try {
            const nuevasMetricas = await obtenerMetricasSobrecupo();
            if (nuevasMetricas) {
                setDatos((prev) => (prev ? { ...prev, overbookMetrics: nuevasMetricas } : prev));
                toast.success("Métricas de sobrecupo actualizadas");
            } else {
                toast.info("No se encontraron métricas nuevas de sobrecupo");
            }
        } catch {
            toast.error("No se pudieron actualizar las métricas de sobrecupo");
        } finally {
            setRefrescandoSobrecupo(false);
        }
    };

    const manejarEnviarRecordatorio = (citaId: string, nombrePaciente: string): void => {
        setDatos((prev) => {
            if (!prev) return prev;
            const alertasActualizadas: CitaRiesgoDTO[] = prev.alertasRiesgo.map((item) =>
                item.id === citaId ? { ...item, estadoRecordatorio: "Enviado" } : item
            );
            return { ...prev, alertasRiesgo: alertasActualizadas };
        });
        toast.success(`Recordatorio OMRO enviado a ${nombrePaciente}`);
    };

    const maxValorTendencia = datos
        ? Math.max(...datos.tendencia.map((t) => t.asistidas + t.inasistencias + t.canceladasAnticipadas), 1)
        : 100;

    return (
        <main className="ContenedorPrincipal-DashboardAdmin" aria-label="Dashboard Analítico de Ausentismo">
            {/* Encabezado y Selector de Período */}
            <header className="Header-DashboardAdmin">
                <div className="Header-TitulosDashboard">
                    <h1>Dashboard Analítico y Reducción de Ausentismo</h1>
                    <p>Monitoreo estratégico de asistencia, impacto de recordatorios OMRO y riesgo de inasistencia</p>
                </div>

                <div className="Controles-DashboardAdmin" aria-label="Estado y actualización de métricas">
                    {datos && (
                        <span
                            className={`Badge-OrigenDatos ${datos.esRespaldoMock ? "mock" : "vivo"}`}
                            title={
                                datos.esRespaldoMock
                                    ? "Mostrando datos de respaldo locales por error de conexión"
                                    : "Datos sincronizados desde el servidor"
                            }
                        >
                            {datos.esRespaldoMock ? "Modo respaldo" : "Datos en vivo"}
                        </span>
                    )}
                    <button
                        type="button"
                        className="Btn-RefrescarDash"
                        onClick={() => void cargarDatos()}
                        disabled={cargando}
                    >
                        <FaRedo aria-hidden="true" /> Actualizar
                    </button>
                </div>
            </header>

            {/* Estado de Error */}
            {error && !cargando && (
                <section className="EstadoError-Dashboard" role="alert">
                    <FaExclamationTriangle className="Icono-ErrorDash" />
                    <p>{error}</p>
                    <button type="button" className="Btn-ReintentarDash" onClick={() => void cargarDatos()}>
                        <FaRedo /> Reintentar
                    </button>
                </section>
            )}

            {/* Estado de Carga: Shimmer Skeletons */}
            {cargando && (
                <section className="Grid-KPIs-Dashboard" aria-busy="true" aria-label="Cargando indicadores clave">
                    {[1, 2, 3, 4].map((idx) => (
                        <div key={idx} className="Card-KPI-Skeleton">
                            <div className="Skeleton-Line-Short" />
                            <div className="Skeleton-Line-Big" />
                            <div className="Skeleton-Line-Medium" />
                        </div>
                    ))}
                </section>
            )}

            {!cargando && datos && (
                <>
                    {/* Nivel 1: Tarjetas KPI Ejecutivas */}
                    <section className="Grid-KPIs-Dashboard" aria-label="Indicadores clave de rendimiento">
                        <article className="Card-KPI Card-KPI-Asistencia">
                            <div className="KPI-Header">
                                <span className="KPI-Titulo">Tasa de Asistencia</span>
                                <div className="KPI-Icono-Wrapper verde" aria-hidden="true">
                                    <FaCalendarCheck />
                                </div>
                            </div>
                            <div className="KPI-Valor">{datos.kpis.tasaAsistencia.toFixed(1)}%</div>
                            <div className="KPI-Subtitulo positivo">
                                {datos.kpis.totalCitas.toLocaleString("es-CL")} citas evaluadas
                            </div>
                        </article>

                        <article className="Card-KPI Card-KPI-Ausentismo">
                            <div className="KPI-Header">
                                <span className="KPI-Titulo">Tasa de Ausentismo (No-Show)</span>
                                <div className="KPI-Icono-Wrapper rojo" aria-hidden="true">
                                    <FaUserSlash />
                                </div>
                            </div>
                            <div className="KPI-Valor">{datos.kpis.tasaAusentismo.toFixed(1)}%</div>
                            <div className="KPI-Subtitulo mejora">
                                {datos.kpis.deltaAusentismoVsPeriodoAnterior > 0
                                    ? `+${datos.kpis.deltaAusentismoVsPeriodoAnterior}%`
                                    : `${datos.kpis.deltaAusentismoVsPeriodoAnterior}%`}{" "}
                                vs período anterior
                            </div>
                        </article>

                        <article className="Card-KPI Card-KPI-Rescatadas">
                            <div className="KPI-Header">
                                <span className="KPI-Titulo">Citas Rescatadas (OMRO)</span>
                                <div className="KPI-Icono-Wrapper azul" aria-hidden="true">
                                    <FaBolt />
                                </div>
                            </div>
                            <div className="KPI-Valor">{datos.kpis.citasRescatadasOMRO}</div>
                            <div className="KPI-Subtitulo">
                                Reasignadas antes de quedar vacantes
                            </div>
                        </article>

                        <article className="Card-KPI Card-KPI-Impacto">
                            <div className="KPI-Header">
                                <span className="KPI-Titulo">Horas Box Perdidas</span>
                                <div className="KPI-Icono-Wrapper ambar" aria-hidden="true">
                                    <FaClock />
                                </div>
                            </div>
                            <div className="KPI-Valor">{datos.kpis.horasMedicasPerdidas} hrs</div>
                            <div className="KPI-Subtitulo">
                                Impacto estimado: {formatearMonedaCLP(datos.kpis.impactoEstimadoPerdida)}
                            </div>
                        </article>
                    </section>

                    {/* Nivel 2: Gráficos Principales */}
                    <section className="Grid-Graficos-Principales">
                        {/* Gráfico 1: Tendencia Asistencia vs Inasistencia */}
                        <article className="Panel-Grafico Panel-Tendencia">
                            <div className="Panel-Header">
                                <div>
                                    <h2><FaChartBar aria-hidden="true" /> Evolución de Asistencia vs Ausentismo</h2>
                                    <p>Comparativa de citas asistidas, inasistencias y cancelaciones anticipadas</p>
                                </div>
                                <div className="Leyenda-Inline">
                                    <span><i className="Punto-Leyenda verde" /> Asistidas</span>
                                    <span><i className="Punto-Leyenda rojo" /> Inasistencia</span>
                                    <span><i className="Punto-Leyenda azul" /> Canceladas c/ Aviso</span>
                                </div>
                            </div>

                            {datos.tendencia.length === 0 ? (
                                <div className="EmptyState-Dashboard">
                                    Sin datos de evolución temporal registrados.
                                </div>
                            ) : (
                                <div className="Contenedor-Barras-Tendencia" role="img" aria-label="Gráfico de evolución temporal">
                                    {datos.tendencia.map((item) => {
                                        const pctAsist = (item.asistidas / maxValorTendencia) * 100;
                                        const pctInasist = (item.inasistencias / maxValorTendencia) * 100;
                                        const pctCanc = (item.canceladasAnticipadas / maxValorTendencia) * 100;
                                        return (
                                            <div key={item.periodo} className="Columna-Tendencia">
                                                <div className="Barra-Apilada-Wrapper">
                                                    <div
                                                        className="Segmento-Barra cancelada"
                                                        style={{ height: `${pctCanc}%` }}
                                                        title={`Canceladas con aviso: ${item.canceladasAnticipadas}`}
                                                    />
                                                    <div
                                                        className="Segmento-Barra inasistencia"
                                                        style={{ height: `${pctInasist}%` }}
                                                        title={`Inasistencias (No-Show): ${item.inasistencias}`}
                                                    />
                                                    <div
                                                        className="Segmento-Barra asistida"
                                                        style={{ height: `${pctAsist}%` }}
                                                        title={`Asistidas: ${item.asistidas}`}
                                                    />
                                                </div>
                                                <span className="Label-Periodo-Barra">{item.periodo}</span>
                                                <span className="Badge-Tasa-Mini">{item.tasaAusentismo}% aus.</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </article>

                        {/* Gráfico 2: Donut Chart de Distribución de Estados */}
                        <article className="Panel-Grafico Panel-Donut">
                            <div className="Panel-Header">
                                <div>
                                    <h2><FaChartPie aria-hidden="true" /> Distribución de Citas</h2>
                                    <p>Desglose porcentual del estado final</p>
                                </div>
                            </div>

                            {datos.distribucion.length === 0 ? (
                                <div className="EmptyState-Dashboard">
                                    Sin distribución de estados registrada.
                                </div>
                            ) : (
                                <div className="Contenedor-Donut-Flex">
                                    <svg
                                        viewBox="0 0 180 180"
                                        className="Donut-SVG"
                                        role="img"
                                        aria-label="Gráfico circular de distribución de citas"
                                    >
                                        {(() => {
                                            const radio = 65;
                                            const circunferencia = 2 * Math.PI * radio;
                                            let offsetAcumulado = 0;

                                            return datos.distribucion.map((seg) => {
                                                const longitud = (seg.porcentaje / 100) * circunferencia;
                                                const dashArray = `${longitud} ${circunferencia - longitud}`;
                                                const dashOffset = -offsetAcumulado;
                                                offsetAcumulado += longitud;
                                                const esActivo = estadoActivoDonut === seg.estado;

                                                return (
                                                    <circle
                                                        key={seg.estado}
                                                        cx="90"
                                                        cy="90"
                                                        r={radio}
                                                        fill="transparent"
                                                        stroke={seg.color}
                                                        strokeWidth={esActivo ? 26 : 22}
                                                        strokeDasharray={dashArray}
                                                        strokeDashoffset={dashOffset}
                                                        transform="rotate(-90 90 90)"
                                                        className="Donut-Segmento"
                                                        onMouseEnter={() => setEstadoActivoDonut(seg.estado)}
                                                        onMouseLeave={() => setEstadoActivoDonut(null)}
                                                    />
                                                );
                                            });
                                        })()}
                                        <text x="90" y="86" textAnchor="middle" className="Donut-Texto-Centro-Valor">
                                            {estadoActivoDonut
                                                ? `${datos.distribucion.find((d) => d.estado === estadoActivoDonut)?.porcentaje}%`
                                                : `${datos.kpis.tasaAsistencia}%`}
                                        </text>
                                        <text x="90" y="105" textAnchor="middle" className="Donut-Texto-Centro-Label">
                                            {estadoActivoDonut || "Asistencia"}
                                        </text>
                                    </svg>

                                    <ul className="Lista-Leyenda-Donut">
                                        {datos.distribucion.map((seg) => (
                                            <li
                                                key={seg.estado}
                                                className={`Item-Leyenda-Donut ${estadoActivoDonut === seg.estado ? "resaltado" : ""}`}
                                                onMouseEnter={() => setEstadoActivoDonut(seg.estado)}
                                                onMouseLeave={() => setEstadoActivoDonut(null)}
                                            >
                                                <span className="Color-Box-Donut" style={{ backgroundColor: seg.color }} />
                                                <span className="Estado-Nombre-Donut">{seg.estado}</span>
                                                <strong className="Estado-Pct-Donut">{seg.porcentaje}%</strong>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </article>
                    </section>

                    {/* Nivel 3: Especialidades, Franjas Horarias y Efectividad OMRO */}
                    <section className="Grid-Graficos-Secundarios">
                        {/* Ausentismo por Especialidad */}
                        <article className="Panel-Grafico">
                            <div className="Panel-Header">
                                <div>
                                    <h2>Ausentismo por Especialidad</h2>
                                    <p>Áreas prioritarias para políticas de sobrecupo</p>
                                </div>
                            </div>

                            {datos.porEspecialidad.length === 0 ? (
                                <div className="EmptyState-Dashboard">
                                    Sin métricas por especialidad registradas.
                                </div>
                            ) : (
                                <div className="Lista-Barras-Horizontales">
                                    {datos.porEspecialidad.map((esp) => {
                                        const critico = esp.tasaAusentismo >= 14;
                                        return (
                                            <div key={esp.especialidad} className="Fila-Barra-Horizontal">
                                                <div className="Fila-Barra-Info">
                                                    <span className="Nombre-Esp">{esp.especialidad}</span>
                                                    <span className={`Valor-Esp ${critico ? "critico" : ""}`}>
                                                        {esp.tasaAusentismo.toFixed(1)}% ({esp.inasistencias}/{esp.totalCitas})
                                                    </span>
                                                </div>
                                                <div className="Track-Barra">
                                                    <div
                                                        className={`Fill-Barra ${critico ? "rojo" : "azul"}`}
                                                        style={{ width: `${Math.min(esp.tasaAusentismo * 4, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </article>

                        {/* Ausentismo por Franja Horaria */}
                        <article className="Panel-Grafico">
                            <div className="Panel-Header">
                                <div>
                                    <h2>Horarios Críticos de Inasistencia</h2>
                                    <p>Franjas con mayor probabilidad de no-show</p>
                                </div>
                            </div>

                            {datos.porHorario.length === 0 ? (
                                <div className="EmptyState-Dashboard">
                                    Sin datos de horarios críticos registrados.
                                </div>
                            ) : (
                                <div className="Lista-Barras-Horizontales">
                                    {datos.porHorario.map((hor) => {
                                        const critico = hor.tasaAusentismo >= 15;
                                        return (
                                            <div key={hor.franja} className="Fila-Barra-Horizontal">
                                                <div className="Fila-Barra-Info">
                                                    <span className="Nombre-Esp">{hor.franja}</span>
                                                    <span className={`Valor-Esp ${critico ? "critico" : ""}`}>
                                                        {hor.tasaAusentismo.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="Track-Barra">
                                                    <div
                                                        className={`Fill-Barra ${critico ? "ambar" : "verde"}`}
                                                        style={{ width: `${Math.min(hor.tasaAusentismo * 4, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </article>

                        {/* Efectividad OMRO */}
                        <article className="Panel-Grafico Panel-OMRO">
                            <div className="Panel-Header">
                                <div>
                                    <h2>Efectividad Recordatorios OMRO</h2>
                                    <p>Impacto directo en la asistencia del paciente</p>
                                </div>
                            </div>

                            <div className="Comparativa-OMRO">
                                <div className="Metrica-OMRO">
                                    <div className="Metrica-OMRO-Label">
                                        <span>Con Confirmación OMRO</span>
                                        <strong className="texto-verde">{datos.omro.conRecordatorioAsistencia}%</strong>
                                    </div>
                                    <div className="Track-Barra">
                                        <div
                                            className="Fill-Barra verde"
                                            style={{ width: `${datos.omro.conRecordatorioAsistencia}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="Metrica-OMRO">
                                    <div className="Metrica-OMRO-Label">
                                        <span>Sin Recordatorio Previo</span>
                                        <strong className="texto-rojo">{datos.omro.sinRecordatorioAsistencia}%</strong>
                                    </div>
                                    <div className="Track-Barra">
                                        <div
                                            className="Fill-Barra rojo"
                                            style={{ width: `${datos.omro.sinRecordatorioAsistencia}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="Resumen-OMRO-Stats">
                                    <div>
                                        <span>Enviados</span>
                                        <strong>{datos.omro.recordatoriosEnviados}</strong>
                                    </div>
                                    <div>
                                        <span>Confirmados</span>
                                        <strong>{datos.omro.confirmacionesRecibidas}</strong>
                                    </div>
                                    <div>
                                        <span>Conversión</span>
                                        <strong>
                                            {datos.omro.recordatoriosEnviados > 0
                                                ? Math.round((datos.omro.confirmacionesRecibidas / datos.omro.recordatoriosEnviados) * 100)
                                                : 0}%
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </section>

                    {/* Nivel 3.5: Rendimiento de Sobrecupo y Modo Sombra */}
                    {datos.overbookMetrics && (
                        <section
                            className="Panel-Sobrecupo-Dashboard"
                            aria-label="Rendimiento de Sobrecupo y Modo Sombra"
                        >
                            <div className="Panel-Header">
                                <div>
                                    <h2>Rendimiento de Sobrecupo y Modo Sombra</h2>
                                    <p>Efectividad de cupos adicionales, colisiones y calibración en modo sombra</p>
                                </div>
                                <button
                                    type="button"
                                    className="Btn-RefrescarSobrecupo"
                                    onClick={() => void manejarRefrescarSobrecupo()}
                                    disabled={refrescandoSobrecupo}
                                >
                                    <FaRedo aria-hidden="true" />
                                    {refrescandoSobrecupo ? "Actualizando..." : "Refrescar"}
                                </button>
                            </div>

                            <div className="Grid-Sobrecupo-Metrics">
                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Cupos Rellenados</span>
                                    <strong className="Sobrecupo-Valor texto-azul">
                                        {datos.overbookMetrics.slotRefilled}
                                    </strong>
                                    <span className="Sobrecupo-Sub">Reasignaciones exitosas</span>
                                </article>

                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Sobrecupos (Abiertos / Ocupados)</span>
                                    <strong className="Sobrecupo-Valor">
                                        {datos.overbookMetrics.overbookSlotsOpened} /{" "}
                                        {datos.overbookMetrics.overbookSlotsOccupied}
                                    </strong>
                                    <span className="Sobrecupo-Sub">
                                        {datos.overbookMetrics.overbookSlotsOpened > 0
                                            ? `${Math.round(
                                                  (datos.overbookMetrics.overbookSlotsOccupied /
                                                      datos.overbookMetrics.overbookSlotsOpened) *
                                                      100
                                              )}% ocupación`
                                            : "Sin sobrecupos abiertos"}
                                    </span>
                                </article>

                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Colisiones</span>
                                    <strong
                                        className={`Sobrecupo-Valor ${
                                            datos.overbookMetrics.overbookCollisions > 0
                                                ? "texto-rojo"
                                                : "texto-verde"
                                        }`}
                                    >
                                        {datos.overbookMetrics.overbookCollisions}
                                    </strong>
                                    <span className="Sobrecupo-Sub">Choques de horario detectados</span>
                                </article>

                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Pacientes Desplazados</span>
                                    <strong className="Sobrecupo-Valor">
                                        {datos.overbookMetrics.displacedPatients}
                                    </strong>
                                    <span className="Sobrecupo-Sub">Reubicados por solapamiento</span>
                                </article>

                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Tasa de Falsos Positivos</span>
                                    <strong className="Sobrecupo-Valor texto-ambar">
                                        {datos.overbookMetrics.falsePositiveRate.toFixed(1)}%
                                    </strong>
                                    <span className="Sobrecupo-Sub">Predicciones no confirmadas</span>
                                </article>

                                <article className="Card-Sobrecupo-Metrica">
                                    <span className="Sobrecupo-Label">Evaluaciones Modo Sombra</span>
                                    <strong className="Sobrecupo-Valor">
                                        {datos.overbookMetrics.shadowEvaluatedCount}
                                    </strong>
                                    <span className="Sobrecupo-Sub">
                                        {datos.overbookMetrics.shadowFalsePositivesCount} falsos positivos sombra
                                    </span>
                                </article>
                            </div>
                        </section>
                    )}

                    {/* Nivel 4: Tabla Accionable de Riesgo de Ausentismo */}
                    <section className="Panel-Tabla-Riesgo" aria-label="Citas con riesgo de ausentismo">
                        <div className="Panel-Header">
                            <div>
                                <h2>Citas Próximas con Alto Riesgo de Ausentismo</h2>
                                <p>Acciones preventivas sugeridas para evitar horas médicas ociosas</p>
                            </div>
                        </div>

                        {datos.alertasRiesgo.length === 0 ? (
                            <div className="EmptyState-Dashboard">
                                No hay citas futuras en riesgo alto o medio de inasistencia en este momento.
                            </div>
                        ) : (
                            <div className="Tabla-Responsive-Wrapper">
                                <table className="Tabla-Riesgo">
                                    <thead>
                                        <tr>
                                            <th>Paciente</th>
                                            <th>Especialidad / Médico</th>
                                            <th>Fecha y Hora</th>
                                            <th>Riesgo</th>
                                            <th>Factor Detectado</th>
                                            <th>Estado Aviso</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datos.alertasRiesgo.map((cita) => (
                                            <tr key={cita.id}>
                                                <td>
                                                    <div className="Celda-Paciente">
                                                        <strong>{cita.paciente}</strong>
                                                        <span>{cita.rut}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="Celda-Paciente">
                                                        <strong>{cita.especialidad}</strong>
                                                        <span>{cita.medico}</span>
                                                    </div>
                                                </td>
                                                <td>{cita.fecha} - {cita.hora}</td>
                                                <td>
                                                    <span className={`Badge-Riesgo ${cita.nivelRiesgo.toLowerCase()}`}>
                                                        {cita.nivelRiesgo} ({cita.probabilidadAusentismo}%)
                                                    </span>
                                                </td>
                                                <td className="Celda-Factor">{cita.factorPrincipal}</td>
                                                <td>
                                                    <span className={`Badge-Aviso ${cita.estadoRecordatorio.toLowerCase()}`}>
                                                        {cita.estadoRecordatorio}
                                                    </span>
                                                </td>
                                                <td>
                                                    {cita.estadoRecordatorio === "Pendiente" ? (
                                                        <button
                                                            type="button"
                                                            className="Btn-Accion-OMRO"
                                                            onClick={() => manejarEnviarRecordatorio(cita.id, cita.paciente)}
                                                        >
                                                            <FaBell aria-hidden="true" /> Enviar OMRO
                                                        </button>
                                                    ) : (
                                                        <span className="Texto-Gestionado">
                                                            <FaCheckCircle aria-hidden="true" /> Gestionado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}

export default DashboardAdministrador;
