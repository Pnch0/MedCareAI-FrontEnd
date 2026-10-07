import { useState } from "react";
import "./AsignarHorarios.css";
import { ModalReserva } from "../../../Components/ModalReserva/ModalReserva";
import { FaSearch } from "react-icons/fa";

// Mock data para los usuarios
const MOCK_USUARIOS = [
    { id: "1", rut: "11.111.111-1", nombre: "Juan", apellido: "Pérez", email: "juan.perez@email.com" },
    { id: "2", rut: "22.222.222-2", nombre: "María", apellido: "González", email: "maria.gonzalez@email.com" },
    { id: "3", rut: "33.333.333-3", nombre: "Pedro", apellido: "Soto", email: "pedro.soto@email.com" },
    { id: "4", rut: "44.444.444-4", nombre: "Ana", apellido: "Martínez", email: "ana.martinez@email.com" },
    { id: "5", rut: "55.555.555-5", nombre: "Luis", apellido: "Rodríguez", email: "luis.rodriguez@email.com" },
];

function AsignarHorariosRecepcionista() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<typeof MOCK_USUARIOS[0] | null>(null);

    const filteredUsers = MOCK_USUARIOS.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            user.rut.includes(term) ||
            user.nombre.toLowerCase().includes(term) ||
            user.apellido.toLowerCase().includes(term)
        );
    });

    const handleOpenModal = (user: typeof MOCK_USUARIOS[0]) => {
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
                            {filteredUsers.length > 0 ? (
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
                                        No se encontraron pacientes que coincidan con la búsqueda.
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