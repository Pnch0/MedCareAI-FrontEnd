import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    acceptWaitingListOfferByToken,
    declineWaitingListOfferByToken,
    esPublicApiError,
    previewWaitingListOffer,
    type PublicWaitingListOfferPreviewDto
} from '../../Services/publicActionsService.ts';
import './PublicActions.css';

type EstadoVista = 'cargando' | 'listo' | 'exito' | 'error';

function calcularCuentaRegresiva(expiresAtIso: string): { texto: string; expirada: boolean } {
    if (!expiresAtIso) return { texto: 'Oferta por tiempo limitado', expirada: false };
    const exp = new Date(expiresAtIso).getTime();
    if (Number.isNaN(exp)) return { texto: `Expira: ${expiresAtIso}`, expirada: false };

    const diffMs = exp - Date.now();
    if (diffMs <= 0) {
        return { texto: 'Oferta expirada', expirada: true };
    }

    const totalSeg = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSeg / 3600);
    const minutos = Math.floor((totalSeg % 3600) / 60);
    const segundos = totalSeg % 60;

    const hh = String(horas).padStart(2, '0');
    const mm = String(minutos).padStart(2, '0');
    const ss = String(segundos).padStart(2, '0');

    return {
        texto: horas > 0 ? `Expira en ${hh}:${mm}:${ss}` : `Expira en ${mm}:${ss}`,
        expirada: false
    };
}

function RespondWaitingListOfferPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';

    const [estado, setEstado] = useState<EstadoVista>(token ? 'cargando' : 'error');
    const [preview, setPreview] = useState<PublicWaitingListOfferPreviewDto | null>(null);
    const [mensajeError, setMensajeError] = useState<string>(
        token ? '' : 'El enlace de oferta no contiene un token válido.'
    );
    const [mensajeExito, setMensajeExito] = useState<string>('');
    const [accionCompletada, setAccionCompletada] = useState<'accept' | 'decline' | null>(null);
    const [procesando, setProcesando] = useState<boolean>(false);
    const [cuenta, setCuenta] = useState<{ texto: string; expirada: boolean }>({
        texto: '',
        expirada: false
    });

    useEffect(() => {
        if (!token) return;

        let activo = true;
        const cargarOferta = async (): Promise<void> => {
            try {
                const data = await previewWaitingListOffer(token);
                if (!activo) return;
                setPreview(data);
                setCuenta(calcularCuentaRegresiva(data.expiresAt));
                setEstado('listo');
            } catch (err: unknown) {
                if (!activo) return;
                if (esPublicApiError(err) && err.status === 410) {
                    setMensajeError(
                        err.message ||
                            'La oferta ya expiró, fue aceptada por otro paciente o ya no está disponible.'
                    );
                } else if (err instanceof Error && err.message) {
                    setMensajeError(err.message);
                } else {
                    setMensajeError('No se pudo validar la oferta de lista de espera.');
                }
                setEstado('error');
            }
        };

        void cargarOferta();
        return () => {
            activo = false;
        };
    }, [token]);

    useEffect(() => {
        if (estado !== 'listo' || !preview?.expiresAt) return;

        const timer = window.setInterval(() => {
            setCuenta(calcularCuentaRegresiva(preview.expiresAt));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [estado, preview?.expiresAt]);

    const manejarAceptar = async (): Promise<void> => {
        if (!token || procesando || cuenta.expirada) return;
        setProcesando(true);
        try {
            const res = await acceptWaitingListOfferByToken(token);
            setAccionCompletada('accept');
            setMensajeExito(
                res.message || '¡Cupo adelantado asignado! Tu nueva cita ha quedado confirmada.'
            );
            setEstado('exito');
        } catch (err: unknown) {
            setMensajeError(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo aceptar el cupo. Es posible que ya haya sido tomado.'
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
            const res = await declineWaitingListOfferByToken(token);
            setAccionCompletada('decline');
            setMensajeExito(
                res.message || 'Oferta rechazada. Seguirás en lista de espera según disponibilidad.'
            );
            setEstado('exito');
        } catch (err: unknown) {
            setMensajeError(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo registrar el rechazo de la oferta.'
            );
            setEstado('error');
        } finally {
            setProcesando(false);
        }
    };

    return (
        <main className="PublicPage-Container">
            <section className="PublicPage-Card" aria-label="Responder oferta de lista de espera">
                <header className="PublicPage-Header">
                    <span className="PublicPage-Brand">MedCareAI · Lista de Espera</span>
                    <h1>Cupo Adelantado Disponible</h1>
                    <p>Se ha liberado una hora médica antes de tu fecha original.</p>
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
                            <h2>Oferta no disponible</h2>
                            <p>{mensajeError}</p>
                        </div>
                    )}

                    {estado === 'exito' && (
                        <div className="PublicState-Box" role="status">
                            {accionCompletada === 'accept' ? (
                                <FaCalendarCheck className="PublicState-Icon success" aria-hidden="true" />
                            ) : (
                                <FaTimesCircle className="PublicState-Icon warning" aria-hidden="true" />
                            )}
                            <h2>
                                {accionCompletada === 'accept'
                                    ? '¡Cupo Aceptado!'
                                    : 'Oferta Rechazada'}
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
                            {cuenta.texto && (
                                <div
                                    className={`PublicCountdown-Banner ${
                                        cuenta.expirada ? 'expirada' : ''
                                    }`}
                                    role="timer"
                                >
                                    <span>
                                        <FaClock aria-hidden="true" /> {cuenta.texto}
                                    </span>
                                </div>
                            )}

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

                            <div className="PublicActions-Stack">
                                <button
                                    type="button"
                                    className="PublicBtn PublicBtn-Confirm"
                                    onClick={() => void manejarAceptar()}
                                    disabled={procesando || cuenta.expirada}
                                >
                                    <FaCalendarCheck aria-hidden="true" />
                                    {procesando ? 'Asignando cupo...' : 'Aceptar Cupo'}
                                </button>

                                <button
                                    type="button"
                                    className="PublicBtn PublicBtn-Decline"
                                    onClick={() => void manejarRechazar()}
                                    disabled={procesando}
                                >
                                    <FaTimesCircle aria-hidden="true" />
                                    Rechazar Oferta
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <footer className="PublicPage-Footer">
                    Lista de espera automática · MedCareAI
                </footer>
            </section>
        </main>
    );
}

export default RespondWaitingListOfferPage;
