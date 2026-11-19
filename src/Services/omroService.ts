import { apiClient } from './apiClient.ts';
import { supabase } from './supabaseClient.ts';

export type TipoAccionOMRO = 'Sobrecupo' | 'Recordatorio' | 'Reasignacion' | 'Otro';

export interface ConfiguracionAccionOMRO {
    letra: 'S' | 'R' | 'C' | 'O';
    claseCss: 'accion-sobrecupo' | 'accion-recordatorio' | 'accion-reasignacion' | 'accion-otro';
    nombreCompleto: string;
}

export function obtenerConfiguracionAccion(tipo: TipoAccionOMRO): ConfiguracionAccionOMRO {
    switch (tipo) {
        case 'Sobrecupo':
            return { letra: 'S', claseCss: 'accion-sobrecupo', nombreCompleto: 'Sobrecupo' };
        case 'Recordatorio':
            return { letra: 'R', claseCss: 'accion-recordatorio', nombreCompleto: 'Recordatorio' };
        case 'Reasignacion':
            return { letra: 'C', claseCss: 'accion-reasignacion', nombreCompleto: 'Cambio / Reasignación' };
        default:
            return { letra: 'O', claseCss: 'accion-otro', nombreCompleto: 'Acción OMRO' };
    }
}

export interface OmroProposedAction {
    actionType?: string;
    ActionType?: string;
    type?: string;
    description?: string;
    parameters?: Record<string, unknown>;
}

export interface OmroAiPlanPayload {
    title?: string;
    reasoning?: string;
    proposedActions?: OmroProposedAction[];
    ProposedActions?: OmroProposedAction[];
    [key: string]: unknown;
}

function mapearActionTypeString(actionTypeRaw: string): TipoAccionOMRO | null {
    const upper = actionTypeRaw.trim().toUpperCase();
    if (!upper) return null;

    if (
        upper.includes('MONITOR') ||
        upper.includes('REMIND') ||
        upper.includes('CONFIRM') ||
        upper.includes('PHONE') ||
        upper.includes('CALL') ||
        upper.includes('RECORDATORIO') ||
        upper.includes('SMS') ||
        upper.includes('WHATSAPP') ||
        upper.includes('AVISO')
    ) {
        return 'Recordatorio';
    }
    if (
        upper.includes('OVERBOOK') ||
        upper.includes('SOBRECUPO') ||
        upper.includes('EXTRA_SLOT') ||
        upper.includes('ADD_SLOT')
    ) {
        return 'Sobrecupo';
    }
    if (
        upper.includes('RESCHEDULE') ||
        upper.includes('REASSIGN') ||
        upper.includes('REASIGN') ||
        upper.includes('CAMBIO') ||
        upper.includes('CHANGE') ||
        upper.includes('REPROGRAM')
    ) {
        return 'Reasignacion';
    }
    return null;
}

function limpiarNegaciones(texto: string): string {
    return texto
        .toLowerCase()
        .replace(/no\s+se\s+(automatizar[aá]|generar[aá]|aplicar[aá]|realizar[aá])\s+(el\s+|la\s+)?(sobrecupo|overbook\w*|reasignaci[oó]n|cambio|recordatorio)/g, '')
        .replace(/(sin|descarta|evitar|no)\s+(generar\s+)?(sobrecupo|overbook\w*)/g, '');
}

