import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    FaChartLine,
    FaCheckCircle,
    FaExclamationTriangle,
    FaEyeSlash,
    FaFlask,
    FaHistory,
    FaRedo,
    FaShieldAlt
} from 'react-icons/fa';
import {
    actualizarAutoOverbook,
    generarEvaluacionSintetica,
    obtenerOverbookAuditLogs,
    obtenerOverbookReadiness,
    type OverbookAutonomyReadiness,
    type OverbookPolicyAuditLogItem
} from '../../../Services/overbookAutonomyService.ts';
import './AutonomiaSobrecupo.css';

function formatearFechaHora(isoStr: string): string {
    if (!isoStr) return 'Sin fecha';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}-${mes}-${anio} ${hora}:${min}`;
}

function AutonomiaSobrecupo() {
    const [readiness, setReadiness] = useState<OverbookAutonomyReadiness | null>(null);
    const [auditLogs, setAuditLogs] = useState<OverbookPolicyAuditLogItem[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [motivo, setMotivo] = useState<string>('');
    const [allowDemoOverride, setAllowDemoOverride] = useState<boolean>(false);
    const [confirmacionAbierta, setConfirmacionAbierta] = useState<boolean>(false);
    const [procesandoCambio, setProcesandoCambio] = useState<boolean>(false);
    const [generandoDemo, setGenerandoDemo] = useState<boolean>(false);

    const cargarEstadoYAuditoria = useCallback(async (): Promise<void> => {
        setCargando(true);
        setError(null);
        try {
            const [resReadiness, resAudit] = await Promise.all([
                obtenerOverbookReadiness(),
                obtenerOverbookAuditLogs()
            ]);
            setReadiness(resReadiness);
            setAuditLogs(resAudit);
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo obtener el estado de autonomía de sobrecupo.';
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let activo = true;
        const iniciar = async (): Promise<void> => {
            try {
                const [resReadiness, resAudit] = await Promise.all([
                    obtenerOverbookReadiness(),
                    obtenerOverbookAuditLogs()
                ]);
                if (!activo) return;
                setReadiness(resReadiness);
                setAuditLogs(resAudit);
            } catch (err: unknown) {
                if (!activo) return;
                const mensaje =
                    err instanceof Error && err.message
                        ? err.message
                        : 'No se pudo obtener el estado de autonomía de sobrecupo.';
                setError(mensaje);
            } finally {
                if (activo) setCargando(false);
            }
        };

        void iniciar();
        return () => {
            activo = false;
        };
    }, []);

    const abrirConfirmacionToggle = (): void => {
        if (!readiness) return;
        if (motivo.trim().length === 0) {
            toast.warning('Debes ingresar un motivo de auditoría antes de cambiar el modo.');
            return;
        }
        setConfirmacionAbierta(true);
    };

    const confirmarCambioAutonomia = async (): Promise<void> => {
        if (!readiness || procesandoCambio) return;
        const nuevoEstado = !readiness.autoOverbookEnabled;

        setProcesandoCambio(true);
        try {
            await actualizarAutoOverbook({
                tenantId: readiness.tenantId,
                enabled: nuevoEstado,
                reason: motivo.trim(),
                allowDemoOverride
            });

            toast.success(
                nuevoEstado
                    ? 'Sobrecupo autónomo habilitado correctamente.'
                    : 'Modo Sombra reactivado correctamente.'
            );
            setMotivo('');
            setAllowDemoOverride(false);
            setConfirmacionAbierta(false);
            await cargarEstadoYAuditoria();
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo actualizar la configuración de autonomía.';
            toast.error(mensaje);
        } finally {
            setProcesandoCambio(false);
        }
    };

    const manejarGenerarDemo = async (): Promise<void> => {
        if (generandoDemo) return;
        setGenerandoDemo(true);
        try {
            const res = await generarEvaluacionSintetica({
                tenantId: readiness?.tenantId ?? null,
                sampleSize: 220
            });
            toast.success(`Se generaron ${res.seededCount} evaluaciones sintéticas en Modo Sombra.`);
            await cargarEstadoYAuditoria();
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : 'Error al generar evaluaciones sintéticas.';
            toast.error(mensaje);
        } finally {
            setGenerandoDemo(false);
        }
    };

    const progresoPorcentaje = readiness
        ? Math.min(
              100,
              Math.round(
                  (readiness.evaluatedWouldOverbookCount / readiness.minimumRequiredEvaluations) * 100
              )
          )
        : 0;

    return (
        <main
            className="ContenedorPrincipal-Autonomia"
            aria-label="Panel de Modo Sombra y Autonomía de Sobrecupo"
        >
            {/* Header */}
            <header className="Header-Autonomia">
                <div className="Header-TitulosAutonomia">
                    <h1>Modo Sombra y Autonomía de Sobrecupo</h1>
                    <p>
                        Control estadístico (Intervalo de Confianza Wilson 95%) previo a habilitar sobrecupo
                        automático
                    </p>
                </div>

                <div className="Header-AccionesAutonomia">
                    {readiness && (
                        <span
                            className={`Badge-ModoAutonomia ${
                                readiness.autoOverbookEnabled ? 'autonomo' : 'sombra'
                            }`}
                        >
                            {readiness.autoOverbookEnabled ? (
                                <>
                                    <FaShieldAlt aria-hidden="true" />
                                    Sobrecupo Autónomo Habilitado
                                </>
                            ) : (
                                <>
                                    <FaEyeSlash aria-hidden="true" />
                                    Modo Sombra Activo
                                </>
                            )}
                        </span>
                    )}

                    <button
                        type="button"
                        className="Btn-SecundarioAutonomia demo"
                        onClick={() => void manejarGenerarDemo()}
                        disabled={generandoDemo || cargando}
                        title="Genera evaluaciones sintéticas en el backend para demostración"
                    >
                        <FaFlask aria-hidden="true" />
                        {generandoDemo ? 'Generando...' : 'Generar Evaluación Sintética (Demo)'}
                    </button>

                    <button
                        type="button"
                        className="Btn-SecundarioAutonomia"
                        onClick={() => void cargarEstadoYAuditoria()}
                        disabled={cargando}
                    >
                        <FaRedo aria-hidden="true" /> Actualizar
                    </button>
                </div>
            </header>

            {/* Error */}
            {error && !cargando && (
                <section className="EstadoError-Autonomia" role="alert">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="Btn-SecundarioAutonomia"
                        onClick={() => void cargarEstadoYAuditoria()}
                    >
                        <FaRedo aria-hidden="true" /> Reintentar
                    </button>
                </section>
            )}

            {/* Loading Skeletons */}
            {cargando && (
                <section className="Grid-KPIs-Autonomia" aria-busy="true">
                    {[1, 2, 3].map((idx) => (
                        <div key={idx} className="Skeleton-Autonomia" />
                    ))}
                </section>
            )}

            {/* Contenido principal */}
            {!cargando && readiness && (
                <>
                    {/* KPI Cards + Barra de Madurez */}
                    <section className="Grid-KPIs-Autonomia" aria-label="Indicadores de madurez estadística">
                        <article className="Card-KPI-Autonomia">
                            <div className="KPI-Header-Autonomia">
                                <span>Evaluaciones en Modo Sombra</span>
                                <FaChartLine aria-hidden="true" />
                            </div>
                            <div className="KPI-Valor-Autonomia azul">
                                {readiness.evaluatedWouldOverbookCount} /{' '}
                                {readiness.minimumRequiredEvaluations}
                            </div>
                            <div
                                className="Track-Progreso-Autonomia"
                                role="progressbar"
                                aria-valuenow={progresoPorcentaje}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            >
                                <div
                                    className={`Fill-Progreso-Autonomia ${
                                        progresoPorcentaje >= 100 ? 'completo' : ''
                                    }`}
                                    style={{ width: `${progresoPorcentaje}%` }}
                                />
                            </div>
                            <span className="KPI-Sub-Autonomia">
                                {progresoPorcentaje}% de la muestra mínima requerida
                            </span>
                        </article>

                        <article className="Card-KPI-Autonomia">
                            <div className="KPI-Header-Autonomia">
                                <span>Tasa de Falsos Positivos</span>
                            </div>
                            <div
                                className={`KPI-Valor-Autonomia ${
                                    readiness.falsePositiveRate < readiness.maxFalsePositiveRate
                                        ? 'verde'
                                        : 'rojo'
                                }`}
                            >
                                {readiness.falsePositiveRate.toFixed(1)}%
                            </div>
                            <span className="KPI-Sub-Autonomia">
                                Umbral máximo permitido: &lt; {readiness.maxFalsePositiveRate}% (
                                {readiness.falsePositiveCount} falsos positivos)
                            </span>
                        </article>

                        <article className="Card-KPI-Autonomia destacada">
                            <div className="KPI-Header-Autonomia">
                                <span>Cota Superior de Error (Wilson 95%)</span>
                                <FaShieldAlt aria-hidden="true" />
                            </div>
                            <div
                                className={`KPI-Valor-Autonomia ${
                                    readiness.wilsonUpperBound95 <= readiness.maxFalsePositiveRate
                                        ? 'verde'
                                        : 'rojo'
                                }`}
                            >
                                {readiness.wilsonUpperBound95.toFixed(1)}%
                            </div>
                            <span className="KPI-Sub-Autonomia">
                                Peor escenario estadístico estimado
                            </span>
                        </article>
                    </section>

                    {/* Bloqueos y Control de Activación */}
                    <section className="Grid-Control-Autonomia">
                        <article className="Panel-Autonomia" aria-label="Criterios y bloqueos activos">
                            <h2>
                                <FaExclamationTriangle aria-hidden="true" />
                                Evaluación del Autonomy Gate
                            </h2>
                            <p className="Panel-Subtitulo">
                                Antes de permitir sobrecupo automático, el motor verifica el tamaño muestral
                                mínimo (200) y la tasa de falsos positivos (&lt; 15%), auditando la cota
                                superior de Wilson al 95%.
                            </p>

                            {readiness.blockingReasons.length > 0 ? (
                                <div className="Caja-Bloqueos" role="status">
                                    <div className="Caja-Bloqueos-Titulo">
                                        <FaExclamationTriangle aria-hidden="true" />
                                        Bloqueos activos ({readiness.blockingReasons.length})
                                    </div>
                                    <ul className="Lista-Bloqueos">
                                        {readiness.blockingReasons.map((motivoBloqueo, index) => (
                                            <li key={index}>{motivoBloqueo}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="Caja-Listo" role="status">
                                    <FaCheckCircle aria-hidden="true" />
                                    El tenant cumple todos los criterios estadísticos para operar en modo
                                    autónomo.
                                </div>
                            )}
                        </article>

                        <article className="Panel-Autonomia" aria-label="Control de activación auditado">
                            <h2>
                                <FaShieldAlt aria-hidden="true" />
                                Control de Política de Sobrecupo
                            </h2>
                            <p className="Panel-Subtitulo">
                                Todo cambio queda registrado en la bitácora de auditoría con usuario
                                responsable y justificación obligatoria.
                            </p>

                            <div className="Control-Form-Autonomia">
                                <label className="Control-Label-Autonomia">
                                    Motivo del cambio (obligatorio):
                                    <textarea
                                        className="Textarea-Motivo-Autonomia"
                                        placeholder="Ej. Muestra supera las 200 evaluaciones con Wilson 95% bajo el umbral..."
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        disabled={procesandoCambio}
                                    />
                                </label>

                                {!readiness.autoOverbookEnabled && readiness.blockingReasons.length > 0 && (
                                    <label className="Checkbox-Override-Autonomia">
                                        <input
                                            type="checkbox"
                                            checked={allowDemoOverride}
                                            onChange={(e) => setAllowDemoOverride(e.target.checked)}
                                            disabled={procesandoCambio}
                                        />
                                        Permitir activación forzada (Modo Demo)
                                    </label>
                                )}

                                <div className="Control-Botones-Autonomia">
                                    <button
                                        type="button"
                                        className={`Btn-Toggle-Autonomia ${
                                            readiness.autoOverbookEnabled ? 'desactivar' : 'activar'
                                        }`}
                                        onClick={abrirConfirmacionToggle}
                                        disabled={procesandoCambio}
                                    >
                                        {readiness.autoOverbookEnabled
                                            ? 'Volver a Modo Sombra (Desactivar)'
                                            : 'Habilitar Sobrecupo Autónomo'}
                                    </button>
                                </div>
                            </div>
                        </article>
                    </section>

                    {/* Tabla de Auditoría */}
                    <section className="Panel-Autonomia" aria-label="Historial de auditoría">
                        <h2>
                            <FaHistory aria-hidden="true" />
                            Historial de Auditoría de Política
                        </h2>

                        {auditLogs.length === 0 ? (
                            <div className="EmptyState-Audit">
                                No hay cambios registrados en la bitácora de auditoría para este tenant.
                            </div>
                        ) : (
                            <div className="Tabla-Audit-Wrapper">
                                <table className="Tabla-Audit">
                                    <thead>
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Responsable</th>
                                            <th>Cambio Aplicado</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>{formatearFechaHora(log.createdAtIso)}</td>
                                                <td>{log.actorLabel}</td>
                                                <td>
                                                    <span
                                                        className={`Badge-Cambio-Audit ${
                                                            log.newEnabled ? 'on' : 'off'
                                                        }`}
                                                    >
                                                        {log.newEnabled
                                                            ? 'Autónomo Activado'
                                                            : 'Modo Sombra Activado'}
                                                    </span>
                                                </td>
                                                <td>{log.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* Modal de Confirmación */}
            {confirmacionAbierta && readiness && (
                <div
                    className="ModalAutonomia-Backdrop"
                    role="presentation"
                    onClick={() => !procesandoCambio && setConfirmacionAbierta(false)}
                >
                    <div
                        className="ModalAutonomia-Card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-confirmacion-autonomia-titulo"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="modal-confirmacion-autonomia-titulo">
                            {readiness.autoOverbookEnabled
                                ? '¿Desactivar Sobrecupo Autónomo?'
                                : '¿Habilitar Sobrecupo Autónomo?'}
                        </h3>
                        <p>
                            {readiness.autoOverbookEnabled
                                ? 'El motor volverá a operar en Modo Sombra sin ejecutar sobrecupos automáticos.'
                                : 'El motor podrá ejecutar sobrecupos automáticos según las reglas aprobadas.'}
                        </p>
                        <p>
                            <strong>Motivo registrado:</strong> {motivo.trim()}
                        </p>
                        <div className="ModalAutonomia-Actions">
                            <button
                                type="button"
                                className="Btn-SecundarioAutonomia"
                                onClick={() => setConfirmacionAbierta(false)}
                                disabled={procesandoCambio}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={`Btn-Toggle-Autonomia ${
                                    readiness.autoOverbookEnabled ? 'desactivar' : 'activar'
                                }`}
                                onClick={() => void confirmarCambioAutonomia()}
                                disabled={procesandoCambio}
                            >
                                {procesandoCambio ? 'Aplicando...' : 'Confirmar Cambio'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default AutonomiaSobrecupo;
