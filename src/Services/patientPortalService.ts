import { apiClient } from './apiClient.ts';

export type NotificationChannelType = 'Email' | 'WhatsApp';

export interface PatientAppointmentItem {
    id: string;
    dateLocal: string;
    timeLocal: string;
    specialty: string;
    staffName: string;
    boxName: string;
    clinicName: string;
    status: string;
    confirmationState: string;
}

export interface PatientRescheduleOption {
    scheduleBlockId: string;
    dateLocal: string;
    timeLocal: string;
    staffName: string;
    boxName: string;
}

export interface PatientNotificationPreferences {
    preferredChannel: NotificationChannelType;
    whatsAppOptIn: boolean;
    isOptedOut: boolean;
    emailOptIn?: boolean;
    updatedAtIso?: string | null;
}

export interface UpdateNotificationPreferencesRequestDto {
    preferredChannel: NotificationChannelType;
    whatsAppOptIn: boolean;
    source?: string;
}

function esObjeto(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function leerProp(obj: Record<string, unknown>, ...claves: string[]): unknown {
    for (const c of claves) {
        if (c in obj && obj[c] !== undefined && obj[c] !== null) {
            return obj[c];
        }
    }
    return undefined;
}

function extraerLista(raw: unknown): Record<string, unknown>[] {
    if (Array.isArray(raw)) return raw.filter(esObjeto);
    if (esObjeto(raw)) {
        const inner =
            leerProp(raw, 'items', 'Items', 'options', 'Options', 'slots', 'Slots', '$values') ?? [];
        if (Array.isArray(inner)) return inner.filter(esObjeto);
    }
    return [];
}

function formatearHora(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    if (raw.includes('T')) return raw.slice(11, 16);
    if (raw.length >= 5) return raw.slice(0, 5);
    return raw;
}

function formatearFecha(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    if (raw.includes('T')) return raw.slice(0, 10);
    return raw;
}

function normalizarCitaPaciente(item: Record<string, unknown>, idx: number): PatientAppointmentItem {
    const startRaw = leerProp(item, 'startTime', 'StartTime', 'fechaInicio', 'FechaInicio') ?? '';
    const endRaw = leerProp(item, 'endTime', 'EndTime', 'fechaFin', 'FechaFin') ?? '';
    const horaInicio = formatearHora(startRaw);
    const horaFin = formatearHora(endRaw);

    const dateLocal = String(
        leerProp(item, 'appointmentDateLocal', 'AppointmentDateLocal', 'dateLocal', 'DateLocal') ??
            formatearFecha(startRaw)
    );
    const timeLocal = String(
        leerProp(item, 'appointmentTimeLocal', 'AppointmentTimeLocal', 'timeLocal', 'TimeLocal') ??
            (horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : horaInicio)
    );

    return {
        id: String(leerProp(item, 'id', 'Id', 'appointmentId', 'AppointmentId') ?? `apt-${idx}`),
        dateLocal: dateLocal || 'Sin fecha',
        timeLocal: timeLocal || 'Sin hora',
        specialty: String(
            leerProp(item, 'specialty', 'Specialty', 'especialidad', 'Especialidad') ??
                'Consulta Médica'
        ),
        staffName: String(
            leerProp(item, 'staffName', 'StaffName', 'medicoNombre', 'MedicoNombre', 'doctorName') ??
                'Profesional asignado'
        ),
        boxName: String(leerProp(item, 'boxName', 'BoxName', 'box', 'Box') ?? 'Box clínico'),
        clinicName: String(leerProp(item, 'clinicName', 'ClinicName') ?? 'MedCareAI'),
        status: String(leerProp(item, 'status', 'Status', 'appointmentStatus', 'AppointmentStatus') ?? 'Scheduled'),
        confirmationState: String(
            leerProp(item, 'confirmationState', 'ConfirmationState', 'estadoConfirmacion') ?? 'Pendiente'
        )
    };
}

function normalizarOpcionReagendar(
    item: Record<string, unknown>,
    idx: number
): PatientRescheduleOption {
    const startRaw = leerProp(item, 'startTime', 'StartTime', 'fechaInicio', 'FechaInicio') ?? '';
    const endRaw = leerProp(item, 'endTime', 'EndTime', 'fechaFin', 'FechaFin') ?? '';
    const horaInicio = formatearHora(startRaw);
    const horaFin = formatearHora(endRaw);

    return {
        scheduleBlockId: String(
            leerProp(item, 'scheduleBlockId', 'ScheduleBlockId', 'id', 'Id') ?? `slot-${idx}`
        ),
        dateLocal: String(
            leerProp(item, 'dateLocal', 'DateLocal', 'appointmentDateLocal') ??
                formatearFecha(startRaw)
        ),
        timeLocal: String(
            leerProp(item, 'timeLocal', 'TimeLocal', 'appointmentTimeLocal') ??
                (horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : horaInicio)
        ),
        staffName: String(
            leerProp(item, 'staffName', 'StaffName', 'medicoNombre', 'MedicoNombre') ??
                'Profesional asignado'
        ),
        boxName: String(leerProp(item, 'boxName', 'BoxName', 'box') ?? 'Box clínico')
    };
}

/**
 * GET /api/patients/me/appointments
 */
export async function obtenerMisCitasPaciente(
    includePast: boolean = false
): Promise<PatientAppointmentItem[]> {
    const respuesta: unknown = await apiClient(
        `/api/patients/me/appointments?includePast=${includePast ? 'true' : 'false'}`,
        { method: 'GET' }
    );
    return extraerLista(respuesta).map(normalizarCitaPaciente);
}

/**
 * POST /api/patients/me/appointments/{id}/cancel
 */
export async function cancelarMiCitaPaciente(
    appointmentId: string,
    reason?: string
): Promise<void> {
    await apiClient(`/api/patients/me/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {})
    });
}

/**
 * GET /api/patients/me/appointments/{id}/reschedule-options
 */
export async function obtenerOpcionesReagendarPaciente(
    appointmentId: string
): Promise<PatientRescheduleOption[]> {
    const respuesta: unknown = await apiClient(
        `/api/patients/me/appointments/${appointmentId}/reschedule-options`,
        { method: 'GET' }
    );
    return extraerLista(respuesta).map(normalizarOpcionReagendar);
}

/**
 * POST /api/patients/me/appointments/{id}/reschedule
 */
export async function reagendarMiCitaPaciente(
    appointmentId: string,
    newScheduleBlockId: string,
    reason?: string
): Promise<void> {
    await apiClient(`/api/patients/me/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
            newScheduleBlockId,
            ...(reason?.trim() ? { reason: reason.trim() } : {})
        })
    });
}

