import React, { useEffect } from 'react';
import { FaTimes, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaUserMd } from 'react-icons/fa';
import type { BloqueHorario } from '../../Services/mockHorarios.ts';
import './ModalDetalleHorario.css';

interface ModalDetalleHorarioProps {
    isOpen: boolean;
    onClose: () => void;
    bloque: BloqueHorario | null;
}

const DIAS_SEMANA_COMPLETOS = [
    { id: 'Lunes', etiqueta: 'Lunes' },
    { id: 'Martes', etiqueta: 'Martes' },
    { id: 'Miércoles', etiqueta: 'Miércoles' },
    { id: 'Jueves', etiqueta: 'Jueves' },
    { id: 'Viernes', etiqueta: 'Viernes' },
    { id: 'Sábado', etiqueta: 'Sábado' },
    { id: 'Domingo', etiqueta: 'Domingo' }
];

export const ModalDetalleHorario: React.FC<ModalDetalleHorarioProps> = ({
    isOpen,
    onClose,
    bloque
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const manejarEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', manejarEscape);
        return () => {
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !bloque) return null;

    return (
        <div className="Modal-FondoOscuro-DetalleHorario" onClick={onClose}>
            <div
                className="Modal-Caja-DetalleHorario"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-detalle-horario"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="Modal-Cabecera-DetalleHorario">
                    <div className="Cabecera-Titulo-DetalleHorario">
                        <FaClock className="Icono-Titulo-DetalleHorario" aria-hidden="true" />
                        <h2 id="titulo-modal-detalle-horario">Detalle del Bloque Horario</h2>
                    </div>
                    <button
                        type="button"
                        className="Btn-CerrarModal-DetalleHorario"
                        onClick={onClose}
                        aria-label="Cerrar ventana modal"
                    >
                        <FaTimes className="Icono-Cerrar-DetalleHorario" aria-hidden="true" />
                    </button>
                </div>


                <div className="Modal-Cuerpo-DetalleHorario">
                    <div className="Seccion-DetalleHorario">
                        <h3 className="Seccion-Titulo-DetalleHorario">
                            <FaClock className="Icono-Seccion-DetalleHorario" aria-hidden="true" />
                            Información del Bloque
                        </h3>
                        <div className="Grid-Info-DetalleHorario">
                            <div className="Item-Info-DetalleHorario">
                                <span className="Etiqueta-Info-DetalleHorario">Hora de Inicio</span>
                                <p className="Badge-Horario-DetalleHorario">{bloque.horaInicio}</p>
                            </div>
                            <div className="Item-Info-DetalleHorario">
                                <span className="Etiqueta-Info-DetalleHorario">Hora de Término</span>
                                <p className="Badge-Horario-DetalleHorario">{bloque.horaFin}</p>
                            </div>
                            <div className="Item-Info-DetalleHorario Completo">
                                <span className="Etiqueta-Info-DetalleHorario">Ubicación del Box</span>
                                <p className="Valor-Info-DetalleHorario">
                                    <FaMapMarkerAlt style={{ color: '#1E9CF1', marginRight: '6px' }} />
                                    <strong>{bloque.box.nombre}</strong> &mdash; {bloque.box.ubicacion}
                                </p>
                            </div>
                        </div>
                    </div>


                    <div className="Seccion-DetalleHorario">
                        <h3 className="Seccion-Titulo-DetalleHorario">
                            <FaCalendarAlt className="Icono-Seccion-DetalleHorario" aria-hidden="true" />
                            Información de Días y Vigencia
                        </h3>
                        <div className="Item-Info-DetalleHorario">
                            <span className="Etiqueta-Info-DetalleHorario">Días de funcionamiento</span>
                            <div className="Contenedor-Dias-DetalleHorario">
                                {DIAS_SEMANA_COMPLETOS.map((dia) => {
                                    const estaActivo = bloque.diasSemana.some(
                                        (d) => d.localeCompare(dia.id, undefined, { sensitivity: 'accent' }) === 0
                                    );
                                    return (
                                        <span
                                            key={dia.id}
                                            className={`Chip-Dia-DetalleHorario ${estaActivo ? 'Activo' : ''}`}
                                            title={estaActivo ? `${dia.etiqueta}: Activo` : `${dia.etiqueta}: No asignado`}
                                        >
                                            {dia.etiqueta}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="Item-Info-DetalleHorario">
                            <span className="Etiqueta-Info-DetalleHorario">Rango de vigencia</span>
                            <p className="Valor-Info-DetalleHorario">
                                Del <strong>{bloque.rangoFechas.fechaInicio}</strong> al <strong>{bloque.rangoFechas.fechaFin}</strong>
                            </p>
                        </div>
                    </div>


                    <div className="Seccion-DetalleHorario">
                        <h3 className="Seccion-Titulo-DetalleHorario">
                            <FaUserMd className="Icono-Seccion-DetalleHorario" aria-hidden="true" />
                            Profesional Asignado
                        </h3>
                        <div className="Card-Profesional-DetalleHorario">
                            <div className="Avatar-Profesional-DetalleHorario" aria-hidden="true">
                                <FaUserMd />
                            </div>
                            <div className="Datos-Profesional-DetalleHorario">
                                <h4 className="Nombre-Profesional-DetalleHorario">
                                    {bloque.profesional.nombre} {bloque.profesional.apellido}
                                </h4>
                                <p className="Especialidad-Profesional-DetalleHorario">
                                    {bloque.profesional.especialidad}
                                </p>
                                <p className="Cargo-Profesional-DetalleHorario">
                                    {bloque.profesional.cargo}
                                    {bloque.profesional.rut && ` • RUT: ${bloque.profesional.rut}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="Modal-Pie-DetalleHorario">
                    <button
                        type="button"
                        className="Btn-Cerrar-DetalleHorario"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

