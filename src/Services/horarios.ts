import { apiClient } from './apiClient.ts';

export interface ProfesionalHorario {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
    cargo: string;
    rut?: string;
    telefono?: string;
    email?: string;
}

export interface BloqueHorario {
    id: string;
    horaInicio: string;
    horaFin: string;
    box: {
        id: number | string;
        nombre: string;
        ubicacion: string;
    };
    diasSemana: string[];
    rangoFechas: {
        fechaInicio: string;
        fechaFin: string;
    };
    profesional: ProfesionalHorario;
}

export interface SlotHorario {
    hora: string;
    scheduleBlockId: string;
}

const LOCAL_STORAGE_KEY = 'medcare_schedule_blocks';

/**
 * Guarda un bloque en el almacenamiento local para sincronización y respaldo.
 */
export function guardarBloqueLocal(bloque: BloqueHorario): void {
    try {
        const guardados = obtenerBloquesLocales();
        const filtrados = guardados.filter(b => b.id !== bloque.id);
        filtrados.push(bloque);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtrados));
    } catch (e) {
        console.warn('Error al guardar bloque en localStorage:', e);
    }
}

/**
 * Obtiene los bloques guardados localmente.
 */
export function obtenerBloquesLocales(): BloqueHorario[] {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

const DIA_MAP: Record<string, string> = {
    '0': 'Domingo',
    '1': 'Lunes',
    '2': 'Martes',
    '3': 'Miércoles',
    '4': 'Jueves',
    '5': 'Viernes',
    '6': 'Sábado',
    'sunday': 'Domingo',
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'domingo': 'Domingo',
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado'
};

export const normalizarNombreDia = (d: any): string => {
    if (d === null || d === undefined) return 'Lunes';
    const clave = String(d).trim().toLowerCase();
    return DIA_MAP[clave] || 'Lunes';
};

/**
 * Consulta los bloques de horarios desde el backend (/api/ScheduleBlocks)
 * y los combina con los bloques guardados localmente.
 */
export async function obtenerBloquesHorarios(): Promise<BloqueHorario[]> {
    const bloquesLocales = obtenerBloquesLocales();
    let bloquesBackend: BloqueHorario[] = [];

    try {
        const [blocksRes, staffRes, boxesRes] = await Promise.allSettled([
            apiClient('/api/ScheduleBlocks', { method: 'GET' }),
            apiClient('/api/Staff', { method: 'GET' }),
            apiClient('/api/Boxes', { method: 'GET' })
        ]);

        const data = blocksRes.status === 'fulfilled' ? blocksRes.value : null;
        let staffList = staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) ? staffRes.value : [];
        const boxesList = boxesRes.status === 'fulfilled' && Array.isArray(boxesRes.value) ? boxesRes.value : [];

        // Si staffList vino vacío, intentar con /api/Staff?role=2 para garantizar resolución de médicos
        if (staffList.length === 0) {
            try {
                const altStaff = await apiClient('/api/Staff?role=2', { method: 'GET' });
                if (Array.isArray(altStaff)) {
                    staffList = altStaff;
                }
            } catch {
                // Silencioso
            }
        }

        const listaCruda = Array.isArray(data)
            ? data
            : (data?.sblocks || data?.data || data?.items || data?.scheduleBlocks || data?.$values || []);

        if (Array.isArray(listaCruda)) {
            bloquesBackend = listaCruda.map((item: any) => {
                const rawDias = item.daysOfWeek || item.DaysOfWeek || item.dayOfWeeks || item.DayOfWeeks || [];
                const dias = Array.isArray(rawDias) ? rawDias.map(normalizarNombreDia) : [];

                const rawStartTime = item.startTime || item.StartTime || item.horaInicio || item.HoraInicio || '08:00';
                const rawEndTime = item.endTime || item.EndTime || item.horaFin || item.HoraFin || '17:00';

                const staffId = String(item.staffId || item.StaffId || item.medicoId || item.MedicoId || '');
                const boxId = String(item.boxId || item.BoxId || '');

                const medico = staffList.find((s: any) => String(s.id || s.staffId) === staffId);
                const boxObj = boxesList.find((b: any) => String(b.id || b.boxId) === boxId);

                let nombre = medico?.firstName || item.staffFirstName || item.StaffFirstName || '';
                let apellido = medico?.lastName || item.staffLastName || item.StaffLastName || '';

                if (!nombre && (medico?.name || item.staffName || item.StaffName || item.doctorName || item.DoctorName || item.name)) {
                    const rawName = String(medico?.name || item.staffName || item.StaffName || item.doctorName || item.DoctorName || item.name || '').trim();
                    const partes = rawName.split(/\s+/);
                    nombre = partes[0] || 'Médico';
                    apellido = partes.slice(1).join(' ') || '';
                }

                if (!nombre) {
                    nombre = 'Médico';
                }

                const especialidad = medico?.specialty || item.specialty || item.Specialty || item.medicalSpecialty || 'Medicina General';
                const cargo = medico?.roleName || item.roleName || item.RoleName || 'Médico';

                return {
                    id: String(item.id || item.Id || item.ruleGroupId || item.RuleGroupId || crypto.randomUUID()),
                    horaInicio: String(rawStartTime).substring(0, 5),
                    horaFin: String(rawEndTime).substring(0, 5),
                    box: {
                        id: boxId,
                        nombre: boxObj?.name || boxObj?.nombre || item.boxName || item.BoxName || 'Box Asignado',
                        ubicacion: boxObj?.floor || boxObj?.piso ? `${boxObj.floor || boxObj.piso} - ${boxObj.type || boxObj.tipo || 'Consultas'}` : (item.boxLocation || item.BoxLocation || 'Consultas')
                    },
                    diasSemana: dias,
                    rangoFechas: {
                        fechaInicio: item.startDate || item.StartDate || '',
                        fechaFin: item.endDate || item.EndDate || ''
                    },
                    profesional: {
                        id: staffId,
                        nombre,
                        apellido,
                        especialidad,
                        cargo
                    }
                };
            });
        }
    } catch (e) {
        console.warn('Error al obtener bloques desde el backend:', e);
    }

    // Combinar bloques backend y locales sin duplicados por ID
    const mapa = new Map<string, BloqueHorario>();
    for (const b of bloquesBackend) {
        mapa.set(b.id, b);
    }
    for (const b of bloquesLocales) {
        if (!mapa.has(b.id)) {
            mapa.set(b.id, b);
        }
    }

    return Array.from(mapa.values());
}

