import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ModalUsuario.css';

export type EstadoUsuario = 'activo' | 'inactivo'

export type RolUsuario = 'paciente' | 'medico' | 'recepcionista' | 'administrador'

export type Usuario = {
    id: string
    email: string
    rol: RolUsuario
    nombre: string
    apellido: string
    rut: string
    especialidad: string | null
    cargo: string | null
    telefono: string
    estado: EstadoUsuario
}

interface ModalUsuarioProps {
    isOpen: boolean;
    onClose: () => void;
    onGuardar: (usuario: Usuario) => void;
}

const ROLES: { valor: RolUsuario; etiqueta: string }[] = [
    { valor: 'paciente', etiqueta: 'Paciente' },
    { valor: 'medico', etiqueta: 'Medico' },
    { valor: 'recepcionista', etiqueta: 'Recepcionista' },
    { valor: 'administrador', etiqueta: 'Administrador' }
];

const validarRut = (valor: string): boolean => {
    const limpio = valor.replace(/[.-]/g, '').toUpperCase();

    if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

    const cuerpo = limpio.slice(0, -1);
    const digito = limpio.slice(-1);

    let suma = 0;
    let factor = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }

    const resto = suma % 11;
    const esperado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);

    return digito === esperado;
};

const formatearRut = (valor: string): string => {
    const limpio = valor.replace(/[.-]/g, '').toUpperCase().replace(/^0+(\d)/, '$1');

    if (limpio.length === 0) return '';

    const cuerpo = limpio.slice(0, -1);
    const digito = limpio.slice(-1);

    return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${digito}`;
};

export const ModalUsuario: React.FC<ModalUsuarioProps> = ({ isOpen, onClose, onGuardar }) => {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [rut, setRut] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [rol, setRol] = useState<RolUsuario | ''>('');
    const [estado, setEstado] = useState<EstadoUsuario>('activo');
    const [especialidad, setEspecialidad] = useState('');
    const [cargo, setCargo] = useState('');

    const [errorRut, setErrorRut] = useState('');

    const cerrarModal = useCallback(() => {
        setNombre('');
        setApellido('');
        setRut('');
        setEmail('');
        setPassword('');
        setTelefono('');
        setRol('');
        setEstado('activo');
        setEspecialidad('');
        setCargo('');
        setErrorRut('');
        onClose();
    }, [onClose]);

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

    const manejarCambioRol = (valor: RolUsuario) => {
        setRol(valor);

        if (valor !== 'medico') {
            setEspecialidad('');
        }

        if (valor === 'paciente') {
            setCargo('');
        }
    };

    const handleGuardar = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarRut(rut)) {
            setErrorRut('RUT inválido, revisa el número y el dígito verificador');
            return;
        }

        const rolSeleccionado = rol as RolUsuario;

        onGuardar({
            id: `usuario-${Date.now()}`,
            email: email,
            rol: rolSeleccionado,
            nombre: nombre,
            apellido: apellido,
            rut: formatearRut(rut),
            especialidad: rolSeleccionado === 'medico' ? especialidad || null : null,
            cargo: rolSeleccionado === 'paciente' ? null : cargo || null,
            telefono: telefono,
            estado: estado
        });

        cerrarModal();
    };

    if (!isOpen) return null;

    return (
        <div className="Modal-FondoOscuro-ModalUsuario" onClick={cerrarModal}>
            <div
                className="Modal-Caja-ModalUsuario"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-usuario"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="Modal-Cabecera-ModalUsuario">
                    <h2 id="titulo-modal-usuario">Añadir Usuario</h2>
                    <button
                        type="button"
                        className="Btn-CerrarModal-ModalUsuario"
                        onClick={cerrarModal}
                        aria-label="Cerrar"
                    >
                        <FaTimes className="Icono-Cerrar-ModalUsuario" aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleGuardar}>
                    <div className="Modal-Cuerpo-ModalUsuario">
                        <div className="Fila-Doble-ModalUsuario">
                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Nombre">Nombre:</label>
                                <input
                                    type="text"
                                    id="Usuario_Nombre"
                                    placeholder="Nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Apellido">Apellido:</label>
                                <input
                                    type="text"
                                    id="Usuario_Apellido"
                                    placeholder="Apellido"
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="Fila-Doble-ModalUsuario">
                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_RUT">RUT:</label>
                                <input
                                    type="text"
                                    id="Usuario_RUT"
                                    placeholder="12.345.678-9"
                                    value={rut}
                                    onChange={(e) => {
                                        setRut(e.target.value);
                                        setErrorRut('');
                                    }}
                                    required
                                />
                                {errorRut && <span className="Error-ModalUsuario">{errorRut}</span>}
                            </div>

                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Telefono">Teléfono:</label>
                                <input
                                    type="tel"
                                    id="Usuario_Telefono"
                                    placeholder="+56 9 1234 5678"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="Fila-Doble-ModalUsuario">
                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Email">Correo Electrónico:</label>
                                <input
                                    type="email"
                                    id="Usuario_Email"
                                    placeholder="correo@medcare.cl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Password">Contraseña:</label>
                                <input
                                    type="password"
                                    id="Usuario_Password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <div className="Fila-Doble-ModalUsuario">
                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Rol">Rol:</label>
                                <select
                                    id="Usuario_Rol"
                                    value={rol}
                                    onChange={(e) => manejarCambioRol(e.target.value as RolUsuario)}
                                    required
                                >
                                    <option value="" disabled>Selecciona un rol</option>
                                    {ROLES.map((item) => (
                                        <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="Campo-Grupo-ModalUsuario">
                                <label htmlFor="Usuario_Estado">Estado:</label>
                                <select
                                    id="Usuario_Estado"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value as EstadoUsuario)}
                                >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        {rol === 'medico' && (
                            <div className="Fila-Doble-ModalUsuario">
                                <div className="Campo-Grupo-ModalUsuario">
                                    <label htmlFor="Usuario_Especialidad">Especialidad:</label>
                                    <input
                                        type="text"
                                        id="Usuario_Especialidad"
                                        placeholder="Cardiología"
                                        value={especialidad}
                                        onChange={(e) => setEspecialidad(e.target.value)}
                                    />
                                </div>

                                <div className="Campo-Grupo-ModalUsuario">
                                    <label htmlFor="Usuario_Cargo">Cargo:</label>
                                    <input
                                        type="text"
                                        id="Usuario_Cargo"
                                        placeholder="Médico Cardiólogo"
                                        value={cargo}
                                        onChange={(e) => setCargo(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {(rol === 'recepcionista' || rol === 'administrador') && (
                            <div className="Campo-Largo-ModalUsuario">
                                <label htmlFor="Usuario_Cargo">Cargo:</label>
                                <input
                                    type="text"
                                    id="Usuario_Cargo"
                                    placeholder="Recepcionista"
                                    value={cargo}
                                    onChange={(e) => setCargo(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="Modal-Pie-ModalUsuario">
                        <button type="button" className="Btn-Cancelar-ModalUsuario" onClick={cerrarModal}>
                            Cancelar
                        </button>
                        <button type="submit" className="Btn-Accion-ModalUsuario">
                            Añadir Usuario
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
