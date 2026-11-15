import React, { useEffect } from 'react';
import { FaBrain, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import {
    obtenerConfiguracionAccion,
    type ResolutionTask
} from '../../Services/omroService.ts';
import './ModalDetalleOMRO.css';

interface ModalDetalleOMROProps {
    isOpen: boolean;
    tarea: ResolutionTask | null;
    onClose: () => void;
}

function traducirEstadoModal(status: string): string {
    const lower = status.toLowerCase();
    if (lower === 'pending') return 'Pendiente de decisión';
    if (lower === 'approved') return 'Aprobada';
    if (lower === 'rejected') return 'Rechazada';
    if (lower === 'executed') return 'Ejecutada';
    return status;
}

export const ModalDetalleOMRO: React.FC<ModalDetalleOMROProps> = ({
    isOpen,
    tarea,
    onClose
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const manejarEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
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
    }, [isOpen, onClose]);

    if (!isOpen || !tarea) return null;

    const configAccion = obtenerConfiguracionAccion(tarea.aiPlan.tipoAccion);
    const estadoLower = tarea.status.toLowerCase();
    const claseEstado =
        estadoLower === 'approved'
            ? 'estado-approved'
            : estadoLower === 'rejected'
            ? 'estado-rejected'
            : 'estado-pending';

    return (
        <div
            className="ModalOMRO-Backdrop"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="ModalOMRO-Contenedor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-omro-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ModalOMRO-Header">
                    <div className="ModalOMRO-HeaderIzq">
                        <div
                            className={`ModalOMRO-BadgeLetra ${configAccion.claseCss}`}
                            aria-hidden="true"
                        >
                            {configAccion.letra}
                        </div>
                        <div className="ModalOMRO-TituloGrupo">
                            <span className="ModalOMRO-Subtitulo">
                                Análisis Orquestador OMRO · {configAccion.nombreCompleto}
                            </span>
                            <h2 id="modal-omro-titulo" className="ModalOMRO-Titulo">
                                {tarea.aiPlan.titulo}
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ModalOMRO-BtnCerrar"
                        onClick={onClose}
                        aria-label="Cerrar detalle de justificación"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="ModalOMRO-Body">
                    <div className="ModalOMRO-MetaGrid">
                        <span className="ModalOMRO-Chip">
                            <FaCalendarAlt aria-hidden="true" />
                            {tarea.createdAt}
                        </span>
                        <span
                            className={`ModalOMRO-Chip ${
                                tarea.riskProbability >= 70 ? 'riesgo-alto' : 'riesgo-medio'
                            }`}
                        >
                            Riesgo de inasistencia: {tarea.riskProbability}%
                        </span>
                        <span className={`ModalOMRO-Chip ${claseEstado}`}>
                            {traducirEstadoModal(tarea.status)}
                        </span>
                    </div>

                    <section className="ModalOMRO-CajaRazonamiento" aria-label="Razonamiento clínico">
                        <div className="ModalOMRO-RazonamientoHeader">
                            <FaBrain aria-hidden="true" />
                            <span>Justificación y Razonamiento (IA)</span>
                        </div>
                        <p className="ModalOMRO-RazonamientoTexto">
                            {tarea.aiPlan.descripcion}
                        </p>
                    </section>

                    {tarea.aiPlan.sugerencia && (
                        <div className="ModalOMRO-SugerenciaBox">
                            <strong>Sugerencia operativa:</strong> {tarea.aiPlan.sugerencia}
                        </div>
                    )}
                </div>

                <div className="ModalOMRO-Footer">
                    <button
                        type="button"
                        className="ModalOMRO-BtnEntendido"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
