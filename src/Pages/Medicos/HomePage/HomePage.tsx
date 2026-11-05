import { useState, useEffect, useMemo } from "react";
import "./HomePage.css";
import { toast } from "sonner";
import { supabase } from "../../../Services/supabaseClient.ts";
import {
    obtenerAgendaDiariaMedico,
    obtenerCitasLocales,
    actualizarEstadoCitaBackend,
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
    const [mapaEdades, setMapaEdades] = useState<Map<string, number>>(new Map());
    const [fichasGuardadas, setFichasGuardadas] = useState<Record<string, any>>({});
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
                let fichas: Record<string, any> = {};
                try {
                    const rawFichas = localStorage.getItem(LOCAL_FICHAS_KEY);
                    if (rawFichas) fichas = JSON.parse(rawFichas);
                } catch {}

                // 3. Consultar edades de pacientes en Supabase
                const edadesMap = new Map<string, number>();
                try {
                    const { data: dbPacientes } = await supabase
                        .from('pacientes')
                        .select('nombre, apellido, fecha_nacimiento');
                    if (Array.isArray(dbPacientes)) {
                        for (const p of dbPacientes) {
                            const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim();
                            const edad = calcularEdad(p.fecha_nacimiento);
                            if (nombreCompleto) edadesMap.set(normalizarTexto(nombreCompleto), edad);
                            if (p.nombre) edadesMap.set(normalizarTexto(p.nombre), edad);
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
                    setMapaEdades(edadesMap);
                    setFichasGuardadas(fichas);
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

    // Determinar de forma reactiva la cita más cercana para el Resumen Clínico
    const resumenCercano = useMemo<PacienteResumenClinico | null>(() => {
        if (citasDelDia.length === 0) return null;

        // Prioridad 1: Cita en curso
        let citaCercana = citasDelDia.find(c => c.estado === 'en-curso');

        // Prioridad 2: Próxima cita pendiente más cercana al horario actual
        if (!citaCercana) {
            const ahora = new Date();
            const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

            const pendientes = citasDelDia.filter(c => c.estado === 'pendiente');
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
            citaCercana = citasDelDia[0];
        }

        if (!citaCercana) return null;

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

        return {
            nombre: citaCercana.paciente,
            edad,
            hora: citaCercana.hora,
            box: citaCercana.box,
            diagnostico,
            resumen,
            estado: citaCercana.estadoTexto
        };
    }, [citasDelDia, mapaEdades, fichasGuardadas]);

    // Determinar de forma reactiva la cita más cercana para el Control de Gestión
    const citaControlActiva = useMemo(() => {
        // Prioridad 1: Cita actualmente en curso
        const enCurso = citasDelDia.find(c => c.estado === 'en-curso');
        if (enCurso) return enCurso;

        // Prioridad 2: Próxima cita pendiente
        const pendiente = citasDelDia.find(c => c.estado === 'pendiente');
        if (pendiente) return pendiente;

        return null;
    }, [citasDelDia]);

    const handleIniciarCita = async (id: string) => {
        try {
            // 1. Notificar al AppointmentsController en el backend
            await actualizarEstadoCitaBackend(id, 'en_curso');

            // 2. Persistir en almacenamiento local de respaldo
            let estadosGuardados: Record<string, string> = {};
            try {
                const raw = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                if (raw) estadosGuardados = JSON.parse(raw);
            } catch {}

            estadosGuardados[id] = 'en-curso';
            localStorage.setItem(LOCAL_ESTADOS_CITAS_KEY, JSON.stringify(estadosGuardados));

            // 3. Actualizar estado reactivo
            setCitasDelDia(prev => prev.map(c => c.id === id ? { ...c, estado: 'en-curso', estadoTexto: 'En curso' } : c));
            toast.info('Cita médica iniciada');
        } catch (err: any) {
            toast.error(`Error al iniciar cita: ${err.message}`);
        }
    };

    const handleFinalizarCita = async (id: string) => {
        try {
            // 1. Notificar al AppointmentsController en el backend
            await actualizarEstadoCitaBackend(id, 'finalizada');

            // 2. Persistir en almacenamiento local de respaldo
            let estadosGuardados: Record<string, string> = {};
            try {
                const raw = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                if (raw) estadosGuardados = JSON.parse(raw);
            } catch {}

            estadosGuardados[id] = 'finalizada';
            localStorage.setItem(LOCAL_ESTADOS_CITAS_KEY, JSON.stringify(estadosGuardados));

            // 3. Actualizar estado reactivo (automáticamente pasa a la siguiente)
            setCitasDelDia(prev => prev.map(c => c.id === id ? { ...c, estado: 'finalizada', estadoTexto: 'Finalizada' } : c));
            toast.success('Cita médica finalizada exitosamente');
        } catch (err: any) {
            toast.error(`Error al finalizar cita: ${err.message}`);
        }
    };

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
                        {citaControlActiva ? (
                            <div className="ContenedorListado-ControlCita">
                                <div className="ControlCita-Header">
                                    <h3>{citaControlActiva.paciente}</h3>
                                    <span className="ControlCita-BoxBadge">Box {citaControlActiva.box}</span>
                                </div>
                                <div className="ControlCita-InfoRow">
                                    <p className="ControlCita-Hora">
                                        <strong>Horario:</strong> {citaControlActiva.hora}
                                    </p>
                                    <p className="ControlCita-Motivo">
                                        <strong>Motivo:</strong> {citaControlActiva.motivo}
                                    </p>
                                </div>
                                <div className="ControlCita-AccionRow">
                                    <div className="ControlCita-EstadoInfo">
                                        <span>Estado:</span>
                                        <span className={`ControlCita-EstadoBadge ${citaControlActiva.estado}`}>
                                            {citaControlActiva.estadoTexto}
                                        </span>
                                    </div>
                                    {citaControlActiva.estado === 'pendiente' ? (
                                        <button
                                            type="button"
                                            className="Btn-ControlCita Iniciar"
                                            onClick={() => handleIniciarCita(citaControlActiva.id)}
                                        >
                                            Iniciar cita
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="Btn-ControlCita Finalizar"
                                            onClick={() => handleFinalizarCita(citaControlActiva.id)}
                                        >
                                            Finalizar cita
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="ContenedorListado-ControlCita Vacio">
                                <p className="TextoVacio">
                                    {cargando ? "Cargando control de citas..." : "No hay citas pendientes por gestionar hoy."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default HomePageMedico;