function clasificarTipoAccion(texto: string, parsedObj?: Record<string, unknown> | null): TipoAccionOMRO {
    if (parsedObj) {
        // Prioridad 1: Contrato estructurado proposedActions del motor OMRO
        const payload = parsedObj as OmroAiPlanPayload;
        const acciones = Array.isArray(payload.proposedActions)
            ? payload.proposedActions
            : Array.isArray(payload.ProposedActions)
            ? payload.ProposedActions
            : [];

        for (const acc of acciones) {
            if (acc && typeof acc === 'object') {
                const rawType = String(acc.actionType ?? acc.ActionType ?? acc.type ?? '');
                const mapeado = mapearActionTypeString(rawType);
                if (mapeado) return mapeado;
            }
        }

        // Prioridad 2: Códigos numéricos o string directo en actionType
        const codigoNumerico = parsedObj.actionType ?? parsedObj.ActionType ?? parsedObj.type ?? parsedObj.Type;
        if (codigoNumerico === 1 || codigoNumerico === '1') return 'Sobrecupo';
        if (codigoNumerico === 2 || codigoNumerico === '2') return 'Recordatorio';
        if (codigoNumerico === 3 || codigoNumerico === '3') return 'Reasignacion';
        if (typeof codigoNumerico === 'string') {
            const mapeado = mapearActionTypeString(codigoNumerico);
            if (mapeado) return mapeado;
        }
    }

    // Prioridad 3: Análisis semántico limpio de negaciones
    const lower = limpiarNegaciones(texto);
    if (
        lower.includes('recordatorio') ||
        lower.includes('reminder') ||
        lower.includes('confirmación telefónica') ||
        lower.includes('confirmacion telefonica') ||
        lower.includes('notific') ||
        lower.includes('sms') ||
        lower.includes('whatsapp') ||
        lower.includes('aviso') ||
        lower.includes('alert') ||
        lower.includes('contactar')
    ) {
        return 'Recordatorio';
    }
    if (
        lower.includes('sobrecupo') ||
        lower.includes('overbook') ||
        lower.includes('cupo') ||
        lower.includes('extraslot') ||
        lower.includes('extra_slot') ||
        lower.includes('slot')
    ) {
        return 'Sobrecupo';
    }
    if (
        lower.includes('reasign') ||
        lower.includes('cambio') ||
        lower.includes('reschedule') ||
        lower.includes('reprogram') ||
        lower.includes('reubicar') ||
        lower.includes('cambiar') ||
        lower.includes('reassign')
    ) {
        return 'Reasignacion';
    }
    return 'Otro';
}

export interface ResolutionTaskBackendDto {
    id?: string;
    Id?: string;
    resourceId?: string;
    ResourceId?: string;
    resource_id?: string;
    riskProbability?: number;
    RiskProbability?: number;
    risk_probability?: number;
    aiPlanJson?: string | Record<string, unknown>;
    AiPlanJson?: string | Record<string, unknown>;
    ai_plan_json?: string | Record<string, unknown>;
    status?: string;
    Status?: string;
    createdAt?: string;
    CreatedAt?: string;
    created_at?: string;
}

export interface AiPlanContenido {
    titulo: string;
    descripcion: string;
    tipoAccion: TipoAccionOMRO;
    sugerencia?: string;
}

export interface ResolutionTask {
    id: string;
    resourceId: string;
    riskProbability: number;
    aiPlan: AiPlanContenido;
    aiPlanRaw: string;
    status: string;
    createdAt: string;
    createdAtIso: string;
}

