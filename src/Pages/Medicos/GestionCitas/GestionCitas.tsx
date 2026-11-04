import { useEffect, useMemo, useState } from "react";
import "./GestionCitas.css";
import { toast } from "sonner";
import { supabase } from "../../../Services/supabaseClient.ts";
import {
    obtenerAgendaDiariaMedico,
    obtenerCitasLocales,
    formatearFechaISO,
    obtenerIndiceDia,
    MEDICO_DEFAULT_ID,
    type Cita
} from "../../../Services/agenda.ts";

export type EstadoCita = 'pendiente' | 'en-curso' | 'finalizada';

export type CitaGestion = {
    id: string;
    paciente: string;
    edad: number;
    horaInicio: string;
    horaFin: string;
    estado: EstadoCita;
};

const LOCAL_ESTADOS_CITAS_KEY = 'medcare_gestion_estados_citas';

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

function GestionCitasMedico(){
    const [citas, setCitas] = useState<CitaGestion[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);

    const cargarCitasDelDia = async () => {
        setCargando(true);
        try {
            const hoy = new Date();
            const fechaHoyStr = formatearFechaISO(hoy);
            const diaHoyIndice = obtenerIndiceDia(hoy);
            const staffId = localStorage.getItem('staffId') || localStorage.getItem('medicoId') || MEDICO_DEFAULT_ID;

            // 1. Consultar edades de pacientes en Supabase
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
            } catch {
                // Fallback silencioso
            }

            // 2. Obtener estados guardados localmente
            let estadosGuardados: Record<string, EstadoCita> = {};
            try {
                const rawEstados = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                if (rawEstados) estadosGuardados = JSON.parse(rawEstados);
            } catch {
                // Ignorar
            }

            // 3. Consultar citas del día en la agenda
            const citasBackend = await obtenerAgendaDiariaMedico(staffId, hoy);
            const citasLocales = obtenerCitasLocales();

            const mapaCitas = new Map<string, Cita>();

            // Agregar citas devueltas por la agenda diaria
            for (const c of citasBackend) {
                mapaCitas.set(c.id, c);
            }

            // Agregar citas locales que coincidan con la fecha o día de hoy
            for (const c of citasLocales) {
                const coincideFecha = c.fecha === fechaHoyStr;
                const coincideDia = c.dia === diaHoyIndice;
                if ((coincideFecha || coincideDia) && !mapaCitas.has(c.id)) {
                    mapaCitas.set(c.id, c);
                }
            }

            // 4. Mapear a CitaGestion filtrando las que ya están finalizadas
            const listaGestion: CitaGestion[] = [];

            for (const [id, cita] of mapaCitas.entries()) {
                const estadoActual = estadosGuardados[id] || 'pendiente';
                // Si la cita ya fue finalizada por el médico, no se lista en pendientes
                if (estadoActual === 'finalizada') {
                    continue;
                }

                const partesHora = (cita.hora || '09:00 - 10:00').split('-').map(s => s.trim());
                const horaInicio = partesHora[0] || '09:00';
                const horaFin = partesHora[1] || '10:00';

                const pacienteNorm = normalizarTexto(cita.paciente || '');
                let edad = 24;
                if (mapaEdades.has(pacienteNorm)) {
                    edad = mapaEdades.get(pacienteNorm)!;
                } else {
                    for (const [nom, ed] of mapaEdades.entries()) {
                        if (pacienteNorm.includes(nom) || nom.includes(pacienteNorm)) {
                            edad = ed;
                            break;
                        }
                    }
                }

                listaGestion.push({
                    id: cita.id,
                    paciente: cita.paciente || 'Paciente',
                    edad,
                    horaInicio,
                    horaFin,
                    estado: estadoActual
                });
            }

            setCitas(listaGestion);
        } catch (error) {
            console.error('Error al cargar citas del día para gestión:', error);
            toast.error('Error al cargar citas de la agenda');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCitasDelDia();
    }, []);

    const citasOrdenadas = useMemo(
        () => [...citas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
        [citas]
    );

    const iniciarCita = (id: string) => {
        try {
            let estadosGuardados: Record<string, EstadoCita> = {};
            try {
                const raw = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                if (raw) estadosGuardados = JSON.parse(raw);
            } catch {}

            estadosGuardados[id] = 'en-curso';
            localStorage.setItem(LOCAL_ESTADOS_CITAS_KEY, JSON.stringify(estadosGuardados));

            setCitas(prev => prev.map(cita => cita.id === id ? { ...cita, estado: 'en-curso' } : cita));
            toast.info('Cita médica iniciada');
        } catch (err: any) {
            toast.error(`Error al iniciar cita: ${err.message}`);
        }
    };

    const finalizarCita = (id: string) => {
        try {
            let estadosGuardados: Record<string, EstadoCita> = {};
            try {
                const raw = localStorage.getItem(LOCAL_ESTADOS_CITAS_KEY);
                if (raw) estadosGuardados = JSON.parse(raw);
            } catch {}

            estadosGuardados[id] = 'finalizada';
            localStorage.setItem(LOCAL_ESTADOS_CITAS_KEY, JSON.stringify(estadosGuardados));

            setCitas(prev => prev.filter(cita => cita.id !== id));
            toast.success('Cita médica finalizada exitosamente');
        } catch (err: any) {
            toast.error(`Error al finalizar cita: ${err.message}`);
        }
    };

    return(
        <>
        <div className="ContenedorPrincipal-GestionCitas">
            <div className="ContenedorTitulo-GestionCitas">
                <h1>Gestión de Citas</h1>
            </div>
            <div className="ContenedorListado-GestionCitas">
                {cargando ? (
                    <div className="ContenedorVacio-GestionCitas">
                        <p className="ListadoVacio-GestionCitas">Cargando citas del día...</p>
                    </div>
                ) : citasOrdenadas.length === 0 ? (
                    <div className="ContenedorVacio-GestionCitas">
                        <p className="ListadoVacio-GestionCitas">No hay citas pendientes por gestionar para el día de hoy</p>
                    </div>
                ) : (
                    <div className="Tarjetas-GestionCitas">
                        {citasOrdenadas.map((cita) => (
                            <div key={cita.id} className="Tarjeta-GestionCitas">
                                <h3>{cita.paciente}</h3>
                                <p className="Edad-Cita">Edad: {cita.edad}</p>
                                <p className="Hora-Cita">Hora: {cita.horaInicio} - {cita.horaFin}</p>
                                {cita.estado === 'pendiente' ? (
                                    <button
                                        type="button"
                                        className="Btn-Accion-Cita Iniciar"
                                        onClick={() => iniciarCita(cita.id)}
                                    >
                                        Iniciar cita
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="Btn-Accion-Cita Finalizar"
                                        onClick={() => finalizarCita(cita.id)}
                                    >
                                        Finalizar cita
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </>
    );

}

export default GestionCitasMedico;
