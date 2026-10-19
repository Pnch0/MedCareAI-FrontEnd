import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./GestionUsuarios.css";
import { FaSearch, FaEdit , FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { ModalUsuario, type Usuario, type RolUsuario } from "../../../Components/ModalUsuario/ModalUsuario.tsx";
import { apiClient } from "../../../Services/apiClient.ts";
import { supabase } from "../../../Services/supabaseClient.ts";

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

const ROL_REVERSO_MAP: Record<number, RolUsuario> = {
    0: 'paciente',
    1: 'recepcionista',
    2: 'medico',
    3: 'administrador'
};

const mapearRol = (role: number | string): RolUsuario => {
    if (typeof role === 'number') {
        return ROL_REVERSO_MAP[role] || 'recepcionista';
    }
    const r = String(role).toLowerCase();
    if (r === 'administrador' || r === 'admin') return 'administrador';
    if (r === 'medico') return 'medico';
    if (r === 'recepcionista') return 'recepcionista';
    if (r === 'paciente') return 'paciente';
    return 'recepcionista';
};

function GestionUsuariosAdministrador(){
    const [searchParams, setSearchParams] = useSearchParams();

    const getInitialRole = (): string => {
        const r = searchParams.get('role');
        if (!r) return 'todos';
        const rLower = r.toLowerCase();
        if (rLower === '2' || rLower === 'medico') return 'medico';
        if (rLower === '1' || rLower === 'recepcionista') return 'recepcionista';
        if (rLower === '3' || rLower === 'admin' || rLower === 'administrador') return 'admin';
        if (rLower === '0' || rLower === 'paciente') return 'paciente';
        return 'todos';
    };

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [rolSeleccionado, setRolSeleccionado] = useState<string>(getInitialRole);
    const [busqueda, setBusqueda] = useState<string>('');
    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState<boolean>(true);

    const cargarUsuarios = async (rolFiltro: string = rolSeleccionado) => {
        try {
            setCargando(true);
            let endpoint = '/api/Staff';

            if (rolFiltro !== 'todos') {
                const rolKey = rolFiltro === 'admin' ? 'administrador' : (rolFiltro as RolUsuario);
                const roleNumber = USER_ROLE_MAP[rolKey];
                if (roleNumber !== undefined) {
                    endpoint = `/api/Staff?role=${roleNumber}`;
                }
            }

            const data = await apiClient(endpoint, { method: 'GET' });
            if (Array.isArray(data)) {
                const listado: Usuario[] = data.map((item: any) => ({
                    id: String(item.id || item.staffId || crypto.randomUUID()),
                    rut: item.rut || '',
                    nombre: item.firstName || '',
                    apellido: item.lastName || '',
                    email: item.email || '',
                    rol: mapearRol(item.role),
                    especialidad: item.specialty || null,
                    cargo: item.roleName || null,
                    telefono: item.phone || '',
                    estado: item.isActive !== undefined ? (item.isActive ? 'activo' : 'inactivo') : 'activo'
                }));
                setUsuarios(listado);
            }
        } catch (error: any) {
            toast.error(`Error al cargar usuarios: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        const rolActual = getInitialRole();
        setRolSeleccionado(rolActual);
        cargarUsuarios(rolActual);
    }, [searchParams]);

    const manejarCambioRol = (nuevoRol: string) => {
        setRolSeleccionado(nuevoRol);
        const nuevosParams = new URLSearchParams(searchParams);
        if (nuevoRol === 'todos') {
            nuevosParams.delete('role');
        } else {
            nuevosParams.set('role', nuevoRol);
        }
        setSearchParams(nuevosParams, { replace: true });
        cargarUsuarios(nuevoRol);
    };

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
            try {
                const payload = {
                    staffId: usuarioGuardado.id,
                    firstName: usuarioGuardado.nombre,
                    lastName: usuarioGuardado.apellido,
                    rut: usuarioGuardado.rut,
                    phone: usuarioGuardado.telefono || "",
                    roleName: usuarioGuardado.cargo || "",
                    isActive: usuarioGuardado.estado === 'activo',
                    specialty: usuarioGuardado.especialidad || "",
                    role: USER_ROLE_MAP[usuarioGuardado.rol]
                };

                await apiClient(`/api/Staff/${usuarioGuardado.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                try {
                    await supabase
                        .from('usuarios')
                        .update({ rol: usuarioGuardado.rol })
                        .eq('id', usuarioGuardado.id);
                } catch (supaErr) {
                    console.warn('Error al actualizar rol en Supabase:', supaErr);
                }

                toast.success('Usuario actualizado exitosamente');
                await cargarUsuarios(rolSeleccionado);
                cerrarModal();
                return;
            } catch (error: any) {
                toast.error(`Error al actualizar usuario: ${error.message}`);
                throw error;
            }
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

            try {
                const { error: userTableError } = await supabase
                    .from('usuarios')
                    .upsert({
                        id: userId,
                        email: usuarioGuardado.email,
                        rol: usuarioGuardado.rol,
                        CreatedAt: new Date().toISOString()
                    });

                if (userTableError) {
                    await supabase
                        .from('usuarios')
                        .update({ rol: usuarioGuardado.rol })
                        .eq('id', userId);
                }
            } catch (supaErr) {
                console.warn('Error al guardar rol en tabla usuarios:', supaErr);
            }

            toast.success('Usuario creado exitosamente');
            await cargarUsuarios(rolSeleccionado);
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

    const usuariosFiltrados = usuarios.filter((usuario) => {
        if (!busqueda.trim()) return true;
        const termino = busqueda.toLowerCase().trim();
        return (
            usuario.nombre.toLowerCase().includes(termino) ||
            usuario.apellido.toLowerCase().includes(termino) ||
            usuario.rut.toLowerCase().includes(termino) ||
            usuario.email.toLowerCase().includes(termino) ||
            usuario.rol.toLowerCase().includes(termino) ||
            (usuario.especialidad && usuario.especialidad.toLowerCase().includes(termino))
        );
    });

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
                                    <select 
                                        id="filtro-rol"
                                        value={rolSeleccionado}
                                        onChange={(e) => manejarCambioRol(e.target.value)}
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="paciente">Paciente</option>
                                        <option value="admin">Administrador</option>
                                        <option value="medico">Medico</option>
                                        <option value="recepcionista">Recepcionista</option>
                                    </select>
                                </div>
                                <div className="ContenedorBuscador-GestionUsuarios">
                                    <FaSearch className="Icono-Buscador"/>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar persona..." 
                                        id="buscador"
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
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
                            {cargando ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                    Cargando usuarios...
                                </div>
                            ) : usuariosFiltrados.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                    No hay usuarios registrados.
                                </div>
                            ) : (
                                usuariosFiltrados.map((usuario) => (
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
                                ))
                            )}
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