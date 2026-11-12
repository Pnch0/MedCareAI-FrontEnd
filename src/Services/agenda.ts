import { apiClient } from './apiClient.ts';
import { obtenerCatalogoMedicos } from './catalogoMedico.ts';

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
    nlpSummary?: string | null;
    symptomsRaw?: string | null;
    patientId?: string | null;
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
 * Elimina las citas locales almacenadas para sincronización limpia con el backend.
 */
export function limpiarCitasLocales(): void {
    try {
        localStorage.removeItem(LOCAL_CITAS_KEY);
    } catch {
        // Ignorar
    }
}

/**
 * Guarda una cita en el almacenamiento local para pruebas y respaldo inmediato.
 */
export function guardarCitaLocal(cita: Cita): void {
    try {
        const guardadas = obtenerCitasLocales();
        const filtradas = guardadas.filter(c => c.id !== cita.id);
        filtradas.push(cita);
        localStorage.setItem(LOCAL_CITAS_KEY, JSON.stringify(filtradas));
        window.dispatchEvent(new CustomEvent('medcare_cita_guardada', { detail: cita }));
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
 * Envía la actualización de estado de la consulta médica al AppointmentsController:
 * PATCH /api/Appointments/{id}/estado
 * Body: { estado: 'en_curso' | 'finalizada' }
 */
export async function actualizarEstadoCitaBackend(
    citaId: string, 
    estado: 'en_curso' | 'finalizada' | 'presente' | 'asistio' | 'no_asistio' | string
): Promise<boolean> {
    if (!citaId) return false;

    // El backend en C# tiene la ruta [HttpPatch("{id:guid}/estado")]
    const esGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(citaId);
    if (!esGuid) {
        console.warn(`ID de cita (${citaId}) no tiene formato GUID estándar, solo se guardará localmente.`);
        return false;
    }

    try {
        await apiClient(`/api/Appointments/${citaId}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado })
        });
        return true;
    } catch (error: any) {
        console.warn(`Error al actualizar estado ${estado} en backend:`, error.message);
        return false;
    }
}

/**
 * Consulta la agenda diaria del médico en el backend de Render:
 * 1. GET /api/Appointments/medico/{medicoId}?fecha={fecha} (AppointmentsController)
 * 2. GET /api/Agenda/medico/{medicoId}?fecha={fecha} (Fallback)
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

    let slots: any = null;

    // 1. Intentar consultar AppointmentsController: GET /api/Appointments/medico/{medicoId}?fecha={fecha}
    try {
        const resAppointments = await apiClient(`/api/Appointments/medico/${medicoId}?fecha=${fechaStr}`, {
            method: 'GET'
        });
        if (Array.isArray(resAppointments) && resAppointments.length > 0) {
            slots = resAppointments;
        }
    } catch {
        // Fallback a /api/Agenda/medico si no responde
    }

    // 2. Si no hubo resultados en Appointments, intentar /api/Agenda/medico/{medicoId}?fecha={fecha}
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        try {
            const resAgenda = await apiClient(`/api/Agenda/medico/${medicoId}?fecha=${fechaStr}`, {
                method: 'GET'
            });
            if (Array.isArray(resAgenda) && resAgenda.length > 0) {
                slots = resAgenda;
            }
        } catch (e) {
            console.warn('Error al consultar /api/Agenda/medico desde el backend:', e);
        }
    }

    try {
        if (Array.isArray(slots) && slots.length > 0) {
            const citasMapeadas: Cita[] = [];

            for (const slot of slots) {
                // 1. Extraer hora de inicio (soporta startTime de AppointmentsController y fechaInicio de AgendaController)
                const rawStart = slot.startTime || slot.fechaInicio || slot.horaInicio || slot.timeSlot || '';
                const horaInicio = rawStart.includes('T') 
                    ? rawStart.slice(11, 16) 
                    : (rawStart.length >= 5 ? rawStart.slice(0, 5) : '08:00');

                // 2. Extraer hora de fin
                const rawEnd = slot.endTime || slot.fechaFin || slot.horaFin || '';
                const horaFin = rawEnd.includes('T') 
                    ? rawEnd.slice(11, 16) 
                    : (rawEnd.length >= 5 ? rawEnd.slice(0, 5) : '09:00');

                const horaRango = `${horaInicio} - ${horaFin}`;

                // 3. Extraer Box (soporta boxName, boxId o box)
                const boxResuelto = resolverBox(slot.boxName || slot.boxId || slot.box, mapaBoxes);

                // 4. Extraer Paciente
                const pacienteNombre = slot.patientName || slot.pacienteNombre || slot.paciente || null;

                // 5. Extraer Motivo de consulta / Síntomas procesados por IA
                const nlpSummary = slot.nlpSummary || slot.nlp_summary || slot.summary || null;
                const symptomsRaw = slot.symptomsRaw || slot.symptoms_raw || slot.motivoConsulta || slot.reason || null;
                const motivo = nlpSummary || symptomsRaw || slot.motivo || 'Consulta médica agendada';

                // 6. Extraer Cita ID
                const citaId = slot.appointmentId || slot.citaId || slot.id || slot.scheduleBlockId;

                // Si el backend ya tiene una cita asignada en este slot (Fuente de la verdad)
                if ((slot.disponibilidad !== 'libre' && slot.disponibilidad !== undefined) || pacienteNombre) {
                    citasMapeadas.push({
                        id: String(citaId),
                        dia: diaIndice,
                        hora: horaRango,
                        paciente: pacienteNombre || 'Paciente',
                        motivo: motivo,
                        box: boxResuelto,
                        fecha: fechaStr,
                        disponibilidad: 'ocupado',
                        citaId: String(citaId),
                        medicoId: slot.medicoId || medicoId,
                        nlpSummary,
                        symptomsRaw,
                        patientId: slot.patientId || slot.pacienteId || null
                    });
                }
            }

            return citasMapeadas;
        }
    } catch (parseErr) {
        console.warn('Error al mapear slots de agenda:', parseErr);
    }

    // Fallback únicamente si el backend falló o no devolvió slots
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
        const localesFiltradas = citasLocales.filter(c => c.fecha === fechaStr || c.dia === diaIndice);
        return localesFiltradas;
    }

    return [];
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

        // Si el backend devolvió citas reales, limpiar cualquier residuo local para sincronización limpia
        if (citasSemanales.length > 0) {
            limpiarCitasLocales();
            return citasSemanales;
        }

        // Si el backend no devolvió citas pero existen citas locales (modo offline), devolverlas
        return citasLocales;
    } catch {
        return citasLocales;
    }
}

export type EstadoAsistencia = 'pendiente' | 'asistio' | 'no_asistio';

export interface CitaRecepcion {
    id: string;
    citaId?: string;
    paciente: string;
    hora: string;          // ej: "10:00 - 11:00" o "10:00"
    box: Box;              // ej: 1 o "Box 1"
    medicoNombre: string;  // ej: "Dr. Gonzalo Yáñez"
    especialidad: string;  // ej: "Medicina General"
    fecha: string;         // "YYYY-MM-DD"
    estadoAsistencia: EstadoAsistencia;
    horaMarcada?: string;  // ej: "10:05"
}

export const LOCAL_ASISTENCIA_CITAS_KEY = 'medcare_asistencia_citas';

/**
 * Obtiene el registro de asistencias de citas marcado por la recepcionista.
 */
export function obtenerMapaAsistencias(): Record<string, { estado: EstadoAsistencia; horaMarcada?: string }> {
    try {
        const raw = localStorage.getItem(LOCAL_ASISTENCIA_CITAS_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/**
 * Registra o actualiza la asistencia de una cita en recepción.
 */
export async function guardarAsistenciaCita(
    citaId: string, 
    estado: EstadoAsistencia
): Promise<void> {
    try {
        const mapa = obtenerMapaAsistencias();
        const ahora = new Date();
        const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        
        mapa[citaId] = {
            estado,
            horaMarcada: horaStr
        };
        localStorage.setItem(LOCAL_ASISTENCIA_CITAS_KEY, JSON.stringify(mapa));

        // Sincronizar con el panel del médico
        try {
            const rawGestion = localStorage.getItem('medcare_gestion_estados_citas');
            let mapaGestion: Record<string, string> = rawGestion ? JSON.parse(rawGestion) : {};
            if (estado === 'asistio') {
                if (mapaGestion[citaId] !== 'finalizada' && mapaGestion[citaId] !== 'en-curso') {
                    mapaGestion[citaId] = 'presente';
                }
            } else if (estado === 'no_asistio') {
                mapaGestion[citaId] = 'no_asistio';
            } else {
                delete mapaGestion[citaId];
            }
            localStorage.setItem('medcare_gestion_estados_citas', JSON.stringify(mapaGestion));
        } catch {}

        // Notificar al backend en segundo plano
        if (estado === 'asistio') {
            await actualizarEstadoCitaBackend(citaId, 'presente');
        } else if (estado === 'no_asistio') {
            await actualizarEstadoCitaBackend(citaId, 'no_asistio');
        }
    } catch (e) {
        console.warn('Error al guardar asistencia de cita:', e);
    }
}

/**
 * Consulta todas las citas médicas programadas para la fecha indicada (por defecto hoy)
 * en la clínica, consolidando médicos, boxes, estados de asistencia y citas locales.
 */
export async function obtenerCitasDelDiaRecepcion(
    fecha: Date = new Date()
): Promise<CitaRecepcion[]> {
    const fechaStr = formatearFechaISO(fecha);
    const mapaAsistencias = obtenerMapaAsistencias();
    const mapaBoxes = await cargarMapaBoxes();

    // 1. Obtener médicos de la clínica
    const medicosMap = new Map<string, { nombre: string; especialidad: string }>();
    try {
        const catalogo = await obtenerCatalogoMedicos();
        if (catalogo?.medicos?.length) {
            for (const m of catalogo.medicos) {
                medicosMap.set(String(m.id), {
                    nombre: `Dr(a). ${m.nombre} ${m.apellido}`.trim(),
                    especialidad: m.especialidad || 'Medicina General'
                });
            }
        }
    } catch {
        // Fallback
    }

    if (!medicosMap.has(MEDICO_DEFAULT_ID)) {
        medicosMap.set(MEDICO_DEFAULT_ID, {
            nombre: 'Dr. Gonzalo Yáñez',
            especialidad: 'Medicina General'
        });
    }

    const mapaCitas = new Map<string, CitaRecepcion>();

    // 2. Consultar agenda de cada médico en paralelo
    const promesas = Array.from(medicosMap.keys()).map(async (medicoId) => {
        try {
            const citasMedico = await obtenerAgendaDiariaMedico(medicoId, fecha, mapaBoxes);
            const medInfo = medicosMap.get(medicoId);
            for (const c of citasMedico) {
                const asistenciaInfo = mapaAsistencias[c.id] || mapaAsistencias[c.citaId || ''];
                mapaCitas.set(c.id, {
                    id: c.id,
                    citaId: c.citaId || c.id,
                    paciente: c.paciente || 'Paciente',
                    hora: c.hora || '10:00 - 11:00',
                    box: c.box || 1,
                    medicoNombre: medInfo?.nombre || 'Dr. Gonzalo Yáñez',
                    especialidad: medInfo?.especialidad || 'Medicina General',
                    fecha: fechaStr,
                    estadoAsistencia: asistenciaInfo?.estado || 'pendiente',
                    horaMarcada: asistenciaInfo?.horaMarcada
                });
            }
        } catch {
            // Ignorar errores de médico individual
        }
    });

    await Promise.allSettled(promesas);

    // 3. Integrar citas guardadas localmente (solo las que coincidan estrictamente con la fecha de hoy)
    const citasLocales = obtenerCitasLocales();
    for (const c of citasLocales) {
        const coincideFecha = c.fecha === fechaStr;
        if (coincideFecha && !mapaCitas.has(c.id)) {
            const medInfo = (c.medicoId && medicosMap.get(String(c.medicoId))) || {
                nombre: 'Dr. Gonzalo Yáñez',
                especialidad: 'Medicina General'
            };
            const asistenciaInfo = mapaAsistencias[c.id] || mapaAsistencias[c.citaId || ''];
            mapaCitas.set(c.id, {
                id: c.id,
                citaId: c.citaId || c.id,
                paciente: c.paciente || 'Paciente',
                hora: c.hora || '11:00 - 12:00',
                box: c.box || 1,
                medicoNombre: medInfo.nombre,
                especialidad: medInfo.especialidad,
                fecha: fechaStr,
                estadoAsistencia: asistenciaInfo?.estado || 'pendiente',
                horaMarcada: asistenciaInfo?.horaMarcada
            });
        }
    }

    // 4. Convertir a arreglo y ordenar cronológicamente de más temprano a más tarde
    const lista = Array.from(mapaCitas.values());
    lista.sort((a, b) => {
        const horaA = (a.hora || '').slice(0, 5);
        const horaB = (b.hora || '').slice(0, 5);
        return horaA.localeCompare(horaB);
    });

    return lista;
}
