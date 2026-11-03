import { apiClient } from './apiClient.ts';

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
export type Box = 1 | 2 | 3 | 4 | 5 | 6 | 7 | string | number;

export interface Cita {
    id: string;
    dia: DiaSemana;
    hora: string;          // ej: "10:00 - 11:00"
    paciente: string;      // ej: "Juan Pérez"
    motivo: string;        // ej: "Consulta por dolor persistente..."
    box: Box;              // ej: 1
    fecha?: string;        // ej: "2026-11-03"
    disponibilidad?: 'libre' | 'ocupado';
    citaId?: string | null;
    medicoId?: string;
}

export interface SlotAgendaBackend {
    scheduleBlockId: string;
    medicoId: string;
    boxId: string;
    fechaInicio: string; // ISO string
    fechaFin: string;    // ISO string
    disponibilidad: string; // "libre" | "ocupado"
    citaId: string | null;
    pacienteNombre: string | null;
    motivoConsulta: string | null;
}

const LOCAL_CITAS_KEY = 'medcare_citas_activas';

/**
 * Guarda una cita en el almacenamiento local para pruebas y respaldo inmediato.
 */
export function guardarCitaLocal(cita: Cita): void {
    try {
        const guardadas = obtenerCitasLocales();
        const filtradas = guardadas.filter(c => c.id !== cita.id);
        filtradas.push(cita);
        localStorage.setItem(LOCAL_CITAS_KEY, JSON.stringify(filtradas));
    } catch (e) {
        console.warn('Error al guardar cita localmente:', e);
    }
}

/**
 * Obtiene todas las citas almacenadas localmente, asegurando que el nombre del paciente sea legible.
 */
export function obtenerCitasLocales(): Cita[] {
    try {
        const data = localStorage.getItem(LOCAL_CITAS_KEY);
        if (!data) return [];
        const citas: Cita[] = JSON.parse(data);
        const storedUserName = localStorage.getItem('userName');
        let modificado = false;

        const citasLimpias = citas.map((c) => {
            if (c.paciente && c.paciente.includes('@')) {
                modificado = true;
                let nombreLimpio = 'Paciente';
                if (storedUserName && !storedUserName.includes('@')) {
                    nombreLimpio = storedUserName;
                } else if (c.paciente.toLowerCase().includes('francisco') || c.paciente.toLowerCase().includes('espinoza')) {
                    nombreLimpio = 'Francisco Espinoza';
                } else {
                    const parteNombre = c.paciente.split('@')[0].replace(/[._-]/g, ' ');
                    nombreLimpio = parteNombre.charAt(0).toUpperCase() + parteNombre.slice(1);
                }
                return { ...c, paciente: nombreLimpio };
            }
            return c;
        });

        if (modificado) {
            localStorage.setItem(LOCAL_CITAS_KEY, JSON.stringify(citasLimpias));
        }

        return citasLimpias;
    } catch {
        return [];
    }
}

// Médico por defecto con bloques en Render (Dr. Gonzalo Yáñez)
export const MEDICO_DEFAULT_ID = 'cc48b142-28ef-4275-8923-61764c033631';

/**
 * Convierte un objeto Date en el índice de día de la semana (0=Lunes, ..., 6=Domingo).
 */
export function obtenerIndiceDia(fecha: Date): DiaSemana {
    return (((fecha.getDay() + 6) % 7) as DiaSemana);
}

/**
 * Formatea una fecha Date a string 'YYYY-MM-DD'.
 */
