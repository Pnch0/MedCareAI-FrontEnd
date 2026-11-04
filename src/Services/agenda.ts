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
 * Obtiene todas las citas almacenadas localmente, asegurando que el nombre del paciente sea legible
 * y resolviendo el box correcto de acuerdo a los bloques asignados.
 */
export function obtenerCitasLocales(): Cita[] {
    try {
        const data = localStorage.getItem(LOCAL_CITAS_KEY);
        if (!data) return [];
        // Filtrar cualquier ID que provenga de pruebas simuladas previas
        const citas: Cita[] = JSON.parse(data).filter((c: Cita) => !c.id.startsWith('demo-'));
        const storedUserName = localStorage.getItem('userName');
        let modificado = false;

        let bloquesLocales: any[] = [];
        try {
            const rawBloques = localStorage.getItem('medcare_schedule_blocks');
            if (rawBloques) bloquesLocales = JSON.parse(rawBloques);
        } catch {
            // Ignorar error al leer bloques
        }

        const citasLimpias = citas.map((c) => {
            let citaActualizada = { ...c };

            // 1. Limpiar nombre si contiene correo
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
                citaActualizada.paciente = nombreLimpio;
            }

            // 2. Corregir box si fue guardado erróneamente como 6 debido al cálculo anterior con UUIDs
            if (citaActualizada.box === 6 && bloquesLocales.length > 0) {
                const bloqueCoincidente = bloquesLocales.find((b: any) => 
                    b?.id === c.id || 
                    (b?.profesional?.id && c.medicoId && String(b.profesional.id) === String(c.medicoId))
                );
                if (bloqueCoincidente?.box?.nombre) {
                    const match = String(bloqueCoincidente.box.nombre).match(/\d+/);
                    const boxReal = match ? parseInt(match[0], 10) : bloqueCoincidente.box.nombre;
                    if (boxReal !== 6) {
                        modificado = true;
                        citaActualizada.box = boxReal;
                    }
                }
            }

            return citaActualizada;
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

let boxesCache: Map<string, Box> | null = null;

/**
 * Carga el catálogo de boxes para mapear identificadores UUIDs a números o nombres reales de Box.
 */
export async function cargarMapaBoxes(): Promise<Map<string, Box>> {
    if (boxesCache && boxesCache.size > 0) {
        return boxesCache;
    }

    const mapa = new Map<string, Box>();

    // 1. Cargar desde los bloques horarios locales
    try {
        const bloquesLocales = localStorage.getItem('medcare_schedule_blocks');
        if (bloquesLocales) {
            const parsed = JSON.parse(bloquesLocales);
            if (Array.isArray(parsed)) {
                for (const b of parsed) {
                    if (b?.box?.id && b?.box?.nombre) {
                        const match = String(b.box.nombre).match(/\d+/);
                        const num = match ? parseInt(match[0], 10) : b.box.nombre;
                        mapa.set(String(b.box.id), num);
                    }
                }
            }
        }
    } catch {
        // Ignorar
    }

    // 2. Consultar catálogo de boxes desde el backend
    try {
        const data = await apiClient('/api/Boxes', { method: 'GET' });
        if (Array.isArray(data)) {
            for (const item of data) {
                const id = String(item.id || item.boxId || '');
                const nombre = String(item.name || item.nombre || '');
                if (id && nombre) {
                    const match = nombre.match(/\d+/);
                    const num = match ? parseInt(match[0], 10) : nombre;
                    mapa.set(id, num);
                }
            }
        }
    } catch {
        // Fallback silencioso al mapa local
    }

    boxesCache = mapa;
    return mapa;
}

/**
 * Resuelve el número o identificador del Box de forma segura,
 * evitando aplicar operaciones módulo arbitrarias sobre UUIDs.
 */
export function resolverBox(boxId: string | number | undefined, mapaBoxes?: Map<string, Box>): Box {
    if (!boxId) return 1;

    // Si ya es un número (ej: 1, 2)
    if (typeof boxId === 'number') return boxId;

    const str = String(boxId).trim();

    // Si es un string numérico corto (ej: "1", "2")
    if (str.length <= 2 && !isNaN(Number(str))) {
        return parseInt(str, 10) as Box;
    }

    // Si contiene la palabra "box" seguida de número (ej: "Box 1")
    if (str.toLowerCase().includes('box')) {
        const match = str.match(/\d+/);
        if (match) return parseInt(match[0], 10) as Box;
    }

    // Buscar en el catálogo de boxes por UUID
    const mapa = mapaBoxes || boxesCache;
    if (mapa && mapa.has(str)) {
        return mapa.get(str)!;
    }

    // Buscar en los bloques locales guardados
    try {
        const bloquesLocales = localStorage.getItem('medcare_schedule_blocks');
        if (bloquesLocales) {
            const parsed = JSON.parse(bloquesLocales);
            if (Array.isArray(parsed)) {
                const encontrado = parsed.find((b: any) => 
                    String(b?.box?.id) === str || 
                    String(b?.id) === str
                );
                if (encontrado?.box?.nombre) {
                    const match = String(encontrado.box.nombre).match(/\d+/);
                    return match ? (parseInt(match[0], 10) as Box) : encontrado.box.nombre;
                }
            }
        }
    } catch {
        // Fallback
    }

    return 1;
}

/**
 * Consulta la agenda diaria del médico en el backend de Render:
 * GET /api/Agenda/medico/{medicoId}?fecha={fecha}
 */
export async function obtenerAgendaDiariaMedico(
    medicoId: string = MEDICO_DEFAULT_ID,
    fecha: Date = new Date(),
    mapaBoxesParam?: Map<string, Box>
): Promise<Cita[]> {
    const fechaStr = formatearFechaISO(fecha);
    const diaIndice = obtenerIndiceDia(fecha);
    const citasLocales = obtenerCitasLocales();
    const mapaBoxes = mapaBoxesParam || (await cargarMapaBoxes());

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
                const boxResuelto = resolverBox(slot.boxId, mapaBoxes);

                // 1. Si el backend ya tiene una cita asignada en este slot
                if (slot.disponibilidad !== 'libre' && slot.pacienteNombre) {
                    citasMapeadas.push({
                        id: slot.citaId || slot.scheduleBlockId,
                        dia: diaIndice,
                        hora: horaRango,
                        paciente: slot.pacienteNombre,
                        motivo: slot.motivoConsulta || 'Consulta médica agendada',
                        box: boxResuelto,
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
                    // Respetar prioritariamente el box de la cita local si es válido (o el box resuelto del bloque)
                    const boxFinal = (citaLocalCoincidente.box !== undefined && citaLocalCoincidente.box !== null && citaLocalCoincidente.box !== 6)
                        ? citaLocalCoincidente.box
                        : boxResuelto;

                    citasMapeadas.push({
                        ...citaLocalCoincidente,
                        dia: diaIndice,
                        hora: horaRango,
                        box: boxFinal,
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
    return localesFiltradas;
}

/**
 * Obtiene las citas de toda la semana para poblar las 7 columnas (Lunes a Domingo) de la Agenda.
 * Solo incluye citas reales devueltas por el backend o creadas en localStorage.
 */
export async function obtenerAgendaSemanalMedico(
    medicoId: string = MEDICO_DEFAULT_ID,
    fechaReferencia: Date = new Date()
): Promise<Cita[]> {
    const mapaBoxes = await cargarMapaBoxes();
    const citasLocales = obtenerCitasLocales();

    // Calcular el lunes de la semana actual
    const current = new Date(fechaReferencia);
    const dayOfWeek = current.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    current.setDate(current.getDate() - distanceToMonday);

    const promesas = [];

    // Consultar cada uno de los 7 días de la semana pasando el mapa cargado
    for (let i = 0; i < 7; i++) {
        const dia = new Date(current);
        dia.setDate(current.getDate() + i);
        promesas.push(obtenerAgendaDiariaMedico(medicoId, dia, mapaBoxes));
    }

    try {
        const resultados = await Promise.allSettled(promesas);
        const citasSemanales: Cita[] = [];

        resultados.forEach((res) => {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                citasSemanales.push(...res.value);
            }
        });

        // Combinar con citas locales creadas que no estén ya en la lista
        for (const loc of citasLocales) {
            if (!citasSemanales.some(c => c.id === loc.id)) {
                citasSemanales.push(loc);
            }
        }

        return citasSemanales;
    } catch {
        return citasLocales;
    }
}
