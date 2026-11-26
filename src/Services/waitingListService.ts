import { apiClient } from './apiClient.ts';

export interface JoinWaitingListRequestDto {
    patientId?: string | null;
    specialty: string;
    preferredStaffId?: string | null;
    preferredFromDate?: string | null;
    preferredToDate?: string | null;
}

export interface WaitingListEntryItem {
    id: string;
    specialty: string;
    status: string;
    preferredStaffName: string | null;
    preferredFromDate: string | null;
    preferredToDate: string | null;
    createdAtIso: string;
}

export interface WaitingListOfferItem {
    id: string;
    waitingListId: string | null;
    specialty: string;
    clinicName: string;
    dateLocal: string;
    timeLocal: string;
    staffName: string;
    expiresAtIso: string | null;
    status: string;
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
        const inner = leerProp(raw, 'items', 'Items', '$values', 'data') ?? [];
        if (Array.isArray(inner)) return inner.filter(esObjeto);
    }
    return [];
}

function normalizarEntradaEspera(
    item: Record<string, unknown>,
    idx: number
): WaitingListEntryItem {
    return {
        id: String(leerProp(item, 'id', 'Id', 'waitingListId', 'WaitingListId') ?? `wl-${idx}`),
        specialty: String(leerProp(item, 'specialty', 'Specialty') ?? 'Medicina General'),
        status: String(leerProp(item, 'status', 'Status') ?? 'Active'),
        preferredStaffName: leerProp(
            item,
            'preferredStaffName',
            'PreferredStaffName',
            'staffName',
            'StaffName'
        )
            ? String(
                  leerProp(
                      item,
                      'preferredStaffName',
                      'PreferredStaffName',
                      'staffName',
                      'StaffName'
                  )
              )
            : null,
        preferredFromDate: leerProp(item, 'preferredFromDate', 'PreferredFromDate')
            ? String(leerProp(item, 'preferredFromDate', 'PreferredFromDate'))
            : null,
        preferredToDate: leerProp(item, 'preferredToDate', 'PreferredToDate')
            ? String(leerProp(item, 'preferredToDate', 'PreferredToDate'))
            : null,
        createdAtIso: String(leerProp(item, 'createdAt', 'CreatedAt') ?? '')
    };
}

function normalizarOfertaEspera(
    item: Record<string, unknown>,
    idx: number
): WaitingListOfferItem {
    const startRaw = leerProp(item, 'startTime', 'StartTime', 'fechaInicio') ?? '';
    const endRaw = leerProp(item, 'endTime', 'EndTime', 'fechaFin') ?? '';
    const startStr = typeof startRaw === 'string' && startRaw.includes('T') ? startRaw.slice(11, 16) : '';
    const endStr = typeof endRaw === 'string' && endRaw.includes('T') ? endRaw.slice(11, 16) : '';

    return {
        id: String(leerProp(item, 'id', 'Id', 'offerId', 'OfferId', 'waitingListOfferId') ?? `offer-${idx}`),
        waitingListId: leerProp(item, 'waitingListId', 'WaitingListId')
            ? String(leerProp(item, 'waitingListId', 'WaitingListId'))
            : null,
        specialty: String(leerProp(item, 'specialty', 'Specialty') ?? 'Consulta Médica'),
        clinicName: String(leerProp(item, 'clinicName', 'ClinicName') ?? 'MedCareAI'),
        dateLocal: String(
            leerProp(item, 'appointmentDateLocal', 'AppointmentDateLocal', 'dateLocal', 'DateLocal') ??
                (typeof startRaw === 'string' && startRaw.includes('T') ? startRaw.slice(0, 10) : 'Próxima fecha')
        ),
        timeLocal: String(
            leerProp(item, 'appointmentTimeLocal', 'AppointmentTimeLocal', 'timeLocal', 'TimeLocal') ??
                (startStr && endStr ? `${startStr} - ${endStr}` : startStr || 'Horario disponible')
        ),
        staffName: String(
            leerProp(item, 'staffName', 'StaffName', 'medicoNombre') ?? 'Profesional disponible'
        ),
        expiresAtIso: leerProp(item, 'expiresAt', 'ExpiresAt')
            ? String(leerProp(item, 'expiresAt', 'ExpiresAt'))
            : null,
        status: String(leerProp(item, 'status', 'Status') ?? 'Pending')
    };
}

/**
 * POST /api/waiting-list
 */
export async function unirseListaEspera(
    payload: JoinWaitingListRequestDto
): Promise<{ id: string }> {
    const respuesta: unknown = await apiClient('/api/waiting-list', {
        method: 'POST',
        body: JSON.stringify({
            patientId: payload.patientId ?? null,
            specialty: payload.specialty,
            preferredStaffId: payload.preferredStaffId || null,
            preferredFromDate: payload.preferredFromDate || null,
            preferredToDate: payload.preferredToDate || null
        })
    });
    const obj = esObjeto(respuesta) ? respuesta : {};
    return {
        id: String(leerProp(obj, 'id', 'Id') ?? '')
    };
}

/**
 * GET /api/waiting-list/me
 */
export async function obtenerMiListaEspera(): Promise<WaitingListEntryItem[]> {
    const respuesta: unknown = await apiClient('/api/waiting-list/me', {
        method: 'GET'
    });
    return extraerLista(respuesta).map(normalizarEntradaEspera);
}

/**
 * DELETE /api/waiting-list/{id}
 */
export async function salirListaEspera(
    waitingListId: string,
    reason?: string
): Promise<void> {
    const query = reason?.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : '';
    await apiClient(`/api/waiting-list/${waitingListId}${query}`, {
        method: 'DELETE'
    });
}

/**
 * GET /api/waiting-list/offers/me
 */
export async function obtenerMisOfertasListaEspera(): Promise<WaitingListOfferItem[]> {
    const respuesta: unknown = await apiClient('/api/waiting-list/offers/me', {
        method: 'GET'
    });
    return extraerLista(respuesta).map(normalizarOfertaEspera);
}

/**
 * POST /api/waiting-list/offers/{offerId}/accept
 */
export async function aceptarOfertaListaEspera(offerId: string): Promise<void> {
    await apiClient(`/api/waiting-list/offers/${offerId}/accept`, {
        method: 'POST',
        body: JSON.stringify({})
    });
}

/**
 * POST /api/waiting-list/offers/{offerId}/decline
 */
export async function rechazarOfertaListaEspera(
    offerId: string,
    reason?: string
): Promise<void> {
    await apiClient(`/api/waiting-list/offers/${offerId}/decline`, {
        method: 'POST',
        body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {})
    });
}