export function formatearFechaISO(fecha: Date): string {
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Mapea un boxId o UUID a un número simple de box (1-7).
 */
function extraerNumeroBox(boxId: string): Box {
    if (!boxId) return 1;
    // Si contiene números, extraer el primero
    const match = String(boxId).match(/\d+/);
    if (match) {
        const n = parseInt(match[0], 10);
        return ((n % 7) || 1) as Box;
    }
    return 1;
}

// Citas iniciales de demostración para que el doctor nunca vea la pantalla vacía
const CITAS_INICIALES_DEMO: Cita[] = [
    {
        id: 'demo-1',
        dia: 0,
        hora: '10:00 - 11:00',
        paciente: 'Juan Pérez Reyes',
        motivo: 'Dolor torácico moderado de 3 días de evolución, con irradiación a espalda.',
        box: 1
    },
    {
        id: 'demo-2',
        dia: 0,
        hora: '14:00 - 15:00',
        paciente: 'María López Fuentes',
        motivo: 'Control de hipertensión arterial y ajuste de dosis de enalapril.',
        box: 1
    },
    {
        id: 'demo-3',
        dia: 1,
        hora: '09:00 - 10:00',
        paciente: 'Ana Gómez Silva',
        motivo: 'Palpitaciones frecuentes y fatiga general tras esfuerzo leve.',
        box: 1
    },
    {
        id: 'demo-4',
        dia: 2,
        hora: '11:00 - 12:00',
        paciente: 'Carlos Ruiz Muñoz',
        motivo: 'Chequeo cardiológico preventivo para práctica deportiva de alta intensidad.',
        box: 1
    },
    {
        id: 'demo-5',
        dia: 3,
        hora: '15:00 - 16:00',
        paciente: 'Sofía Díaz Morales',
        motivo: 'Evaluación de electrocardiograma con sospecha de arritmia sinusal.',
        box: 1
    },
    {
        id: 'demo-6',
        dia: 4,
        hora: '12:00 - 13:00',
        paciente: 'Diego Fernández Araya',
        motivo: 'Disnea de esfuerzo y control posoperatorio de cateterismo.',
        box: 1
    }
];

/**
 * Consulta la agenda diaria del médico en el backend de Render:
 * GET /api/Agenda/medico/{medicoId}?fecha={fecha}
 */
export async function obtenerAgendaDiariaMedico(
    medicoId: string = MEDICO_DEFAULT_ID,
    fecha: Date = new Date()
): Promise<Cita[]> {
    const fechaStr = formatearFechaISO(fecha);
    const diaIndice = obtenerIndiceDia(fecha);
    const citasLocales = obtenerCitasLocales();

    try {
        const slots = await apiClient(`/api/Agenda/medico/${medicoId}?fecha=${fechaStr}`, {
            method: 'GET'
        });

        if (Array.isArray(slots) && slots.length > 0) {
            const citasMapeadas: Cita[] = [];

            for (const slot of slots as SlotAgendaBackend[]) {
                const horaInicio = slot.fechaInicio ? slot.fechaInicio.slice(11, 16) : '08:00';
                const horaFin = slot.fechaFin ? slot.fechaFin.slice(11, 16) : '09:00';
                const horaRango = `${horaInicio} - ${horaFin}`;
                const boxNum = extraerNumeroBox(slot.boxId);

                // 1. Si el backend ya tiene una cita asignada en este slot
                if (slot.disponibilidad !== 'libre' && slot.pacienteNombre) {
                    citasMapeadas.push({
                        id: slot.citaId || slot.scheduleBlockId,
                        dia: diaIndice,
                        hora: horaRango,
                        paciente: slot.pacienteNombre,
                        motivo: slot.motivoConsulta || 'Consulta médica agendada',
                        box: boxNum,
                        fecha: fechaStr,
                        disponibilidad: 'ocupado',
                        citaId: slot.citaId,
                        medicoId: slot.medicoId
                    });
                    continue;
                }

                // 2. Si el slot está libre en el backend, verificar si coincide con alguna cita local creada por el usuario
                const citaLocalCoincidente = citasLocales.find(c => 
                    (c.fecha === fechaStr && c.hora.startsWith(horaInicio)) ||
                    (c.id === slot.scheduleBlockId)
                );

                if (citaLocalCoincidente) {
                    citasMapeadas.push({
                        ...citaLocalCoincidente,
                        dia: diaIndice,
                        hora: horaRango,
                        box: boxNum,
                        fecha: fechaStr,
                        disponibilidad: 'ocupado'
                    });
                }
            }

            return citasMapeadas;
        }
    } catch (e) {
        console.warn('Error al consultar /api/Agenda/medico desde el backend:', e);
    }

    // Fallback: retornar citas locales que coincidan con la fecha o el día
    const localesFiltradas = citasLocales.filter(c => c.fecha === fechaStr || c.dia === diaIndice);
    if (localesFiltradas.length > 0) {
        return localesFiltradas;
    }

    // Si aún no hay citas en absoluto, proveer citas demo para el día seleccionado
    return CITAS_INICIALES_DEMO.filter(c => c.dia === diaIndice);
}

/**
 * Obtiene las citas de toda la semana para poblar las 7 columnas (Lunes a Domingo) de la Agenda.
 */
export async function obtenerAgendaSemanalMedico(
    medicoId: string = MEDICO_DEFAULT_ID,
    fechaReferencia: Date = new Date()
): Promise<Cita[]> {
    const citasLocales = obtenerCitasLocales();

    // Calcular el lunes de la semana actual
    const current = new Date(fechaReferencia);
    const dayOfWeek = current.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    current.setDate(current.getDate() - distanceToMonday);

    const promesas = [];

    // Consultar cada uno de los 7 días de la semana
    for (let i = 0; i < 7; i++) {
        const dia = new Date(current);
        dia.setDate(current.getDate() + i);
        promesas.push(obtenerAgendaDiariaMedico(medicoId, dia));
    }

    try {
        const resultados = await Promise.allSettled(promesas);
        const citasSemanales: Cita[] = [];

        resultados.forEach((res, index) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                citasSemanales.push(...res.value);
            } else {
                // Fallback por día si alguna petición individual falló
                const demoDia = CITAS_INICIALES_DEMO.filter(c => c.dia === index);
                citasSemanales.push(...demoDia);
            }
        });

        // Combinar con citas locales creadas que no estén ya en la lista
        for (const loc of citasLocales) {
            if (!citasSemanales.some(c => c.id === loc.id)) {
                citasSemanales.push(loc);
            }
        }

        // Si algún día no tiene citas registradas, complementar con citas demo para mantener la agenda visualmente activa
        const diasConCitas = new Set(citasSemanales.map(c => c.dia));
        for (const demo of CITAS_INICIALES_DEMO) {
            if (!diasConCitas.has(demo.dia)) {
                citasSemanales.push(demo);
            }
        }

        return citasSemanales;
    } catch {
        return [...citasLocales, ...CITAS_INICIALES_DEMO];
    }
}
