import { useState, useEffect } from "react";
import "./HomePage.css";
import { supabase } from "../../../Services/supabaseClient.ts";
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

interface PacienteResumenClinico {
    nombre: string;
    edad: number;
    hora: string;
    box: string | number;
    diagnostico: string;
    resumen: string;
    estado: string;
}

const LOCAL_ESTADOS_CITAS_KEY = 'medcare_gestion_estados_citas';
const LOCAL_FICHAS_KEY = 'medcare_fichas_clinicas';

function calcularEdad(fechaNacimiento?: string): number {
    if (!fechaNacimiento) return 24;
    const nac = new Date(fechaNacimiento);
    if (isNaN(nac.getTime())) return 24;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return Math.max(0, edad);
}

function normalizarTexto(texto: string): string {
    return (texto || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function HomePageMedico(){
    const nombreUsuario = localStorage.getItem('userName') || 'Médico';
    const [citasDelDia, setCitasDelDia] = useState<CitaAgendaCard[]>([]);
    const [resumenCercano, setResumenCercano] = useState<PacienteResumenClinico | null>(null);
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

                // 2. Obtener fichas clínicas guardadas localmente
                let fichasGuardadas: Record<string, any> = {};
                try {
                    const rawFichas = localStorage.getItem(LOCAL_FICHAS_KEY);
                    if (rawFichas) fichasGuardadas = JSON.parse(rawFichas);
                } catch {}

                // 3. Consultar edades de pacientes en Supabase
                const mapaEdades = new Map<string, number>();
                try {
                    const { data: dbPacientes } = await supabase
                        .from('pacientes')
                        .select('nombre, apellido, fecha_nacimiento');
                    if (Array.isArray(dbPacientes)) {
                        for (const p of dbPacientes) {
                            const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim();
                            const edad = calcularEdad(p.fecha_nacimiento);
                            if (nombreCompleto) mapaEdades.set(normalizarTexto(nombreCompleto), edad);
                            if (p.nombre) mapaEdades.set(normalizarTexto(p.nombre), edad);
                        }
                    }
                } catch {}

                // 4. Cargar citas desde backend y respaldo local
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

                    // 5. Determinar la cita más cercana para el Resumen Clínico
                    if (listaCards.length > 0) {
                        // Prioridad 1: Cita en curso
                        let citaCercana = listaCards.find(c => c.estado === 'en-curso');

                        // Prioridad 2: Próxima cita pendiente más cercana al horario actual
                        if (!citaCercana) {
                            const ahora = new Date();
                            const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

                            const pendientes = listaCards.filter(c => c.estado === 'pendiente');
                            if (pendientes.length > 0) {
                                citaCercana = pendientes.find(c => {
                                    const [ini] = c.hora.split('-').map(s => s.trim());
                                    const [h, m] = (ini || '09:00').split(':').map(Number);
                                    const minCita = (h || 9) * 60 + (m || 0);
                                    return minCita >= minutosAhora - 30;
                                }) || pendientes[0];
                            }
                        }

                        // Prioridad 3: Primera cita del día
                        if (!citaCercana) {
                            citaCercana = listaCards[0];
                        }

                        if (citaCercana) {
                            const pacNorm = normalizarTexto(citaCercana.paciente);
                            let edad = 24;
                            if (mapaEdades.has(pacNorm)) {
                                edad = mapaEdades.get(pacNorm)!;
                            } else {
                                for (const [nom, ed] of mapaEdades.entries()) {
                                    if (pacNorm.includes(nom) || nom.includes(pacNorm)) {
                                        edad = ed;
                                        break;
                                    }
                                }
                            }

                            // Buscar si tiene ficha clínica previa registrada
                            const ficha = fichasGuardadas[citaCercana.id] || fichasGuardadas[pacNorm];

                            let diagnostico = 'Consulta en espera';
                            let resumen = `Motivo de consulta: ${citaCercana.motivo}`;

                            if (ficha) {
                                diagnostico = ficha.diagnostico || 'Atención registrada';
                                resumen = ficha.diagnosticoCompleto || ficha.resumen || resumen;
                            } else if (citaCercana.motivo) {
                                diagnostico = 'Primera evaluación';
                                resumen = `Síntomas referidos: "${citaCercana.motivo}". En espera de evaluación clínica.`;
                            }

                            setResumenCercano({
                                nombre: citaCercana.paciente,
                                edad,
                                hora: citaCercana.hora,
                                box: citaCercana.box,
                                diagnostico,
                                resumen,
                                estado: citaCercana.estadoTexto
                            });
                        } else {
                            setResumenCercano(null);
                        }
                    } else {
                        setResumenCercano(null);
                    }
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
                        {resumenCercano ? (
                            <div className="ContenedorListado-ResumenClinico">
                                <div className="ResumenClinico-Header">
                                    <h3>{resumenCercano.nombre}</h3>
                                    <span className="ResumenClinico-Badge">{resumenCercano.hora} (Box {resumenCercano.box})</span>
                                </div>
                                <p className="ResumenClinico-Subtitulo">
                                    Edad: {resumenCercano.edad} años • Estado: <span className="Estado-Texto">{resumenCercano.estado}</span>
                                </p>
                                <div className="ContenedorDiagnostico-ResumenClinico">
                                    <p className="TituloDiagnostico"><strong>Diagnóstico:</strong> {resumenCercano.diagnostico}</p>
                                    <p className="TextoDiagnostico">{resumenCercano.resumen}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="ContenedorListado-ResumenClinico Vacio">
                                <p className="TextoVacio">
                                    {cargando ? "Cargando información clínica..." : "No hay citas programadas para el día de hoy."}
                                </p>
                            </div>
                        )}
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
