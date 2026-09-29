import { useState } from "react";
import "./GestionUsuarios.css";
import { FaSearch, FaPen, FaTrash } from "react-icons/fa";

type EstadoUsuario = 'activo' | 'inactivo'

type RolUsuario = 'paciente' | 'medico' | 'recepcionista' | 'administrador'

type Usuario = {
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

const MOCK_USUARIOS: Usuario[] = [
    {
        id: 'usuario-1',
        email: 'alejandra.munoz@medcare.cl',
        rol: 'administrador',
        nombre: 'Alejandra',
        apellido: 'Muñoz Vergara',
        rut: '12.345.678-9',
        especialidad: null,
        cargo: 'Directora de la Clinica',
        telefono: '+56 9 6123 4567',
        estado: 'activo'
    },
    {
        id: 'usuario-2',
        email: 'rodrigo.salas@medcare.cl',
        rol: 'administrador',
        nombre: 'Rodrigo',
        apellido: 'Salas Pinto',
        rut: '15.432.187-3',
        especialidad: null,
        cargo: 'Coordinador Administrativo',
        telefono: '+56 9 7234 5678',
        estado: 'activo'
    },
    {
        id: 'usuario-3',
        email: 'camila.fernandez@medcare.cl',
        rol: 'medico',
        nombre: 'Camila',
        apellido: 'Fernández Reyes',
        rut: '18.765.432-0',
        especialidad: 'Cardiología',
        cargo: 'Médico Cardiólogo',
        telefono: '+56 9 8345 6789',
        estado: 'activo'
    },
    {
        id: 'usuario-4',
        email: 'sebastian.maldonado@medcare.cl',
        rol: 'medico',
        nombre: 'Sebastián',
        apellido: 'Maldonado Cruz',
        rut: '20.123.456-9',
        especialidad: 'Pediatría',
        cargo: 'Médico Pediatra',
        telefono: '+56 9 9456 7890',
        estado: 'activo'
    },
    {
        id: 'usuario-5',
        email: 'isabel.contreras@medcare.cl',
        rol: 'medico',
        nombre: 'Isabel',
        apellido: 'Contreras Rivas',
        rut: '22.456.789-1',
        especialidad: 'Dermatología',
        cargo: 'Médico Dermatóloga',
        telefono: '+56 9 5567 8901',
        estado: 'inactivo'
    },
    {
        id: 'usuario-6',
        email: 'nicole.bravo@medcare.cl',
        rol: 'recepcionista',
        nombre: 'Nicole',
        apellido: 'Bravo Espinoza',
        rut: '24.135.678-0',
        especialidad: null,
        cargo: 'Recepcionista',
        telefono: '+56 9 6678 9012',
        estado: 'activo'
    },
    {
        id: 'usuario-7',
        email: 'matias.villalobos@medcare.cl',
        rol: 'recepcionista',
        nombre: 'Matías',
        apellido: 'Villalobos Tapia',
        rut: '16.273.849-K',
        especialidad: null,
        cargo: 'Recepcionista Turno AM',
        telefono: '+56 9 7789 0123',
        estado: 'activo'
    },
    {
        id: 'usuario-8',
        email: 'juan.perez@medcare.cl',
        rol: 'paciente',
        nombre: 'Juan',
        apellido: 'Pérez Soto',
        rut: '19.827.364-7',
        especialidad: null,
        cargo: null,
        telefono: '+56 9 8890 1234',
        estado: 'activo'
    },
    {
        id: 'usuario-9',
        email: 'maria.gomez@medcare.cl',
        rol: 'paciente',
        nombre: 'María',
        apellido: 'Gómez Lara',
        rut: '10.928.374-K',
        especialidad: null,
        cargo: null,
        telefono: '+56 9 9901 2345',
        estado: 'activo'
    },
    {
        id: 'usuario-10',
        email: 'diego.rios@medcare.cl',
        rol: 'paciente',
        nombre: 'Diego',
        apellido: 'Ríos Palma',
        rut: '17.263.549-4',
        especialidad: null,
        cargo: null,
        telefono: '+56 9 4012 3456',
        estado: 'inactivo'
    }
]

function GestionUsuariosAdministrador(){

    const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);

    const eliminarUsuario = (id: string) => {
        const confirmar = window.confirm('¿Estas seguro de eliminar este usuario?');
        if (confirmar) {
            setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
        }
    };

    return(
        <>
           <div className="ContenendorPrincipal-GestionUsuarios">
                <div className="ContenedorSuperior-GestionUsuarios">
                    <button>Añadir Usuarios</button>
                </div>

                <div className="ContenedorInferior-GestionUsuarios">
                    <div className="ContenedorListado-GestionUsuarios">
                        <div className="EncabezadoListado-GestionUsuarios">
                            <div className="TituloEncabezado-GestionUsuarios">
                                <h1>Listado Usuarios</h1>
                            </div>
                            <div className="FiltroBuscador-GestionUsuarios">
                                <div className="ContenedorFiltro-GestionUsuarios">
                                    <select id="filtro-rol">
                                        <option value="todos">Todos</option>
                                        <option value="paciente">Paciente</option>
                                        <option value="admin">Administrador</option>
                                        <option value="medico">Medico</option>
                                        <option value="recepcionista">Recepcionista</option>
                                    </select>
                                </div>
                                <div className="ContenedorBuscador-GestionUsuarios">
                                    <FaSearch className="Icono-Buscador"/><input type="text" placeholder="Buscar persona..." id="buscador" />
                                </div>
                            </div>
                        </div>
                        <div className="ContenedorEncabezado-DatosListados">
                            <ul>
                                <li>Rut</li>
                                <li>Nombre</li>
                                <li>Apellido</li>
                                <li>Correo</li>
                                <li>Rol</li>
                                <li>Estado</li>
                                <li>Acciones</li>
                            </ul>
                        </div>
                        <div className="ContenedorListado-DatosUsuario">
                            {usuarios.map((usuario) => (
                                <div className="Card-ListadoUsuarios" key={usuario.id}>
                                    <ul className="Fila-GestionUsuarios">
                                        <li>{usuario.rut}</li>
                                        <li>{usuario.nombre}</li>
                                        <li>{usuario.apellido}</li>
                                        <li>{usuario.email}</li>
                                        <li>{usuario.rol}</li>
                                        <li className={`Estado-GestionUsuarios ${usuario.estado}`}>{usuario.estado}</li>
                                        <li className="Acciones-GestionUsuarios">
                                            <button
                                                type="button"
                                                className="Btn-Editar-GestionUsuarios"
                                                title="Editar usuario"
                                            >
                                                <FaPen />
                                            </button>
                                            <button
                                                type="button"
                                                className="Btn-Eliminar-GestionUsuarios"
                                                title="Eliminar usuario"
                                                onClick={() => eliminarUsuario(usuario.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
           </div>
        </>
    )
}

export default GestionUsuariosAdministrador;
