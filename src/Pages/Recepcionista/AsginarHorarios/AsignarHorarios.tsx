import { useState, useEffect } from "react";
import "./AsignarHorarios.css";
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
        <div className="Contenedor-Principal-AsignarHorarios">
            <div className="Contenedor-Titulo-AsignarHorarios">
                <h1>Asignación de Horarios Médicos</h1>
                <p>Selecciona un paciente para comenzar el proceso de reserva</p>
            </div>

            <div className="Contenedor-BarraBusqueda-AsignarHorarios">
                <input 
                    type="text" 
                    placeholder="Buscar por Nombre o RUT..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="Input-Busqueda-AsignarHorarios"
                />
            </div>

            <div className="Contenedor-Tabla-AsignarHorarios">
                {cargando ? (
                    <div className="Cargando-AsignarHorarios">Cargando pacientes desde el sistema...</div>
                ) : (
                    <table className="Tabla-AsignarHorarios">
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
                            {pacientesFiltrados.length > 0 ? (
                                pacientesFiltrados.map((paciente) => (
                                    <tr key={paciente.id}>
                                        <td>{paciente.rut}</td>
                                        <td>{paciente.nombre}</td>
                                        <td>{paciente.apellido}</td>
                                        <td>{paciente.email}</td>
                                        <td>{paciente.telefono || '-'}</td>
                                        <td>
                                            <button 
                                                className="Boton-Agendar-AsignarHorarios"
                                                onClick={() => handleOpenModal(paciente)}
                                            >
                                                Agendar Hora
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="Sin-Resultados-AsignarHorarios">
                                        No se encontraron pacientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
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
    );
}

export default AsignarHorariosRecepcionista;
