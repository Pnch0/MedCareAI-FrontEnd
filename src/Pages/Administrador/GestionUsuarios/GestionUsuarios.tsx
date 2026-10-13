import { useState } from "react";
import "./GestionUsuarios.css";
import { FaSearch, FaEdit , FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { ModalUsuario, type Usuario, type RolUsuario } from "../../../Components/ModalUsuario/ModalUsuario.tsx";
import { apiClient } from "../../../Services/apiClient.ts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const authAdminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

const USER_ROLE_MAP: Record<RolUsuario, number> = {
    paciente: 0,
    recepcionista: 1,
    medico: 2,
    administrador: 3
};

const MOCK_USUARIOS: Usuario[] = [
    {
        id: 'usuario-1',
        email: 'alejandra.munoz@medcare.cl',
        rol: 'administrador',
        nombre: 'Alejandra',
        apellido: 'Muñoz Vergara',
        rut: '12.345.678-5',
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
        rut: '15.432.187-K',
        especialidad: null,
        cargo: 'Coordinador Administrativo',
        telefono: '+56 9 7234 5678',
        estado: 'inactivo'
    },
    {
        id: 'usuario-3',
        email: 'camila.fernandez@medcare.cl',
        rol: 'medico',
        nombre: 'Camila',
        apellido: 'Fernández Reyes',
        rut: '18.765.432-7',
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
        rut: '20.123.456-5',
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
        rut: '22.456.789-8',
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
        rut: '24.135.678-7',
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
        rut: '16.273.849-6',
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
        rut: '19.827.364-3',
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
        rut: '10.928.374-6',
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
        rut: '17.263.549-0',
        especialidad: null,
        cargo: null,
        telefono: '+56 9 4012 3456',
        estado: 'inactivo'
    }
]

function GestionUsuariosAdministrador(){

    const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USUARIOS);
    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

    const eliminarUsuario = (id: string) => {
        const confirmar = window.confirm('¿Estas seguro de eliminar este usuario?');
        if (confirmar) {
            setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
        }
    };

    const abrirModalAñadir = () => {
        setUsuarioEditando(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (usuario: Usuario) => {
        setUsuarioEditando(usuario);
        setModalAbierto(true);
    };

    const manejarGuardarUsuario = async (usuarioGuardado: Usuario) => {
        if (usuarioEditando) {
            setUsuarios(prev => 
                prev.map(u => (u.id === usuarioGuardado.id ? usuarioGuardado : u))
            );
            toast.success('Usuario actualizado localmente');
            cerrarModal();
            return;
        }

        if (!usuarioGuardado.password) {
            toast.error('Debe ingresar una contraseña para el nuevo usuario');
            throw new Error('Falta contraseña');
        }

        const { data: authData, error: authError } = await authAdminClient.auth.signUp({
            email: usuarioGuardado.email,
            password: usuarioGuardado.password,
        });

        if (authError) {
            toast.error(`Error al registrar en Supabase Auth: ${authError.message}`);
            throw authError;
        }

        const userId = authData.user?.id;
        if (!userId) {
            toast.error('No se pudo obtener el ID del usuario en Supabase Auth');
            throw new Error('Sin userId');
        }

        try {
            const payload = {
                userId: userId,
                firstName: usuarioGuardado.nombre,
                lastName: usuarioGuardado.apellido,
                email: usuarioGuardado.email,
                role: USER_ROLE_MAP[usuarioGuardado.rol],
                rut: usuarioGuardado.rut,
                specialty: usuarioGuardado.especialidad || "",
                roleName: usuarioGuardado.cargo || "",
                phone: usuarioGuardado.telefono
            };

            await apiClient('/api/Staff', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Usuario creado exitosamente');
            setUsuarios(prev => [{ ...usuarioGuardado, id: userId }, ...prev]);
            cerrarModal();
        } catch (error: any) {
            toast.error(`Error al registrar en el servidor: ${error.message}`);
            throw error;
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setUsuarioEditando(null);
    };

    return(
        <>
           <div className="ContenendorPrincipal-GestionUsuarios">
                <div className="ContenedorSuperior-GestionUsuarios">
                    <button type="button" onClick={abrirModalAñadir}>Añadir Usuario</button>
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
                                                onClick={() => abrirModalEditar(usuario)}
                                            >
                                                <FaEdit className="Icono-Acciones"/>
                                            </button>
                                            <button
                                                type="button"
                                                className="Btn-Eliminar-GestionUsuarios"
                                                title="Eliminar usuario"
                                                onClick={() => eliminarUsuario(usuario.id)}
                                            >
                                                <FaTrash className="Icono-Acciones"/>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
           </div>

           <ModalUsuario
               isOpen={modalAbierto}
               onClose={cerrarModal}
               onGuardar={manejarGuardarUsuario}
               usuarioAEditar={usuarioEditando} 
           />
        </>
    )
}

export default GestionUsuariosAdministrador;