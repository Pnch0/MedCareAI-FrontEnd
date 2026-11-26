import { BASE_URL } from './apiClient.ts';

export interface PublicApiError extends Error {
    status: number;
}

function crearPublicApiError(message: string, status: number): PublicApiError {
    const err = new Error(message) as PublicApiError;
    err.status = status;
    return err;
}

export function esPublicApiError(err: unknown): err is PublicApiError {
    return (
        err instanceof Error &&
        'status' in err &&
        typeof (err as PublicApiError).status === 'number'
    );
}

/**
 * Cliente HTTP público sin autenticación Bearer ni redirección a /login.
 * Cumple estrictamente con la Regla 3 para rutas /api/public/*.
 */
async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Tunnel-Skip-AntiPhishing-Page': 'True',
            ...options.headers
        }
    });

    if (!response.ok) {
        let errorMsg = 'No se pudo completar la solicitud.';
        try {
            const errText = await response.text();
            if (errText) {
                try {
                    const errJson: unknown = JSON.parse(errText);
                    if (
                        typeof errJson === 'object' &&
                        errJson !== null &&
                        'message' in errJson &&
                        typeof (errJson as { message: unknown }).message === 'string'
                    ) {
                        errorMsg = (errJson as { message: string }).message;
                    } else {
                        errorMsg = errText;
                    }
                } catch {
                    errorMsg = errText;
                }
            }
        } catch {
            // Mantener mensaje por defecto
        }
        throw crearPublicApiError(errorMsg, response.status);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

export interface PublicActionPreviewDto {
    clinicName: string;
    appointmentDateLocal: string;
    appointmentTimeLocal: string;
    specialty: string;
    allowedActions: string[];
    expiresAt: string;
    waitingListOfferId?: string | null;
    targetKind?: string;
}

export interface PublicActionResultDto {
    message?: string;
    action?: string;
    appointmentId?: string;
    outcome?: string;
    confirmationState?: string;
    appointmentStatus?: string;
    wasIdempotentReplay?: boolean;
}

export interface PublicRescheduleSlotDto {
    scheduleBlockId: string;
    startTime: string;
    endTime: string;
    dateLocal: string;
    timeLocal: string;
    staffName: string;
    boxName: string;
}

export interface PublicRescheduleOptionsDto {
    appointmentId?: string;
    currentDateLocal?: string;
    currentTimeLocal?: string;
    specialty?: string;
    clinicName?: string;
    remainingReschedules?: number | null;
    slots: PublicRescheduleSlotDto[];
}

export interface PublicRescheduleResultDto {
    message?: string;
    appointmentId?: string;
    newScheduleBlockId?: string;
    newDateLocal?: string;
    newTimeLocal?: string;
}

export interface PublicWaitingListOfferPreviewDto {
    waitingListOfferId: string;
    targetKind: string;
    clinicName: string;
    appointmentDateLocal: string;
    appointmentTimeLocal: string;
    specialty: string;
    allowedActions: string[];
    expiresAt: string;
}

export interface PublicWaitingListOfferResultDto {
    message?: string;
    waitingListOfferId?: string;
    appointmentId?: string;
    status?: string;
}

function esObjeto(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizarHora(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    if (raw.includes('T')) return raw.slice(11, 16);
    if (raw.length >= 5) return raw.slice(0, 5);
    return raw;
}

function normalizarFecha(raw: unknown): string {
    if (typeof raw !== 'string') return '';
    if (raw.includes('T')) return raw.slice(0, 10);
    return raw;
}

function normalizarRescheduleOptions(raw: unknown): PublicRescheduleOptionsDto {
    if (Array.isArray(raw)) {
        return {
            slots: raw.filter(esObjeto).map(mapearSlotReschedule)
        };
    }
    if (!esObjeto(raw)) {
        return { slots: [] };
    }

    const rawSlots =
        (Array.isArray(raw.options) && raw.options) ||
        (Array.isArray(raw.Options) && raw.Options) ||
        (Array.isArray(raw.slots) && raw.slots) ||
        (Array.isArray(raw.Slots) && raw.Slots) ||
        (Array.isArray(raw.availableSlots) && raw.availableSlots) ||
        (Array.isArray(raw.AvailableSlots) && raw.AvailableSlots) ||
        [];

    return {
        appointmentId: raw.appointmentId ? String(raw.appointmentId) : undefined,
        currentDateLocal: raw.currentDateLocal ? String(raw.currentDateLocal) : undefined,
        currentTimeLocal: raw.currentTimeLocal ? String(raw.currentTimeLocal) : undefined,
        specialty: raw.specialty ? String(raw.specialty) : undefined,
        clinicName: raw.clinicName ? String(raw.clinicName) : undefined,
        remainingReschedules:
            typeof raw.remainingReschedules === 'number' ? raw.remainingReschedules : null,
        slots: rawSlots.filter(esObjeto).map(mapearSlotReschedule)
    };
}

function mapearSlotReschedule(item: Record<string, unknown>): PublicRescheduleSlotDto {
    const scheduleBlockId = String(
        item.scheduleBlockId ?? item.ScheduleBlockId ?? item.id ?? item.Id ?? ''
    );
    const startRaw = item.startTime ?? item.StartTime ?? item.fechaInicio ?? item.FechaInicio ?? '';
    const endRaw = item.endTime ?? item.EndTime ?? item.fechaFin ?? item.FechaFin ?? '';
    const dateLocal = String(
        item.dateLocal ?? item.DateLocal ?? item.appointmentDateLocal ?? normalizarFecha(startRaw)
    );
    const startHm = normalizarHora(startRaw);
    const endHm = normalizarHora(endRaw);
    const timeLocal = String(
        item.timeLocal ??
            item.TimeLocal ??
            item.appointmentTimeLocal ??
            (startHm && endHm ? `${startHm} - ${endHm}` : startHm)
    );

    return {
        scheduleBlockId,
        startTime: String(startRaw),
        endTime: String(endRaw),
        dateLocal,
        timeLocal,
        staffName: String(
            item.staffName ?? item.StaffName ?? item.medicoNombre ?? item.MedicoNombre ?? 'Profesional asignado'
        ),
        boxName: String(item.boxName ?? item.BoxName ?? item.box ?? 'Box clínico')
    };
}

/**
 * GET /api/public/appointments/action-preview?token=...
 */
export async function previewAppointmentAction(token: string): Promise<PublicActionPreviewDto> {
    return publicRequest<PublicActionPreviewDto>(
        `/api/public/appointments/action-preview?token=${encodeURIComponent(token)}`,
        { method: 'GET' }
    );
}

/**
 * POST /api/public/appointments/confirm
 */
export async function confirmAppointmentByToken(token: string): Promise<PublicActionResultDto> {
    return publicRequest<PublicActionResultDto>('/api/public/appointments/confirm', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
}

/**
 * POST /api/public/appointments/decline
 */
export async function declineAppointmentByToken(
    token: string,
    reason?: string
): Promise<PublicActionResultDto> {
    return publicRequest<PublicActionResultDto>('/api/public/appointments/decline', {
        method: 'POST',
        body: JSON.stringify({
            token,
            ...(reason && reason.trim() ? { reason: reason.trim() } : {})
        })
    });
}

/**
 * GET /api/public/appointments/reschedule-options?token=...
 */
export async function getRescheduleOptionsByToken(
    token: string
): Promise<PublicRescheduleOptionsDto> {
    const raw = await publicRequest<unknown>(
        `/api/public/appointments/reschedule-options?token=${encodeURIComponent(token)}`,
        { method: 'GET' }
    );
    return normalizarRescheduleOptions(raw);
}

/**
 * POST /api/public/appointments/reschedule
 */
export async function rescheduleAppointmentByToken(
    token: string,
    newScheduleBlockId: string,
    reason?: string
): Promise<PublicRescheduleResultDto> {
    return publicRequest<PublicRescheduleResultDto>('/api/public/appointments/reschedule', {
        method: 'POST',
        body: JSON.stringify({
            token,
            newScheduleBlockId,
            ...(reason && reason.trim() ? { reason: reason.trim() } : {})
        })
    });
}

/**
 * GET /api/public/waiting-list/offers/preview?token=...
 */
export async function previewWaitingListOffer(
    token: string
): Promise<PublicWaitingListOfferPreviewDto> {
    return publicRequest<PublicWaitingListOfferPreviewDto>(
        `/api/public/waiting-list/offers/preview?token=${encodeURIComponent(token)}`,
        { method: 'GET' }
    );
}

/**
 * POST /api/public/waiting-list/offers/accept
 */
export async function acceptWaitingListOfferByToken(
    token: string
): Promise<PublicWaitingListOfferResultDto> {
    return publicRequest<PublicWaitingListOfferResultDto>('/api/public/waiting-list/offers/accept', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
}

/**
 * POST /api/public/waiting-list/offers/decline
 */
export async function declineWaitingListOfferByToken(
    token: string,
    reason?: string
): Promise<PublicWaitingListOfferResultDto> {
    return publicRequest<PublicWaitingListOfferResultDto>('/api/public/waiting-list/offers/decline', {
        method: 'POST',
        body: JSON.stringify({
            token,
            ...(reason && reason.trim() ? { reason: reason.trim() } : {})
        })
    });
}
