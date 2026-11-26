import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaCalendarCheck,
    FaClock,
    FaExclamationCircle,
    FaHospital,
    FaStethoscope
} from 'react-icons/fa';
import {
    esPublicApiError,
    getRescheduleOptionsByToken,
    previewAppointmentAction,
    rescheduleAppointmentByToken,
    type PublicActionPreviewDto,
    type PublicRescheduleOptionsDto,
    type PublicRescheduleSlotDto
} from '../../Services/publicActionsService.ts';
import './PublicActions.css';

type EstadoVista = 'cargando' | 'listo' | 'exito' | 'error';

function RescheduleAppointmentPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';

    const [estado, setEstado] = useState<EstadoVista>(token ? 'cargando' : 'error');
    const [preview, setPreview] = useState<PublicActionPreviewDto | null>(null);
    const [opciones, setOpciones] = useState<PublicRescheduleOptionsDto | null>(null);
    const [slotSeleccionado, setSlotSeleccionado] = useState<PublicRescheduleSlotDto | null>(null);
    const [motivo, setMotivo] = useState<string>('');
    const [mensajeError, setMensajeError] = useState<string>(
        token ? '' : 'El enlace de reagendamiento no contiene un token válido.'
    );
    const [mensajeExito, setMensajeExito] = useState<string>('');
    const [procesando, setProcesando] = useState<boolean>(false);

    useEffect(() => {
        if (!token) return;

        let activo = true;
        const cargarDatos = async (): Promise<void> => {
            try {
                const [resPreview, resOpciones] = await Promise.all([
                    previewAppointmentAction(token).catch(() => null),
                    getRescheduleOptionsByToken(token)
                ]);
                if (!activo) return;
                setPreview(resPreview);
                setOpciones(resOpciones);
                setEstado('listo');
            } catch (err: unknown) {
                if (!activo) return;
                if (esPublicApiError(err) && err.status === 410) {
                    setMensajeError(
                        err.message || 'Este enlace de reagendamiento ya expiró o fue utilizado.'
                    );
                } else if (err instanceof Error && err.message) {
                    setMensajeError(err.message);
                } else {
                    setMensajeError('No se pudieron cargar los horarios disponibles para reagendar.');
                }
                setEstado('error');
            }
        };

        void cargarDatos();
        return () => {
            activo = false;
        };
    }, [token]);

    const confirmarReagendamiento = async (): Promise<void> => {
        if (!token || !slotSeleccionado || procesando) return;
        setProcesando(true);
        try {
            const res = await rescheduleAppointmentByToken(
                token,
                slotSeleccionado.scheduleBlockId,
                motivo
            );
            setMensajeExito(
                res.message ||
                    `Tu cita fue reagendada para el ${slotSeleccionado.dateLocal} a las ${slotSeleccionado.timeLocal}.`
            );
            setEstado('exito');
        } catch (err: unknown) {
            const msg =
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo completar el reagendamiento.';
            setMensajeError(msg);
            setEstado('error');
        } finally {
            setProcesando(false);
        }
    };

    const clinicName = preview?.clinicName || opciones?.clinicName || 'Centro Médico';
    const specialty = preview?.specialty || opciones?.specialty || 'Consulta Médica';

    return (
        <main className="PublicPage-Container">
            <section className="PublicPage-Card" aria-label="Reagendar cita médica">
                <header className="PublicPage-Header">
                    <span className="PublicPage-Brand">MedCareAI · Reagendamiento</span>
                    <h1>Elige un Nuevo Horario</h1>
                    <p>Selecciona uno de los bloques disponibles para reprogramar tu atención.</p>
                </header>

                <div className="PublicPage-Body">
                    {estado === 'cargando' && (
                        <div className="PublicState-Box" aria-busy="true">
                            <div className="PublicSkeleton-Line" />
                            <div className="PublicSkeleton-Line short" />
                            <div className="PublicSkeleton-Line" />
                        </div>
                    )}

                    {estado === 'error' && (
                        <div className="PublicState-Box" role="alert">
                            <FaExclamationCircle className="PublicState-Icon error" aria-hidden="true" />
                            <h2>No fue posible reagendar</h2>
                            <p>{mensajeError}</p>
                        </div>
                    )}

                    {estado === 'exito' && (
                        <div className="PublicState-Box" role="status">
                            <FaCalendarCheck className="PublicState-Icon success" aria-hidden="true" />
                            <h2>¡Cita Reagendada!</h2>
                            <p>{mensajeExito}</p>
                            {slotSeleccionado && (
                                <div className="PublicSummary-Box" style={{ width: '100%' }}>
                                    <div className="PublicSummary-Row">
                                        <FaHospital className="PublicSummary-Icon" aria-hidden="true" />
                                        <span>
                                            Centro: <strong>{clinicName}</strong>
                                        </span>
                                    </div>
                                    <div className="PublicSummary-Row">
                                        <FaCalendarAlt className="PublicSummary-Icon" aria-hidden="true" />
                                        <span>
                                            Nueva fecha: <strong>{slotSeleccionado.dateLocal}</strong> ·{' '}
                                            <strong>{slotSeleccionado.timeLocal}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {estado === 'listo' && (
                        <>
                            <div className="PublicSummary-Box">
                                <div className="PublicSummary-Row">
                                    <FaHospital className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Centro: <strong>{clinicName}</strong>
                                    </span>
                                </div>
                                <div className="PublicSummary-Row">
                                    <FaStethoscope className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Especialidad: <strong>{specialty}</strong>
                                    </span>
                                </div>
                                {(preview?.appointmentDateLocal || opciones?.currentDateLocal) && (
                                    <div className="PublicSummary-Row">
                                        <FaClock className="PublicSummary-Icon" aria-hidden="true" />
                                        <span>
                                            Cita actual:{' '}
                                            <strong>
                                                {preview?.appointmentDateLocal || opciones?.currentDateLocal}
                                            </strong>{' '}
                                            ·{' '}
                                            <strong>
                                                {preview?.appointmentTimeLocal || opciones?.currentTimeLocal}
                                            </strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {!opciones || opciones.slots.length === 0 ? (
                                <div className="PublicState-Box">
                                    <FaExclamationCircle
                                        className="PublicState-Icon warning"
                                        aria-hidden="true"
                                    />
                                    <h2>Sin horarios disponibles</h2>
                                    <p>
                                        No encontramos bloques disponibles en este momento para reagendar tu
                                        cita.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="PublicSlots-Grid" role="listbox" aria-label="Horarios disponibles">
                                        {opciones.slots.map((slot) => {
                                            const activo =
                                                slotSeleccionado?.scheduleBlockId === slot.scheduleBlockId;
                                            return (
                                                <button
                                                    key={slot.scheduleBlockId}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={activo}
                                                    className={`PublicSlot-Card ${activo ? 'seleccionado' : ''}`}
                                                    onClick={() => setSlotSeleccionado(slot)}
                                                >
                                                    <span className="PublicSlot-FechaHora">
                                                        {slot.dateLocal} · {slot.timeLocal}
                                                    </span>
                                                    <span className="PublicSlot-Meta">
                                                        {slot.staffName} · {slot.boxName}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <label className="PublicInput-Group">
                                        Motivo del cambio (opcional):
                                        <input
                                            type="text"
                                            className="PublicInput-Text"
                                            placeholder="Ej. Conflicto de horario laboral"
                                            value={motivo}
                                            onChange={(e) => setMotivo(e.target.value)}
                                            disabled={procesando}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="PublicBtn PublicBtn-Primary"
                                        disabled={!slotSeleccionado || procesando}
                                        onClick={() => void confirmarReagendamiento()}
                                    >
                                        <FaCalendarCheck aria-hidden="true" />
                                        {procesando ? 'Reagendando...' : 'Confirmar Nuevo Horario'}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>

                <footer className="PublicPage-Footer">
                    Reagendamiento directo sin contraseña · MedCareAI
                </footer>
            </section>
        </main>
    );
}

export default RescheduleAppointmentPage;