/**
 * GET /api/Patients/me/notification-preferences
 */
export async function obtenerPreferenciasNotificacionPaciente(): Promise<PatientNotificationPreferences> {
    const raw: unknown = await apiClient('/api/Patients/me/notification-preferences', {
        method: 'GET'
    });
    const obj = esObjeto(raw) ? raw : {};

    const rawChannel = String(
        leerProp(obj, 'preferredChannel', 'PreferredChannel') ?? 'Email'
    ).toLowerCase();
    const preferredChannel: NotificationChannelType =
        rawChannel.includes('whatsapp') || rawChannel === '1' ? 'WhatsApp' : 'Email';

    const whatsAppOptIn = Boolean(
        leerProp(obj, 'whatsAppOptIn', 'WhatsAppOptIn', 'whatsappOptIn') ?? false
    );
    const isOptedOut = Boolean(
        leerProp(obj, 'isOptedOut', 'IsOptedOut', 'optedOut', 'OptedOut') ?? false
    );

    return {
        preferredChannel,
        whatsAppOptIn,
        isOptedOut,
        emailOptIn: !isOptedOut,
        updatedAtIso: leerProp(obj, 'updatedAt', 'UpdatedAt')
            ? String(leerProp(obj, 'updatedAt', 'UpdatedAt'))
            : null
    };
}

/**
 * PUT /api/Patients/me/notification-preferences
 */
export async function actualizarPreferenciasNotificacionPaciente(
    payload: UpdateNotificationPreferencesRequestDto
): Promise<PatientNotificationPreferences> {
    const raw: unknown = await apiClient('/api/Patients/me/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify({
            preferredChannel: payload.preferredChannel,
            whatsAppOptIn: payload.whatsAppOptIn,
            source: payload.source || 'patient_portal'
        })
    });

    if (esObjeto(raw)) {
        const rawChannel = String(
            leerProp(raw, 'preferredChannel', 'PreferredChannel') ?? payload.preferredChannel
        ).toLowerCase();
        return {
            preferredChannel: rawChannel.includes('whatsapp') ? 'WhatsApp' : 'Email',
            whatsAppOptIn: Boolean(
                leerProp(raw, 'whatsAppOptIn', 'WhatsAppOptIn') ?? payload.whatsAppOptIn
            ),
            isOptedOut: Boolean(leerProp(raw, 'isOptedOut', 'IsOptedOut') ?? false)
        };
    }

    return {
        preferredChannel: payload.preferredChannel,
        whatsAppOptIn: payload.whatsAppOptIn,
        isOptedOut: false
    };
}

/**
 * POST /api/Patients/me/opt-out
 */
export async function revocarComunicacionesPaciente(
    source: string = 'patient_portal'
): Promise<void> {
    await apiClient('/api/Patients/me/opt-out', {
        method: 'POST',
        body: JSON.stringify({ source })
    });
}
