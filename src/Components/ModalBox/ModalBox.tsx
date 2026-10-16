import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ModalBox.css';

export type Box = {
    id: string | number;
    nombre: string;
    tipo?: string;
    capacidad?: number;
    piso?: string;
    isActive?: boolean;
}

interface ModalBoxProps {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (box: Box) => void | Promise<void>;
    boxAEditar?: Box | null;
}

export const ModalBox: React.FC<ModalBoxProps> = ({ isOpen, onClose, onGuardar, boxAEditar }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('Consulta General');
    const [capacidad, setCapacidad] = useState<number>(1);
    const [piso, setPiso] = useState('Piso 1');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [error, setError] = useState('');

    const cerrarModal = useCallback(() => {
        setNombre('');
        setTipo('Consulta General');
        setCapacidad(1);
        setPiso('Piso 1');
        setIsActive(true);
        setError('');
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setNombre(boxAEditar ? boxAEditar.nombre : '');
            setTipo(boxAEditar?.tipo || 'Consulta General');
            setCapacidad(boxAEditar?.capacidad || 1);
            setPiso(boxAEditar?.piso || 'Piso 1');
            setIsActive(boxAEditar?.isActive !== undefined ? boxAEditar.isActive : true);
            setError('');
        }
    }, [isOpen, boxAEditar]);

    useEffect(() => {
        if (!isOpen) return;

        const manejarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cerrarModal();
            }
        };

        document.addEventListener('keydown', manejarTecla);
        return () => {
            document.removeEventListener('keydown', manejarTecla);
        };
    }, [isOpen, cerrarModal]);

    const handleGuardar = (e: React.FormEvent) => {
        e.preventDefault();

        const nombreLimpio = nombre.trim();

        if (nombreLimpio.length === 0) {
            setError('El nombre del box no puede estar vacío.');
            return;
        }

        onGuardar({
            id: boxAEditar ? boxAEditar.id : crypto.randomUUID(),
            nombre: nombreLimpio,
            tipo: tipo.trim() || 'Consulta General',
            capacidad: Number(capacidad) || 1,
            piso: piso.trim() || 'Piso 1',
            isActive: isActive
        });

        cerrarModal();
    };

    if (!isOpen) return null;

    const esEdicion = Boolean(boxAEditar);

    return (
        <div className="Modal-FondoOscuro-ModalBox" onClick={cerrarModal}>
            <div
                className="Modal-Caja-ModalBox"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="Modal-Cabecera-ModalBox">
                    <h2 id="titulo-modal-box">{esEdicion ? 'Editar Box' : 'Añadir Box'}</h2>
                    <button
                        type="button"
                        className="Btn-CerrarModal-ModalBox"
                        onClick={cerrarModal}
                        aria-label="Cerrar"
                    >
                        <FaTimes className="Icono-Cerrar-ModalBox" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleGuardar}>
                    <div className="Modal-Cuerpo-ModalBox">
                        <div className="Campo-Largo-ModalBox">
                            <label htmlFor="Box_Nombre">Nombre:</label>
                            <input
                                type="text"
                                id="Box_Nombre"
                                placeholder="Ej: Box 1"
                                value={nombre}
                                onChange={(e) => {
                                    setNombre(e.target.value);
                                    setError('');
                                }}
                                required
                            />
                            {error && <span className="Error-ModalBox">{error}</span>}
                        </div>

                        <div className="Campo-Largo-ModalBox">
                            <label htmlFor="Box_Tipo">Tipo:</label>
                            <input
                                type="text"
                                id="Box_Tipo"
                                placeholder="Ej: Consulta General, Dental, etc."
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                required
                            />
                        </div>

                        <div className="Campo-Largo-ModalBox">
                            <label htmlFor="Box_Capacidad">Capacidad:</label>
                            <input
                                type="number"
                                id="Box_Capacidad"
                                min={1}
                                placeholder="1"
                                value={capacidad}
                                onChange={(e) => setCapacidad(Math.max(1, parseInt(e.target.value) || 1))}
                                required
                            />
                        </div>

                        <div className="Campo-Largo-ModalBox">
                            <label htmlFor="Box_Piso">Piso / Ubicación:</label>
                            <input
                                type="text"
                                id="Box_Piso"
                                placeholder="Ej: Piso 1, Piso 2"
                                value={piso}
                                onChange={(e) => setPiso(e.target.value)}
                                required
                            />
                        </div>

                        {esEdicion && (
                            <div className="Campo-Largo-ModalBox">
                                <label htmlFor="Box_Estado">Estado:</label>
                                <select
                                    id="Box_Estado"
                                    value={isActive ? "activo" : "inactivo"}
                                    onChange={(e) => setIsActive(e.target.value === "activo")}
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="Modal-Pie-ModalBox">
                        <button type="button" className="Btn-Cancelar-ModalBox" onClick={cerrarModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="Btn-Accion-ModalBox">
                            {esEdicion ? 'Guardar Cambios' : 'Añadir Box'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};