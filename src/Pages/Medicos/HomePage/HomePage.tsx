import { useState, useEffect } from "react";
import "./HomePage.css";
import {
    obtenerAgendaDiariaMedico,
    obtenerCitasLocales,
    formatearFechaISO,
    obtenerIndiceDia,
    MEDICO_DEFAULT_ID,
    type Cita
} from "../../../Services/agenda.ts";

interface CitaAgendaCard {
    id: string;
    paciente: string;
    hora: string;
    motivo: string;
    box: string | number;
    estado: 'pendiente' | 'en-curso' | 'finalizada';
    estadoTexto: string;
}

const LOCAL_ESTADOS_CITAS_KEY = 'medcare_gestion_estados_citas';

function HomePageMedico(){
    const nombreUsuario = localStorage.getItem('userName') || 'Médico';
    const [citasDelDia, setCitasDelDia] = useState<CitaAgendaCard[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);

    useEffect(() => {
        let cancelado = false;

        const cargarAgenda = async () => {
            try {
                setCargando(true);
                const hoy = new Date();
                const fechaHoyStr = formatearFechaISO(hoy);
                const diaHoyIndice = obtenerIndiceDia(hoy);
                const staffId = localStorage.getItem('staffId') || localStorage.getItem('medicoId') || MEDICO_DEFAULT_ID;

                // 1. Obtener estados de citas registrados
                let estadosGuardados: Record<string, string> = {};
                try {
                    const raw = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                    if (raw) estadosGuardados = JSON.parse(raw);
                } catch {}

                // 2. Cargar citas desde backend y respaldo local
                const citasBackend = await obtenerAgendaDiariaMedico(staffId, hoy);
                const citasLocales = obtenerCitasLocales();

                const mapaCitas = new Map<string, Cita>();
                for (const c of citasBackend) {
                    mapaCitas.set(c.id, c);
                }
                for (const c of citasLocales) {
                    const coincideFecha = c.fecha === fechaHoyStr;
                    const coincideDia = c.dia === diaHoyIndice;
                    if ((coincideFecha || coincideDia) && !mapaCitas.has(c.id)) {
                        mapaCitas.set(c.id, c);
                    }
                }

                const listaCards: CitaAgendaCard[] = [];
                for (const [id, c] of mapaCitas.entries()) {
                    const estado = (estadosGuardados[id] || 'pendiente') as 'pendiente' | 'en-curso' | 'finalizada';
                    let estadoTexto = 'Pendiente';
                    if (estado === 'en-curso') estadoTexto = 'En curso';
                    if (estado === 'finalizada') estadoTexto = 'Finalizada';

                    listaCards.push({
                        id: c.id,
                        paciente: c.paciente || 'Paciente',
                        hora: c.hora || '09:00 - 10:00',
                        motivo: c.motivo || 'Consulta médica general',
                        box: c.box || 1,
                        estado,
                        estadoTexto
                    });
                }

                // Ordenar cronológicamente por hora de inicio
                listaCards.sort((a, b) => a.hora.localeCompare(b.hora));

                if (!cancelado) {
                    setCitasDelDia(listaCards);
                }
            } catch (error) {
                console.error('Error al cargar agenda del día en HomePageMedico:', error);
            } finally {
                if (!cancelado) {
                    setCargando(false);
                }
            }
        };

        cargarAgenda();
        return () => { cancelado = true; };
    }, []);

    return(
        <>
        <div className="ContenedorPrincipal-HomeMedico">
            <div className="ContenedorNombre-HomeMedico">
                <h1>Bienvenido {nombreUsuario}</h1>
            </div>
            <div className="Contenedor-DashboardMedico">
                <div className="ContenedorDarboard-Izquierda">
                    <div className="Contenedor-AgendaMedico">
                        <div className="Contenedor-EncabezadoAgenda">
                            <h2>Agenda</h2>
                        </div>
                        <div className="Contenedor-ListadoAgenda">
                            {cargando ? (
                                <div className="Agenda-Vacia">
                                    <p>Cargando citas del día...</p>
                                </div>
                            ) : citasDelDia.length === 0 ? (
                                <div className="Agenda-Vacia">
                                    <p>No tienes citas programadas para el día de hoy.</p>
                                </div>
                            ) : (
                                citasDelDia.map((cita) => (
                                    <div key={cita.id} className="Card-ListadoAgenda">
                                        <div className="Card-ListadoAgenda-Izquierda">
                                            <div className="Card-PacienteHeader">
                                                <h3 className="Card-PacienteNombre">{cita.paciente}</h3>
                                                <span className="Card-BoxBadge">Box {cita.box}</span>
                                            </div>
                                            <p className="Card-MotivoConsulta">
                                                <strong>Motivo:</strong> {cita.motivo}
                                            </p>
                                        </div>
                                        <div className="Card-ListadoAgenda-Derecha">
                                            <span className="Card-HoraBadge">{cita.hora}</span>
                                            <span className={`Card-EstadoBadge ${cita.estado}`}>
                                                {cita.estadoTexto}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="ContenedorDarboard-Derecha">
                    <div className="Contenedor-ResumenClinico">
                        <div className="Titulo-ResumenClinico">
                            <h3>Resumen Clinico</h3>
                        </div>
                        <div className="ContenedorListado-ResumenClinico">
                            <h3>Juan Perez</h3>
                            <p>Edad: 50 años</p>
                            <div className="ContenedorDiagnostico-ResumenClinico">
                                
                            </div>
                        </div>
                        
                    </div>
                    <div className="Contenedor-ControlCita">
                        <div className="Titulo-ControlCita">
                            <h3>Control Gestion de Cita</h3>
                        </div>
                        <div className="ContenedorListado-ControlCita">
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default HomePageMedico;