function formatearFechaChile(fechaIso: string): string {
    if (!fechaIso) return 'Sin fecha';
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return fechaIso;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}-${mes}-${anio}`;
}

function normalizarProbabilidad(valor: number | undefined): number {
    if (typeof valor !== 'number' || Number.isNaN(valor)) return 0;
    const porcentaje = valor <= 1 && valor > 0 ? valor * 100 : valor;
    return Math.round(porcentaje * 10) / 10;
}

export function parsearAiPlanJson(
    aiPlanInput: string | Record<string, unknown> | null | undefined
): AiPlanContenido {
    if (!aiPlanInput) {
        return {
            titulo: 'Acción Preventiva OMRO',
            descripcion: 'Revisión preventiva de agenda sugerida por el motor orquestador.',
            tipoAccion: 'Otro'
        };
    }

    let parsedObj: Record<string, unknown> | null = null;
    let rawText = '';

    if (typeof aiPlanInput === 'string') {
        rawText = aiPlanInput;
        try {
            const parsed: unknown = JSON.parse(aiPlanInput);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                parsedObj = parsed as Record<string, unknown>;
            }
        } catch {
            // Texto plano o JSON no estándar
        }
    } else if (typeof aiPlanInput === 'object') {
        parsedObj = aiPlanInput;
        rawText = JSON.stringify(aiPlanInput);
    }

    if (parsedObj) {
        const extraerTexto = (claves: string[]): string => {
            for (const c of claves) {
                const val = parsedObj?.[c];
                if (typeof val === 'string' && val.trim().length > 0) {
                    return val.trim();
                }
            }
            return '';
        };

        const rawAction = extraerTexto([
            'action',
            'Action',
            'tipoAccion',
            'actionType',
            'ActionType',
            'type',
            'Type',
            'strategy',
            'resolution',
            'Resolution',
            'taskType',
            'TaskType',
            'recommendation',
            'Recommendation'
        ]);
        const rawTitulo = extraerTexto([
            'title',
            'Title',
            'titulo',
            'action',
            'Action',
            'actionName',
            'ActionName',
            'name',
            'Name'
        ]);
        const rawDesc = extraerTexto([
            'reasoning',
            'Reasoning',
            'reason',
            'Reason',
            'descripcion',
            'description',
            'Description',
            'justificacion',
            'message',
            'summary',
            'detail',
            'Detail'
        ]);
        const rawSug = extraerTexto(['suggestion', 'sugerencia', 'plan', 'recommendedAction', 'recommendation']);

        const textoAnalisis = `${rawAction} ${rawTitulo} ${rawDesc} ${rawSug}`;
        const tipoAccion = clasificarTipoAccion(textoAnalisis, parsedObj);

        const tituloPorDefecto =
            tipoAccion === 'Sobrecupo'
                ? '¿Desea generar sobrecupo?'
                : tipoAccion === 'Recordatorio'
                ? 'Enviar Recordatorio'
                : tipoAccion === 'Reasignacion'
                ? 'Reasignar Horario'
                : 'Acción Preventiva OMRO';

        return {
            titulo: rawTitulo || tituloPorDefecto,
            descripcion: rawDesc || rawSug || 'Plan de mitigación de ausentismo sugerido por OMRO.',
            tipoAccion,
            sugerencia: rawSug || undefined
        };
    }

    const tipoAccion = clasificarTipoAccion(rawText);

    return {
        titulo:
            tipoAccion === 'Sobrecupo'
                ? '¿Desea generar sobrecupo?'
                : tipoAccion === 'Recordatorio'
                ? 'Enviar Recordatorio'
                : tipoAccion === 'Reasignacion'
                ? 'Reasignar Horario'
                : 'Acción Preventiva OMRO',
        descripcion: rawText,
        tipoAccion
    };
}

function normalizarResolutionTask(dto: ResolutionTaskBackendDto): ResolutionTask {
    const id = String(dto.id || dto.Id || '');
    const resourceId = String(dto.resourceId || dto.ResourceId || dto.resource_id || '');
    const riskProbRaw = dto.riskProbability ?? dto.RiskProbability ?? dto.risk_probability ?? 0;
    const rawPlan = dto.aiPlanJson ?? dto.AiPlanJson ?? dto.ai_plan_json ?? '';
    const status = String(dto.status || dto.Status || 'Pending');
    const createdAtIso = String(dto.createdAt || dto.CreatedAt || dto.created_at || '');

    const aiPlan = parsearAiPlanJson(rawPlan);
    console.log(`[OMRO Frontend] Tarea ${id || 'sin-id'}: tipo='${aiPlan.tipoAccion}' | aiPlanJson original:`, rawPlan);

    return {
        id,
        resourceId,
        riskProbability: normalizarProbabilidad(Number(riskProbRaw)),
        aiPlan,
        aiPlanRaw: typeof rawPlan === 'string' ? rawPlan : JSON.stringify(rawPlan),
        status,
        createdAt: formatearFechaChile(createdAtIso),
        createdAtIso
    };
}

/**
 * Obtiene las resoluciones pendientes desde el endpoint GET /api/Resolutions/pending
 * con respaldo directo a Supabase en caso de falla o indisponibilidad.
 */
export async function obtenerResolucionesPendientesOMRO(): Promise<ResolutionTask[]> {
    try {
        const respuesta: unknown = await apiClient('/api/Resolutions/pending', { method: 'GET' });
        if (Array.isArray(respuesta)) {
            return (respuesta as ResolutionTaskBackendDto[]).map(normalizarResolutionTask);
        }
    } catch (err: unknown) {
        console.warn('Error al consultar GET /api/Resolutions/pending, usando respaldo Supabase:', err);
    }

    try {
        const { data, error } = await supabase
            .from('ai_resolution_tasks')
            .select('*')
            .ilike('status', 'pending')
            .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
            return (data as ResolutionTaskBackendDto[]).map(normalizarResolutionTask);
        }
    } catch (supaErr: unknown) {
        console.warn('Error al consultar pendientes en Supabase:', supaErr);
    }

    return [];
}

/**
 * Obtiene el historial completo de tareas OMRO (pendientes + resueltas) combinando
 * el endpoint GET /api/Resolutions/pending con la tabla ai_resolution_tasks de Supabase.
 */
export async function obtenerHistorialOMRO(): Promise<ResolutionTask[]> {
    const mapaTareas = new Map<string, ResolutionTask>();

    // 1. Consultar historial completo en Supabase (ai_resolution_tasks)
    try {
        const { data, error } = await supabase
            .from('ai_resolution_tasks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (!error && Array.isArray(data)) {
            for (const row of data as ResolutionTaskBackendDto[]) {
                const tarea = normalizarResolutionTask(row);
                if (tarea.id) mapaTareas.set(tarea.id, tarea);
            }
        }
    } catch (err: unknown) {
        console.warn('No se pudo leer historial desde ai_resolution_tasks:', err);
    }

    // 2. Consultar tareas pendientes vivas desde el motor C# (GET /api/Resolutions/pending)
    try {
        const resBackend: unknown = await apiClient('/api/Resolutions/pending', { method: 'GET' });
        if (Array.isArray(resBackend)) {
            for (const dto of resBackend as ResolutionTaskBackendDto[]) {
                const tarea = normalizarResolutionTask(dto);
                if (tarea.id) {
                    mapaTareas.set(tarea.id, tarea);
                }
            }
        }
    } catch (apiErr: unknown) {
        console.warn('GET /api/Resolutions/pending no disponible, manteniendo datos de Supabase:', apiErr);
    }

    return Array.from(mapaTareas.values()).sort((a, b) => {
        const tA = new Date(a.createdAtIso).getTime() || 0;
        const tB = new Date(b.createdAtIso).getTime() || 0;
        return tB - tA;
    });
}

interface HttpError extends Error {
    status?: number;
}

function isHttpClientError(error: unknown): error is HttpError {
    return (
        error instanceof Error &&
        'status' in error &&
        typeof (error as HttpError).status === 'number' &&
        (error as HttpError).status! >= 400 &&
        (error as HttpError).status! < 500
    );
}

/**
 * Registra la decisión del administrador o recepcionista (Approved / Rejected) sobre una tarea OMRO.
 * Consume PATCH /api/Resolutions/{id}/approve|reject (204 NoContent) y sincroniza Supabase.
 */
export async function resolverTareaOMRO(
    taskId: string,
    decision: 'Approved' | 'Rejected'
): Promise<boolean> {
    let actualizadoBackend = false;

    const accionRuta = decision === 'Approved' ? 'approve' : 'reject';
    try {
        await apiClient(`/api/Resolutions/${taskId}/${accionRuta}`, {
            method: 'PATCH'
        });
        actualizadoBackend = true;
    } catch (err: unknown) {
        if (isHttpClientError(err)) {
            throw err;
        }
        console.warn(`PATCH /api/Resolutions/${taskId}/${accionRuta} no disponible, intentando persistir en Supabase:`, err);
    }

    try {
        const { error } = await supabase
            .from('ai_resolution_tasks')
            .update({ status: decision })
            .eq('id', taskId);

        if (!error) return true;
    } catch (err: unknown) {
        console.warn('Error al actualizar estado en ai_resolution_tasks:', err);
    }

    return actualizadoBackend;
}
