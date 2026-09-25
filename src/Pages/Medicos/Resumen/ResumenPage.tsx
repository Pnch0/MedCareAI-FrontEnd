import { useState } from "react";
import "./ResumenPage.css";
import { FaSearch } from "react-icons/fa";

type Paciente = {
    id: number;
    nombre: string;
    edad: number;
    diagnostico: string;
    resumen: string;
    diagnosticoCompleto: string;
}

function ResumenPageMedico(){
    const [modalAbierto, setModalAbierto] = useState(false);
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

    const pacientes: Paciente[] = [
        { id: 1, nombre: "Juan Pérez", edad: 22 , diagnostico: "Hipertensión", resumen: "Paciente estable, requiere monitoreo de presión arterial semanal.", diagnosticoCompleto: "Paciente masculino de 22 años. Presenta presión arterial elevada. Se recomienda dieta baja en sodio y medicación diaria." },
        { id: 2, nombre: "María Gómez", edad: 38 , diagnostico: "Diabetes Tipo 2", resumen: "Control de glucosa en rangos normales tras ajuste de dosis.", diagnosticoCompleto: "Paciente femenina de 38 años. Diabetes mellitus tipo 2 controlada con Metformina. Requiere evaluación nutricional mensual." },
        { id: 3, nombre: "Carlos Ruiz", edad: 22 , diagnostico: "Asma Moderada", resumen: "Uso de inhalador de rescate 2 veces esta semana.", diagnosticoCompleto: "Paciente masculino de 22 años. Cuadro de asma con exacerbaciones leves. Tratamiento con Salbutamol PRN." },
        { id: 4, nombre: "Ana Soto", edad: 30 , diagnostico: "Migraña Crónica", resumen: "Episodios reducidos con el nuevo tratamiento preventivo.", diagnosticoCompleto: "Paciente femenina de 30 años. Presenta migraña con aura. En tratamiento preventivo con Topiramato." },
        { id: 5, nombre: "Luis Torres", edad: 29 , diagnostico: "Lumbalgia", resumen: "Iniciando sesiones de kinesiología la próxima semana.", diagnosticoCompleto: "Paciente masculino de 29 años. Dolor en zona lumbar baja por esfuerzo físico. Tratamiento con AINEs y fisioterapia." },
        { id: 6, nombre: "Elena Castro", edad: 18 , diagnostico: "Ansiedad", resumen: "Terapia cognitivo-conductual en progreso con evolución favorable.", diagnosticoCompleto: "Paciente femenina de 18 años. Trastorno de ansiedad generalizada. Asiste a psicoterapia con buena respuesta." },
    ];

    const abrirModal = (paciente: Paciente) => {
        setPacienteSeleccionado(paciente);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setPacienteSeleccionado(null);
    };

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
                            <button className="Btn-VerMas" onClick={() => abrirModal(paciente)}>Ver ficha clínica</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {modalAbierto && pacienteSeleccionado && (
            <div className="Modal-FondoOscuro" onClick={cerrarModal}>
                <div className="Modal-Caja" onClick={(e) => e.stopPropagation()}>
                    <div className="Modal-Cabecera">
                        <h2>Ficha Clínica Completa</h2>
                        <button className="Btn-CerrarModal" onClick={cerrarModal}>X</button>
                    </div>
                    
                    <div className="Modal-Cuerpo">
                        <p><strong>Paciente:</strong> {pacienteSeleccionado.nombre}</p>
                        <p><strong>Edad:</strong> {pacienteSeleccionado.edad} años</p>
                        <p><strong>Diagnóstico Principal:</strong> {pacienteSeleccionado.diagnostico}</p>
                        
                        <div className="Diagnostico-Completo-Caja">
                            <h4>Evolución y Diagnóstico Detallado</h4>
                            <p>{pacienteSeleccionado.diagnosticoCompleto}</p>
                        </div>
                    </div>

                    <div className="Modal-Pie">
                        <button className="Btn-Accion" onClick={cerrarModal}>Cerrar</button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default ResumenPageMedico;