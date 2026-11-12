import { useState, useEffect } from "react";
import "./AsignarHorarios.css";
import { FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import { ModalReserva } from "../../../Components/ModalReserva/ModalReserva.tsx";
import { supabase } from "../../../Services/supabaseClient.ts";

interface Paciente {
    id: string;
    rut: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
}

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
                    id: String(item.id || item.usuario_id),
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

    const handleOpenModal = (user: Paciente) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const pacientesFiltrados = pacientes.filter(p => {
        const query = searchTerm.toLowerCase().trim();
        const rutLimpio = query.replace(/[.\-]/g, '');
        const pRutLimpio = p.rut.toLowerCase().replace(/[.\-]/g, '');
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        
        return nombreCompleto.includes(query) || pRutLimpio.includes(rutLimpio);
    });

    return (
        <div className="ContenedorPrincipal-AsignarHorarios">
            <div className="AsignarHorarios-Container">
                <h1 className="AsignarHorarios-Title">Asignar Hora a Paciente</h1>

                {/* Barra de búsqueda */}
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

                {/* Tabla de pacientes */}
                <div className="AsignarHorarios-TableContainer">
                    <table className="AsignarHorarios-Table">
                        <thead>
                            <tr>
                                <th>RUT</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Correo</th>
                                <th>Teléfono</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cargando ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((row) => (
                                        <tr key={`skel-row-${row}`} className="AsignarHorarios-SkeletonRow">
                                            <td><div className="Skeleton-Tabla Skeleton-Rut"></div></td>
                                            <td><div className="Skeleton-Tabla Skeleton-Nombre"></div></td>
                                            <td><div className="Skeleton-Tabla Skeleton-Apellido"></div></td>
                                            <td><div className="Skeleton-Tabla Skeleton-Email"></div></td>
                                            <td><div className="Skeleton-Tabla Skeleton-Telefono"></div></td>
                                            <td><div className="Skeleton-Tabla Skeleton-BotonAccion"></div></td>
                                        </tr>
                                    ))}
                                </>
                            ) : pacientesFiltrados.length > 0 ? (
                                pacientesFiltrados.map((paciente) => (
                                    <tr key={paciente.id}>
                                        <td>{paciente.rut}</td>
                                        <td>{paciente.nombre}</td>
                                        <td>{paciente.apellido}</td>
                                        <td>{paciente.email}</td>
                                        <td>{paciente.telefono || '-'}</td>
                                        <td>
                                            <button 
                                                className="AsignarHorarios-BtnReserva"
                                                onClick={() => handleOpenModal(paciente)}
                                            >
                                                Agendar Hora
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="AsignarHorarios-NoResults">
                                        No se encontraron pacientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal de Reserva */}
                {selectedUser && (
                    <ModalReserva 
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        paciente={selectedUser}
                        schedulingSource="Recepcion"
                    />
                )}
            </div>
        </div>
    );
}

export default AsignarHorariosRecepcionista;
