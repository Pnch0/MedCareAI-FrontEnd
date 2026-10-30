import { useState, useEffect } from "react";
import "./AsignarHorarios.css";
import { ModalReserva } from "../../../Components/ModalReserva/ModalReserva";
import { FaSearch } from "react-icons/fa";
import { supabase } from "../../../Services/supabaseClient.ts";
import { toast } from "sonner";

interface Paciente {
    id: string;
    rut: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
}

const normalizarTexto = (texto: string): string => {
    return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

const normalizarRut = (rut: string): string => {
    return (rut || '').replace(/[.\-\s]/g, '').toLowerCase().trim();
};

function AsignarHorariosRecepcionista() {
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Paciente | null>(null);

    const cargarPacientes = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) {
                toast.error(`Error al cargar pacientes: ${error.message}`);
                return;
            }

            if (Array.isArray(data)) {
                const lista: Paciente[] = data.map((item: any) => ({
                    id: String(item.usuario_id || item.id),
                    rut: item.rut || '',
                    nombre: item.nombre || '',
                    apellido: item.apellido || '',
                    email: item.email || '',
                    telefono: item.telefono || ''
                }));
                setPacientes(lista);
            }
        } catch (err: any) {
            console.error('Error al cargar pacientes:', err);
            toast.error(`Error al cargar pacientes: ${err.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPacientes();
    }, []);

    const filteredUsers = pacientes.filter((user) => {
        if (!searchTerm.trim()) return true;

        const terminoTexto = normalizarTexto(searchTerm);
        const terminoRut = normalizarRut(searchTerm);

        const nombreCompleto = normalizarTexto(`${user.nombre} ${user.apellido}`);
        const apellidoNombre = normalizarTexto(`${user.apellido} ${user.nombre}`);
        const nombre = normalizarTexto(user.nombre);
        const apellido = normalizarTexto(user.apellido);

        const coincideNombre =
            nombreCompleto.includes(terminoTexto) ||
            apellidoNombre.includes(terminoTexto) ||
            nombre.includes(terminoTexto) ||
            apellido.includes(terminoTexto);

        const rutLimpio = normalizarRut(user.rut);
        const coincideRut = terminoRut.length > 0 && rutLimpio.includes(terminoRut);

        return coincideNombre || coincideRut;
    });

    const handleOpenModal = (user: Paciente) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <>
        <div className="ContenedorPrincipal-AsignarHorarios">
            <div className="AsignarHorarios-Container">
                <h1 className="AsignarHorarios-Title">Asignar Hora a Paciente</h1>
                
                <div className="AsignarHorarios-SearchContainer">
                    <div className="AsignarHorarios-SearchWrapper">
                        <FaSearch className="AsignarHorarios-SearchIcon" />
                        <input
                            type="text"
                            className="AsignarHorarios-SearchInput"
                            placeholder="Buscar paciente por RUT, Nombre o Apellido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="AsignarHorarios-TableContainer">
                    <table className="AsignarHorarios-Table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Nombre Completo</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td colSpan={4} className="AsignarHorarios-NoResults">
                                        Cargando pacientes...
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.rut}</td>
                                        <td>{user.nombre} {user.apellido}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <button 
                                                className="AsignarHorarios-BtnReserva"
                                                onClick={() => handleOpenModal(user)}
                                            >
                                                Asignar Hora
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="AsignarHorarios-NoResults">
                                        {searchTerm.trim()
                                            ? `No se encontraron pacientes que coincidan con "${searchTerm}".`
                                            : "No hay pacientes registrados en el sistema."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {selectedUser && (
                    <ModalReserva
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        paciente={selectedUser}
                    />
                )}
            </div>
        </div>
        </>
    );
}

export default AsignarHorariosRecepcionista;
