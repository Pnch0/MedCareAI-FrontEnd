import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaCalendarCheck,
    FaClock,
    FaExclamationCircle,
    FaHospital,
    FaStethoscope,
    FaTimesCircle
} from 'react-icons/fa';
import {
    confirmAppointmentByToken,
    declineAppointmentByToken,
    esPublicApiError,
    previewAppointmentAction,
    type PublicActionPreviewDto
} from '../../Services/publicActionsService.ts';
import './PublicActions.css';

type EstadoVista = 'cargando' | 'listo' | 'exito' | 'error';

function RespondAppointmentPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';
    const actionParam = searchParams.get('action')?.trim().toLowerCase() || '';

    const [estado, setEstado] = useState<EstadoVista>(token ? 'cargando' : 'error');
    const [preview, setPreview] = useState<PublicActionPreviewDto | null>(null);
    const [mensajeError, setMensajeError] = useState<string>(
        token ? '' : 'El enlace no contiene un token válido.'
    );
    const [mensajeExito, setMensajeExito] = useState<string>('');
    const [accionCompletada, setAccionCompletada] = useState<'confirm' | 'decline' | null>(null);
    const [procesando, setProcesando] = useState<boolean>(false);
    const [motivoDecline, setMotivoDecline] = useState<string>('');

    useEffect(() => {
        if (!token) return;

        let activo = true;
        const cargarPreview = async (): Promise<void> => {
            try {
                const data = await previewAppointmentAction(token);
                if (!activo) return;
                setPreview(data);
                setEstado('listo');
            } catch (err: unknown) {
                if (!activo) return;
                if (esPublicApiError(err) && err.status === 410) {
                    setMensajeError(
                        err.message || 'Este enlace ya expiró, fue utilizado o la cita ya no está disponible.'
                    );
                } else if (err instanceof Error && err.message) {
                    setMensajeError(err.message);
                } else {
                    setMensajeError('No se pudo validar el enlace de la cita.');
                }
                setEstado('error');
            }
        };

        void cargarPreview();
        return () => {
            activo = false;
        };
    }, [token]);

    const manejarConfirmar = async (): Promise<void> => {
        if (!token || procesando) return;
        setProcesando(true);
        try {
            const res = await confirmAppointmentByToken(token);
            setAccionCompletada('confirm');
            setMensajeExito(res.message || 'Tu asistencia ha sido confirmada exitosamente.');
            setEstado('exito');
        } catch (err: unknown) {
            setMensajeError(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo confirmar la cita.'
            );
            setEstado('error');
        } finally {
            setProcesando(false);
        }
    };

    const manejarRechazar = async (): Promise<void> => {
        if (!token || procesando) return;
        setProcesando(true);
        try {
            const res = await declineAppointmentByToken(token, motivoDecline);
            setAccionCompletada('decline');
            setMensajeExito(
                res.message || 'Hemos registrado que no podrás asistir. El cupo será liberado.'
            );
            setEstado('exito');
        } catch (err: unknown) {
            setMensajeError(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo registrar la declinación de la cita.'
            );
            setEstado('error');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <main className="PublicPage-Container">
            <section className="PublicPage-Card" aria-label="Responder invitación de cita">
                <header className="PublicPage-Header">
                    <span className="PublicPage-Brand">MedCareAI · Gestión de Citas</span>
                    <h1>Confirmación de Cita Médica</h1>
                    <p>Revisa los datos operativos de tu cita y selecciona una opción.</p>
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
                            <h2>Enlace no disponible</h2>
                            <p>{mensajeError}</p>
                        </div>
                    )}

                    {estado === 'exito' && (
                        <div className="PublicState-Box" role="status">
                            {accionCompletada === 'confirm' ? (
                                <FaCalendarCheck className="PublicState-Icon success" aria-hidden="true" />
                            ) : (
                                <FaTimesCircle className="PublicState-Icon warning" aria-hidden="true" />
                            )}
                            <h2>
                                {accionCompletada === 'confirm'
                                    ? '¡Cita Confirmada!'
                                    : 'Cita Declinada'}
                            </h2>
                            <p>{mensajeExito}</p>
                            {preview && (
                                <div className="PublicSummary-Box" style={{ width: '100%' }}>
                                    <div className="PublicSummary-Row">
                                        <FaHospital className="PublicSummary-Icon" aria-hidden="true" />
                                        <span>
                                            Centro: <strong>{preview.clinicName}</strong>
                                        </span>
                                    </div>
                                    <div className="PublicSummary-Row">
                                        <FaCalendarAlt className="PublicSummary-Icon" aria-hidden="true" />
                                        <span>
                                            Fecha: <strong>{preview.appointmentDateLocal}</strong> ·{' '}
                                            <strong>{preview.appointmentTimeLocal}</strong>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {estado === 'listo' && preview && (
                        <>
                            <div className="PublicSummary-Box">
                                <div className="PublicSummary-Row">
                                    <FaHospital className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Centro: <strong>{preview.clinicName}</strong>
                                    </span>
                                </div>
                                <div className="PublicSummary-Row">
                                    <FaStethoscope className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Especialidad: <strong>{preview.specialty}</strong>
                                    </span>
                                </div>
                                <div className="PublicSummary-Row">
                                    <FaCalendarAlt className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Fecha: <strong>{preview.appointmentDateLocal}</strong>
                                    </span>
                                </div>
                                <div className="PublicSummary-Row">
                                    <FaClock className="PublicSummary-Icon" aria-hidden="true" />
                                    <span>
                                        Hora: <strong>{preview.appointmentTimeLocal}</strong>
                                    </span>
                                </div>
                            </div>

                            {actionParam === 'cancel' || actionParam === 'decline' ? (
                                <label className="PublicInput-Group">
                                    Motivo (opcional):
                                    <input
                                        type="text"
                                        className="PublicInput-Text"
                                        placeholder="Ej. Imprevisto personal o cambio de horario"
                                        value={motivoDecline}
                                        onChange={(e) => setMotivoDecline(e.target.value)}
                                        disabled={procesando}
                                    />
                                </label>
                            ) : null}

                            <div className="PublicActions-Stack">
                                <button
                                    type="button"
                                    className="PublicBtn PublicBtn-Confirm"
                                    onClick={() => void manejarConfirmar()}
                                    disabled={procesando}
                                >
                                    <FaCalendarCheck aria-hidden="true" />
                                    {procesando ? 'Procesando...' : 'Confirmar Asistencia'}
                                </button>

                                <Link
                                    to={`/appointments/reschedule?token=${encodeURIComponent(token)}`}
                                    className="PublicBtn PublicBtn-SecondaryLink"
                                >
                                    <FaClock aria-hidden="true" />
                                    Reagendar otro horario
                                </Link>

                                <button
                                    type="button"
                                    className="PublicBtn PublicBtn-Decline"
                                    onClick={() => void manejarRechazar()}
                                    disabled={procesando}
                                >
                                    <FaTimesCircle aria-hidden="true" />
                                    No podré asistir
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <footer className="PublicPage-Footer">
                    Enlace seguro de un solo uso · MedCareAI
                </footer>
            </section>
        </main>
    );
}

export default RespondAppointmentPage;
