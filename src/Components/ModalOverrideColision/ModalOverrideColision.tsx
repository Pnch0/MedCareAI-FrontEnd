import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FaClock, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { ejecutarOverrideColisionSobrecupo } from '../../Services/receptionTasksService.ts';
import './ModalOverrideColision.css';

export interface ModalOverrideColisionProps {
    isOpen: boolean;
    appointmentId: string | null;
    competingAppointmentId?: string | null;
    descripcionContexto?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const ModalOverrideColision: React.FC<ModalOverrideColisionProps> = ({
    isOpen,
    appointmentId,
    competingAppointmentId = null,
    descripcionContexto,
    onClose,
    onSuccess
}) => {
    const [winnerAppointmentId, setWinnerAppointmentId] = useState<string>(appointmentId || '');
    const [reason, setReason] = useState<string>('');
    const [enviando, setEnviando] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen) return;

        const manejarEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && !enviando) {
                onClose();
            }
        };

        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', manejarEscape);

        return () => {
            document.body.style.overflow = overflowAnterior;
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [isOpen, enviando, onClose]);

    if (!isOpen || !appointmentId) return null;

    const manejarSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (enviando) return;

        const winnerTrim = winnerAppointmentId.trim();
        const reasonTrim = reason.trim();

        if (!winnerTrim) {
            toast.warning('Debes indicar el ID de la cita ganadora (WinnerAppointmentId).');
            return;
        }
        if (!reasonTrim) {
            toast.warning('La justificación es obligatoria para registrar el override.');
            return;
        }

        setEnviando(true);
        try {
            const res = await ejecutarOverrideColisionSobrecupo(appointmentId, {
                winnerAppointmentId: winnerTrim,
                reason: reasonTrim
            });
            toast.success(res.message || 'Prioridad de colisión actualizada y auditada.');
            setReason('');
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo aplicar el override de colisión.';
            toast.error(mensaje);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div
            className="ModalColision-Backdrop"
            role="presentation"
            onClick={() => !enviando && onClose()}
        >
            <div
                className="ModalColision-Contenedor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-colision-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ModalColision-Header">
                    <div className="ModalColision-TituloGrupo">
                        <span className="ModalColision-Subtitulo">
                            Resolución de Colisión de Sobrecupo
                        </span>
                        <h2 id="modal-colision-titulo">Override Manual de Prioridad</h2>
                    </div>
                    <button
                        type="button"
                        className="ModalColision-BtnCerrar"
                        onClick={onClose}
                        disabled={enviando}
                        aria-label="Cerrar modal de override"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={(e) => void manejarSubmit(e)}>
                    <div className="ModalColision-Body">
                        <div className="ModalColision-ReglaBox">
                            <div className="ModalColision-ReglaHeader">
                                <FaClock aria-hidden="true" />
                                Regla Determinista de Prioridad (Timestamp de Confirmación)
                            </div>
                            <p>
                                Por defecto, el motor asigna el cupo al paciente con{' '}
                                <strong>timestamp de confirmación más antiguo</strong>. Utiliza este
                                override únicamente cuando recepción deba priorizar manualmente otra cita
                                por criterio operativo o clínico.
                            </p>
                        </div>

                        <div className="ModalColision-Contexto">
                            <span>
                                <strong>Cita base en colisión:</strong> {appointmentId}
                            </span>
                            {competingAppointmentId && (
                                <span>
                                    <strong>Cita en conflicto:</strong> {competingAppointmentId}
                                </span>
                            )}
                            {descripcionContexto && <span>{descripcionContexto}</span>}
                        </div>

                        <label className="ModalColision-Field">
                            ID de la Cita Ganadora (`WinnerAppointmentId`):
                            <input
                                type="text"
                                className="ModalColision-Input"
                                value={winnerAppointmentId}
                                onChange={(e) => setWinnerAppointmentId(e.target.value)}
                                placeholder="GUID de la cita que conservará el cupo"
                                disabled={enviando}
                                required
                            />
                            <div className="ModalColision-QuickPick">
                                <button
                                    type="button"
                                    className="ModalColision-ChipBtn"
                                    onClick={() => setWinnerAppointmentId(appointmentId)}
                                >
                                    Usar Cita Base
                                </button>
                                {competingAppointmentId && (
                                    <button
                                        type="button"
                                        className="ModalColision-ChipBtn"
                                        onClick={() => setWinnerAppointmentId(competingAppointmentId)}
                                    >
                                        Usar Cita en Conflicto
                                    </button>
                                )}
                            </div>
                        </label>

                        <label className="ModalColision-Field">
                            Justificación obligatoria del override:
                            <textarea
                                className="ModalColision-Textarea"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej. Paciente presente en clínica con urgencia de control; se reubica segunda cita."
                                disabled={enviando}
                                required
                            />
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748B' }}>
                            <FaExclamationTriangle aria-hidden="true" style={{ color: '#D97706' }} />
                            Esta acción quedará auditada con tu usuario y motivo.
                        </div>
                    </div>

                    <div className="ModalColision-Footer">
                        <button
                            type="button"
                            className="ModalColision-BtnCancelar"
                            onClick={onClose}
                            disabled={enviando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="ModalColision-BtnConfirmar"
                            disabled={enviando}
                        >
                            {enviando ? 'Aplicando Override...' : 'Confirmar Override'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
