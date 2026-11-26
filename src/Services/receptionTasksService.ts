import { apiClient } from './apiClient.ts';

export type ReceptionTaskStatusFilter = '' | 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
export type ReceptionTaskPriorityFilter = '' | 'High' | 'Medium' | 'Low' | 'Urgent';

export interface ReceptionTaskItem {
    id: string;
    taskType: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedToUserId: string | null;
    assignedToName: string | null;
    appointmentId: string | null;
    competingAppointmentId: string | null;
    createdAtIso: string;
    resolutionNotes: string | null;
}

export interface GetReceptionTasksParams {
    status?: ReceptionTaskStatusFilter;
    priority?: ReceptionTaskPriorityFilter;
    assignedToMe?: boolean;
    page?: number;
    pageSize?: number;
}

export interface ReceptionTasksPagedResult {
    items: ReceptionTaskItem[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface AssignReceptionTaskRequestDto {
    assignedToUserId?: string | null;
}

export interface CompleteReceptionTaskRequestDto {
    resolutionNotes?: string | null;
}

export interface CancelReceptionTaskRequestDto {
    reason?: string | null;
}

export interface OverrideOverbookCollisionDto {
    winnerAppointmentId: string;
    reason: string;
}

export interface OverrideOverbookCollisionResult {
    message?: string;
    winnerAppointmentId?: string;
    displacedAppointmentId?: string;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerProp(obj: Record<string, unknown>, ...claves: string[]): unknown {
    for (const c of claves) {
        if (c in obj && obj[c] !== undefined && obj[c] !== null) {
            return obj[c];
        }
    }
    return undefined;
}

function normalizarTareaRecepcion(item: Record<string, unknown>, idx: number): ReceptionTaskItem {
    const id = String(leerProp(item, 'id', 'Id') ?? `rt-${idx}`);
    const taskType = String(
        leerProp(item, 'taskType', 'TaskType', 'type', 'Type', 'category', 'Category') ?? 'GENERAL'
    );
    const title = String(
        leerProp(item, 'title', 'Title', 'subject', 'Subject', 'summary', 'Summary') ??
            'Tarea de Recepción'
    );
    const description = String(
        leerProp(item, 'description', 'Description', 'details', 'Details', 'message', 'Message') ?? ''
    );
    const status = String(leerProp(item, 'status', 'Status') ?? 'Pending');
    const priority = String(leerProp(item, 'priority', 'Priority') ?? 'Medium');
    const assignedRaw = leerProp(item, 'assignedToUserId', 'AssignedToUserId');
    const assignedNameRaw = leerProp(item, 'assignedToName', 'AssignedToName', 'assigneeName');
    const appointmentRaw = leerProp(
        item,
        'appointmentId',
        'AppointmentId',
        'relatedAppointmentId',
        'RelatedAppointmentId'
    );
    const competingRaw = leerProp(
        item,
        'competingAppointmentId',
        'CompetingAppointmentId',
        'secondaryAppointmentId',
        'SecondaryAppointmentId'
    );
    const createdAtIso = String(
        leerProp(item, 'createdAt', 'CreatedAt', 'createdAtUtc', 'CreatedAtUtc') ?? ''
    );
    const notesRaw = leerProp(item, 'resolutionNotes', 'ResolutionNotes');

    return {
        id,
        taskType,
        title,
        description,
        status,
        priority,
        assignedToUserId: assignedRaw ? String(assignedRaw) : null,
        assignedToName: assignedNameRaw ? String(assignedNameRaw) : null,
        appointmentId: appointmentRaw ? String(appointmentRaw) : null,
        competingAppointmentId: competingRaw ? String(competingRaw) : null,
        createdAtIso,
        resolutionNotes: notesRaw ? String(notesRaw) : null
    };
}

/**
 * GET /api/reception-tasks
 */
export async function obtenerTareasRecepcion(
    params: GetReceptionTasksParams = {}
): Promise<ReceptionTasksPagedResult> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.assignedToMe) query.set('assignedToMe', 'true');
    query.set('page', String(params.page ?? 1));
    query.set('pageSize', String(params.pageSize ?? 20));

    const qs = query.toString();
    const respuesta: unknown = await apiClient(`/api/reception-tasks${qs ? `?${qs}` : ''}`, {
        method: 'GET'
    });

    if (Array.isArray(respuesta)) {
        const items = respuesta.filter(esObjeto).map(normalizarTareaRecepcion);
        return {
            items,
            totalCount: items.length,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 20
        };
    }

    if (esObjeto(respuesta)) {
        const rawList =
            (Array.isArray(respuesta.items) && respuesta.items) ||
            (Array.isArray(respuesta.Items) && respuesta.Items) ||
            (Array.isArray(respuesta.data) && respuesta.data) ||
            (Array.isArray(respuesta.$values) && respuesta.$values) ||
            [];

        const items = rawList.filter(esObjeto).map(normalizarTareaRecepcion);
        const totalRaw = leerProp(respuesta, 'totalCount', 'TotalCount', 'total', 'Total');
        const totalCount = typeof totalRaw === 'number' ? totalRaw : items.length;

        return {
            items,
            totalCount,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 20
        };
    }

    return {
        items: [],
        totalCount: 0,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20
    };
}

/**
 * PATCH /api/reception-tasks/{id}/assign
 */
export async function tomarTareaRecepcion(
    taskId: string,
    assignedToUserId?: string | null
): Promise<void> {
    const body: AssignReceptionTaskRequestDto = assignedToUserId
        ? { assignedToUserId }
        : {};
    await apiClient(`/api/reception-tasks/${taskId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * PATCH /api/reception-tasks/{id}/complete
 */
export async function completarTareaRecepcion(
    taskId: string,
    resolutionNotes?: string
): Promise<void> {
    const body: CompleteReceptionTaskRequestDto = resolutionNotes?.trim()
        ? { resolutionNotes: resolutionNotes.trim() }
        : {};
    await apiClient(`/api/reception-tasks/${taskId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * PATCH /api/reception-tasks/{id}/cancel
 */
export async function cancelarTareaRecepcion(
    taskId: string,
    reason?: string
): Promise<void> {
    const body: CancelReceptionTaskRequestDto = reason?.trim()
        ? { reason: reason.trim() }
        : {};
    await apiClient(`/api/reception-tasks/${taskId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * POST /api/Appointments/{id}/overbook-collision/override
 */
export async function ejecutarOverrideColisionSobrecupo(
    appointmentId: string,
    payload: OverrideOverbookCollisionDto
): Promise<OverrideOverbookCollisionResult> {
    const respuesta: unknown = await apiClient(
        `/api/Appointments/${appointmentId}/overbook-collision/override`,
        {
            method: 'POST',
            body: JSON.stringify(payload)
        }
    );

    if (esObjeto(respuesta)) {
        return {
            message: typeof respuesta.message === 'string' ? respuesta.message : undefined,
            winnerAppointmentId: respuesta.winnerAppointmentId
                ? String(respuesta.winnerAppointmentId)
                : undefined,
            displacedAppointmentId: respuesta.displacedAppointmentId
                ? String(respuesta.displacedAppointmentId)
                : undefined
        };
    }

    return {};
}
