import "./ResumenPage.css";
import { FaSearch } from "react-icons/fa";


function ResumenPageMedico(){
    const pacientes = [
        { id: 1, nombre: "Juan Pérez", edad: 22 , diagnostico: "Hipertensión", resumen: "Paciente estable, requiere monitoreo de presión arterial semanal." },
        { id: 2, nombre: "María Gómez", edad: 38 , diagnostico: "Diabetes Tipo 2", resumen: "Control de glucosa en rangos normales tras ajuste de dosis." },
        { id: 3, nombre: "Carlos Ruiz", edad: 22 , diagnostico: "Asma Moderada", resumen: "Uso de inhalador de rescate 2 veces esta semana." },
        { id: 4, nombre: "Ana Soto", edad: 30 , diagnostico: "Migraña Crónica", resumen: "Episodios reducidos con el nuevo tratamiento preventivo." },
        { id: 5, nombre: "Luis Torres", edad: 29 , diagnostico: "Lumbalgia", resumen: "Iniciando sesiones de kinesiología la próxima semana." },
        { id: 6, nombre: "Elena Castro", edad: 18 , diagnostico: "Ansiedad", resumen: "Terapia cognitivo-conductual en progreso con evolución favorable." },
    ];

    return(
        <>
        <div className="ContenedorPrincipal-ResumenMedico">
            <div className="ContenedorSuperior-ResumenMedico">
                <div className="ContenedorSuperior-Izquierda">
                    <h1>Resumen Pacientes</h1>
                </div>

                <div className="ContenedorSuperior-Derecha">
                    <div className="Contenedor-FiltradoPaciente">
                        <select id="filtro-rol">
                            <option value="todos">Todos</option>
                            <option value="admin">Administrador</option>
                            <option value="usuario">Usuario</option>
                            <option value="editor">Editor</option>
                        </select>
                    </div>
                    <div className="Contenedor-BuscadorPaciente">
                        <FaSearch className="Icono-Buscador"/><input type="text" placeholder="Buscar persona..." id="buscador" />
                    </div>
                </div>
            </div>
            <div className="ContenedorInferior-ResumenMedico">
                <div className="Contenedor-ListadoResumen">
                    {pacientes.map((paciente) => (
                        <div className="Tarjeta-Resumen" key={paciente.id}>
                            <h3>{paciente.nombre}</h3>
                            <p className="Edad-Paciente">Edad: {paciente.edad}</p>
                            <div className="Contenedor-InformacionPaciente">
                                <span className="Diagnostico">{paciente.diagnostico}</span>
                                <p>{paciente.resumen}</p>
                            </div>
                            <button className="Btn-VerMas">Ver ficha clínica</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </>
    )

}


export default ResumenPageMedico;