const DIAS_INDICE_MAP: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
};

/**
 * Genera intervalos de horario entre horaInicio y horaFin.
 * Por ejemplo: de 09:00 a 13:00 con intervalo de 60 min -> ['09:00', '10:00', '11:00', '12:00']
 */
export function generarSlotsDeHorario(horaInicio: string, horaFin: string, intervaloMinutos: number = 60): string[] {
    const slots: string[] = [];
    const [hIni, mIni] = (horaInicio || '').split(':').map(Number);
    const [hFin, mFin] = (horaFin || '').split(':').map(Number);

    if (isNaN(hIni) || isNaN(hFin)) return [];

    let currentMinutes = (hIni || 0) * 60 + (mIni || 0);
    const endMinutes = (hFin || 0) * 60 + (mFin || 0);

    while (currentMinutes + intervaloMinutos <= endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        currentMinutes += intervaloMinutos;
    }

    if (slots.length === 0 && horaInicio) {
        slots.push(horaInicio.substring(0, 5));
    }

    return slots;
}

/**
 * Obtiene los horarios y sus IDs de bloque para un médico y una fecha dados.
 */
export function obtenerHorariosPorMedicoYFecha(
    bloques: BloqueHorario[],
    medicoId: string,
    fecha: Date,
    intervaloMinutos: number = 60
): SlotHorario[] {
    if (!medicoId || !fecha) return [];

    const diaNombre = DIAS_INDICE_MAP[fecha.getDay()] || 'Lunes';

    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${yyyy}-${mm}-${dd}`;

    // Filtrar bloques del médico
    const bloquesMedico = bloques.filter(b => String(b.profesional.id) === String(medicoId));

    const slotsMap = new Map<string, SlotHorario>();

    for (const bloque of bloquesMedico) {
        // 1. Verificar si el bloque incluye el día de la semana
        const coincideDia = bloque.diasSemana.some(d => normalizarNombreDia(d) === diaNombre);
        if (!coincideDia) continue;

        // 2. Verificar rango de fechas si está especificado
        const fIni = bloque.rangoFechas?.fechaInicio;
        const fFin = bloque.rangoFechas?.fechaFin;
        if (fIni && fechaStr < fIni) continue;
        if (fFin && fechaStr > fFin) continue;

        // 3. Generar slots
        const horas = generarSlotsDeHorario(bloque.horaInicio, bloque.horaFin, intervaloMinutos);
        for (const hora of horas) {
            if (!slotsMap.has(hora)) {
                slotsMap.set(hora, {
                    hora,
                    scheduleBlockId: bloque.id
                });
            }
        }
    }

    return Array.from(slotsMap.values()).sort((a, b) => a.hora.localeCompare(b.hora));
}
