import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ModalBox.css';

export type Box = {
    id: number;
    nombre: string;
}

interface ModalBoxProps {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (box: Box) => void;
    boxAEditar?: Box | null;
}

export const ModalBox: React.FC<ModalBoxProps> = ({ isOpen, onClose, onGuardar, boxAEditar }) => {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');

    const cerrarModal = useCallback(() => {
        setNombre('');
        setError('');
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            setNombre(boxAEditar ? boxAEditar.nombre : '');
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
            id: boxAEditar ? boxAEditar.id : Date.now(),
            nombre: nombreLimpio,
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
                                placeholder="Box...."
                                value={nombre}
                                onChange={(e) => {
                                    setNombre(e.target.value);
                                    setError('');
                                }}
                                required
                            />
                            {error && <span className="Error-ModalBox">{error}</span>}
                        </div>
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