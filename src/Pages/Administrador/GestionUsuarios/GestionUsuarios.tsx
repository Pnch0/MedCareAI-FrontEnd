import "./GestionUsuarios.css";
import { FaSearch } from "react-icons/fa";

function GestionUsuariosAdministrador(){

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

                    </div>
                </div>
           </div>
        </>
    )
}

export default GestionUsuariosAdministrador;