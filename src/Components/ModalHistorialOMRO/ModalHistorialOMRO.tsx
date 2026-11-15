import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaHistory, FaTimes, FaArrowRight } from 'react-icons/fa';
import {
    obtenerConfiguracionAccion,
    type ResolutionTask
} from '../../Services/omroService.ts';
import './ModalHistorialOMRO.css';

export interface ModalHistorialOMROProps {
    isOpen: boolean;
    onClose: () => void;
    tareas: ResolutionTask[];
    cargando?: boolean;
    onSeleccionarAccion?: (tareaId: string) => void;
}

type FiltroEstadoOMRO = 'todas' | 'pending' | 'approved' | 'rejected';

function traducirEstadoHistorial(status: string): string {
    const lower = status.toLowerCase();
    if (lower === 'pending') return 'Pendiente';
    if (lower === 'approved') return 'Aprobada';
    if (lower === 'rejected') return 'Rechazada';
    if (lower === 'executed') return 'Ejecutada';
    return status;
}

function obtenerClaseEstadoHistorial(status: string): string {
    const lower = status.toLowerCase();
    if (lower === 'approved' || lower === 'executed') return 'estado-approved';
    if (lower === 'rejected') return 'estado-rejected';
    return 'estado-pending';
}

export const ModalHistorialOMRO: React.FC<ModalHistorialOMROProps> = ({
    isOpen,
    onClose,
    tareas,
    cargando = false,
    onSeleccionarAccion
}) => {
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoOMRO>('todas');

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

    const conteos = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        for (const t of tareas) {
            const st = t.status.toLowerCase();
            if (st === 'pending') pending++;
            else if (st === 'approved' || st === 'executed') approved++;
            else if (st === 'rejected') rejected++;
        }
        return {
            todas: tareas.length,
            pending,
            approved,
            rejected
        };
    }, [tareas]);

    const tareasFiltradas = useMemo(() => {
        if (filtroEstado === 'todas') return tareas;
        if (filtroEstado === 'approved') {
            return tareas.filter((t) => {
                const st = t.status.toLowerCase();
                return st === 'approved' || st === 'executed';
            });
        }
        return tareas.filter((t) => t.status.toLowerCase() === filtroEstado);
    }, [tareas, filtroEstado]);

    if (!isOpen) return null;

    return (
        <div
            className="ModalHistorialOMRO-Backdrop"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="ModalHistorialOMRO-Contenedor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-historial-omro-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ModalHistorialOMRO-Header">
                    <div className="ModalHistorialOMRO-HeaderIzq">
                        <div className="ModalHistorialOMRO-IconoHeader" aria-hidden="true">
                            <FaHistory />
                        </div>
                        <div className="ModalHistorialOMRO-TituloGrupo">
                            <span className="ModalHistorialOMRO-Subtitulo">
                                Registro del Motor Orquestador
                            </span>
                            <h2 id="modal-historial-omro-titulo" className="ModalHistorialOMRO-Titulo">
                                Historial de Resoluciones OMRO
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ModalHistorialOMRO-BtnCerrar"
                        onClick={onClose}
                        aria-label="Cerrar historial OMRO"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="ModalHistorialOMRO-Filtros" role="tablist" aria-label="Filtrar historial por estado">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filtroEstado === 'todas'}
                        className={`ModalHistorialOMRO-Tab ${filtroEstado === 'todas' ? 'activo' : ''}`}
                        onClick={() => setFiltroEstado('todas')}
                    >
                        Todas ({conteos.todas})
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filtroEstado === 'pending'}
                        className={`ModalHistorialOMRO-Tab ${filtroEstado === 'pending' ? 'activo' : ''}`}
                        onClick={() => setFiltroEstado('pending')}
                    >
                        Pendientes ({conteos.pending})
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filtroEstado === 'approved'}
                        className={`ModalHistorialOMRO-Tab ${filtroEstado === 'approved' ? 'activo' : ''}`}
                        onClick={() => setFiltroEstado('approved')}
                    >
                        Aprobadas ({conteos.approved})
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={filtroEstado === 'rejected'}
                        className={`ModalHistorialOMRO-Tab ${filtroEstado === 'rejected' ? 'activo' : ''}`}
                        onClick={() => setFiltroEstado('rejected')}
                    >
                        Rechazadas ({conteos.rejected})
                    </button>
                </div>

                <div className="ModalHistorialOMRO-Body">
                    {cargando ? (
                        <div className="ModalHistorialOMRO-EstadoVacio">
                            <p>Cargando historial de resoluciones...</p>
                        </div>
                    ) : tareasFiltradas.length === 0 ? (
                        <div className="ModalHistorialOMRO-EstadoVacio">
                            <p>No hay resoluciones registradas bajo el filtro seleccionado.</p>
                        </div>
                    ) : (
                        <ul className="ModalHistorialOMRO-Lista">
                            {tareasFiltradas.map((tarea) => {
                                const config = obtenerConfiguracionAccion(tarea.aiPlan.tipoAccion);
                                const esPendiente = tarea.status.toLowerCase() === 'pending';

                                return (
                                    <li key={tarea.id} className="ModalHistorialOMRO-Item">
                                        <div
                                            className={`ModalHistorialOMRO-Letra ${config.claseCss}`}
                                            title={config.nombreCompleto}
                                            aria-label={`Tipo: ${config.nombreCompleto}`}
                                        >
                                            {config.letra}
                                        </div>

                                        <div className="ModalHistorialOMRO-ItemInfo">
                                            <div className="ModalHistorialOMRO-ItemTop">
                                                <h3>{tarea.aiPlan.titulo}</h3>
                                                <span
                                                    className={`ModalHistorialOMRO-BadgeEstado ${obtenerClaseEstadoHistorial(
                                                        tarea.status
                                                    )}`}
                                                >
                                                    {traducirEstadoHistorial(tarea.status)}
                                                </span>
                                            </div>
                                            <p className="ModalHistorialOMRO-ItemDesc">
                                                {tarea.aiPlan.descripcion}
                                            </p>
                                            <div className="ModalHistorialOMRO-ItemMeta">
                                                <span className="ModalHistorialOMRO-MetaFecha">
                                                    <FaCalendarAlt aria-hidden="true" />
                                                    {tarea.createdAt}
                                                </span>
                                                <span
                                                    className={`ModalHistorialOMRO-MetaRiesgo ${
                                                        tarea.riskProbability >= 70 ? 'alto' : 'medio'
                                                    }`}
                                                >
                                                    Riesgo {tarea.riskProbability}%
                                                </span>
                                                <span className="ModalHistorialOMRO-MetaTipo">
                                                    {config.nombreCompleto}
                                                </span>
                                                {esPendiente && onSeleccionarAccion && (
                                                    <button
                                                        type="button"
                                                        className="ModalHistorialOMRO-BtnAtender"
                                                        onClick={() => {
                                                            onSeleccionarAccion(tarea.id);
                                                            onClose();
                                                        }}
                                                    >
                                                        Atender acción
                                                        <FaArrowRight aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="ModalHistorialOMRO-Footer">
                    <button
                        type="button"
                        className="ModalHistorialOMRO-BtnCerrarFooter"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
