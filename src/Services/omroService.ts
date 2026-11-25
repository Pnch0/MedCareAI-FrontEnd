import { apiClient } from './apiClient.ts';

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
    Type?: string;
    description?: string;
    reason?: string;
    parameters?: Record<string, unknown>;
}

export interface OmroAiPlanPayload {
    title?: string;
    reasoning?: string;
    deferredActions?: OmroProposedAction[];
    DeferredActions?: OmroProposedAction[];
    proposedActions?: OmroProposedAction[];
    ProposedActions?: OmroProposedAction[];
    isShadowModeFallback?: boolean;
    IsShadowModeFallback?: boolean;
    matchedRuleId?: string;
    MatchedRuleId?: string;
    policyVersion?: string;
    PolicyVersion?: string;
    confidenceScore?: number;
    ConfidenceScore?: number;
    proposalExpiresAt?: string;
    ProposalExpiresAt?: string;
    [key: string]: unknown;
}

function mapearActionTypeString(actionTypeRaw: string): TipoAccionOMRO | null {
    const upper = actionTypeRaw.trim().toUpperCase();
    if (!upper) return null;

    if (
        upper.includes('MONITOR') ||
        upper.includes('NOTIF') ||
        upper.includes('REMIND') ||
        upper.includes('CONFIRM') ||
        upper.includes('PHONE') ||
        upper.includes('CALL') ||
        upper.includes('RECORDATORIO') ||
        upper.includes('SMS') ||
        upper.includes('WHATSAPP') ||
        upper.includes('EMAIL') ||
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
        // Prioridad 1: Contrato v2.0 (deferredActions) y compatibilidad v1 (proposedActions)
        const payload = parsedObj as OmroAiPlanPayload;
        const accionesDiferidas = Array.isArray(payload.deferredActions)
            ? payload.deferredActions
            : Array.isArray(payload.DeferredActions)
            ? payload.DeferredActions
            : [];
        const accionesPropuestas = Array.isArray(payload.proposedActions)
            ? payload.proposedActions
            : Array.isArray(payload.ProposedActions)
            ? payload.ProposedActions
            : [];
        const acciones = [...accionesDiferidas, ...accionesPropuestas];

        for (const acc of acciones) {
            if (acc && typeof acc === 'object') {
                const rawType = String(acc.actionType ?? acc.ActionType ?? acc.type ?? acc.Type ?? '');
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
    isShadowModeFallback?: boolean;
    IsShadowModeFallback?: boolean;
    is_shadow_mode_fallback?: boolean;
    matchedRuleId?: string | null;
    MatchedRuleId?: string | null;
    matched_rule_id?: string | null;
    policyVersion?: string | null;
    PolicyVersion?: string | null;
    policy_version?: string | null;
    confidenceScore?: number | null;
    ConfidenceScore?: number | null;
    confidence_score?: number | null;
    proposalExpiresAt?: string | null;
    ProposalExpiresAt?: string | null;
    proposal_expires_at?: string | null;
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
    isShadowModeFallback: boolean;
    matchedRuleId: string | null;
    policyVersion: string | null;
    confidenceScore: number | null;
    proposalExpiresAt: string | null;
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

function parsearObjetoPlan(
    aiPlanInput: string | Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
    if (!aiPlanInput) return null;
    if (typeof aiPlanInput === 'object' && !Array.isArray(aiPlanInput)) {
        return aiPlanInput;
    }
    if (typeof aiPlanInput === 'string') {
        try {
            const parsed: unknown = JSON.parse(aiPlanInput);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
        } catch {
            return null;
        }
    }
    return null;
}

function normalizarConfidenceScore(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') return null;
    const num = Number(valor);
    if (Number.isNaN(num)) return null;
    const pct = num > 0 && num <= 1 ? num * 100 : num;
    return Math.round(pct * 10) / 10;
}

function normalizarTextoOpcional(valor: unknown): string | null {
    if (typeof valor !== 'string') return null;
    const trimmed = valor.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizarResolutionTask(dto: ResolutionTaskBackendDto): ResolutionTask {
    const id = String(dto.id || dto.Id || '');
    const resourceId = String(dto.resourceId || dto.ResourceId || dto.resource_id || '');
    const riskProbRaw = dto.riskProbability ?? dto.RiskProbability ?? dto.risk_probability ?? 0;
    const rawPlan = dto.aiPlanJson ?? dto.AiPlanJson ?? dto.ai_plan_json ?? '';
    const status = String(dto.status || dto.Status || 'Pending');
    const createdAtIso = String(dto.createdAt || dto.CreatedAt || dto.created_at || '');

    const aiPlan = parsearAiPlanJson(rawPlan);
    const planObj = parsearObjetoPlan(rawPlan);

    const shadowRaw =
        dto.isShadowModeFallback ??
        dto.IsShadowModeFallback ??
        dto.is_shadow_mode_fallback ??
        planObj?.isShadowModeFallback ??
        planObj?.IsShadowModeFallback;

    const matchedRuleId = normalizarTextoOpcional(
        dto.matchedRuleId ??
            dto.MatchedRuleId ??
            dto.matched_rule_id ??
            planObj?.matchedRuleId ??
            planObj?.MatchedRuleId
    );

    const policyVersion = normalizarTextoOpcional(
        dto.policyVersion ??
            dto.PolicyVersion ??
            dto.policy_version ??
            planObj?.policyVersion ??
            planObj?.PolicyVersion
    );

    const confidenceScore = normalizarConfidenceScore(
        dto.confidenceScore ??
            dto.ConfidenceScore ??
            dto.confidence_score ??
            planObj?.confidenceScore ??
            planObj?.ConfidenceScore
    );

    const proposalExpiresAt = normalizarTextoOpcional(
        dto.proposalExpiresAt ??
            dto.ProposalExpiresAt ??
            dto.proposal_expires_at ??
            planObj?.proposalExpiresAt ??
            planObj?.ProposalExpiresAt
    );

    return {
        id,
        resourceId,
        riskProbability: normalizarProbabilidad(Number(riskProbRaw)),
        aiPlan,
        aiPlanRaw: typeof rawPlan === 'string' ? rawPlan : JSON.stringify(rawPlan),
        status,
        createdAt: formatearFechaChile(createdAtIso),
        createdAtIso,
        isShadowModeFallback: Boolean(shadowRaw),
        matchedRuleId,
        policyVersion,
        confidenceScore,
        proposalExpiresAt
    };
}

/**
 * Obtiene las resoluciones pendientes exclusivamente desde la API MedCareOS:
 * GET /api/Resolutions/pending
 */
export async function obtenerResolucionesPendientesOMRO(): Promise<ResolutionTask[]> {
    try {
        const respuesta: unknown = await apiClient('/api/Resolutions/pending', { method: 'GET' });
        if (Array.isArray(respuesta)) {
            return (respuesta as ResolutionTaskBackendDto[]).map(normalizarResolutionTask);
        }
    } catch (err: unknown) {
        console.warn('Error al consultar GET /api/Resolutions/pending:', err);
    }

    return [];
}

const OMRO_RESOLVED_CACHE_KEY = 'medcare_omro_resolved_cache';

function leerCacheResueltas(): ResolutionTask[] {
    try {
        const raw = localStorage.getItem(OMRO_RESOLVED_CACHE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (item): item is ResolutionTask =>
                Boolean(item) &&
                typeof item === 'object' &&
                typeof (item as ResolutionTask).id === 'string' &&
                typeof (item as ResolutionTask).status === 'string'
        );
    } catch {
        return [];
    }
}

function guardarEnCacheResueltas(tarea: ResolutionTask): void {
    try {
        const actuales = leerCacheResueltas();
        const filtradas = actuales.filter((t) => t.id !== tarea.id);
        const actualizadas = [tarea, ...filtradas].slice(0, 50);
        localStorage.setItem(OMRO_RESOLVED_CACHE_KEY, JSON.stringify(actualizadas));
    } catch {
        // Ignorar errores de cuota de almacenamiento
    }
}

/**
 * Obtiene el historial completo de tareas OMRO (pendientes + aprobadas + rechazadas)
 * consultando los endpoints REST del backend C# y caché local de sesión para resueltas.
 */
export async function obtenerHistorialOMRO(): Promise<ResolutionTask[]> {
    const mapaTareas = new Map<string, ResolutionTask>();

    // 1. Cargar caché local de resoluciones aprobadas/rechazadas en la sesión
    for (const tareaCache of leerCacheResueltas()) {
        if (tareaCache.id) {
            mapaTareas.set(tareaCache.id, tareaCache);
        }
    }

    // 2. Consultar listado completo si el backend expone GET /api/Resolutions
    try {
        const historialBackend: unknown = await apiClient('/api/Resolutions', { method: 'GET' });
        if (Array.isArray(historialBackend)) {
            for (const dto of historialBackend as ResolutionTaskBackendDto[]) {
                const tarea = normalizarResolutionTask(dto);
                if (tarea.id) {
                    mapaTareas.set(tarea.id, tarea);
                }
            }
        }
    } catch {
        // El backend puede exponer únicamente /api/Resolutions/pending
    }

    // 3. Consultar tareas pendientes vivas desde el motor C# (GET /api/Resolutions/pending)
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
        console.warn('GET /api/Resolutions/pending no disponible:', apiErr);
    }

    return Array.from(mapaTareas.values()).sort((a, b) => {
        const tA = new Date(a.createdAtIso).getTime() || 0;
        const tB = new Date(b.createdAtIso).getTime() || 0;
        return tB - tA;
    });
}

/**
 * Registra la decisión del administrador o recepcionista (Approved / Rejected) sobre una tarea OMRO.
 * Depende exclusivamente de PATCH /api/Resolutions/{id}/approve|reject (204 NoContent).
 * Si la API falla, propaga el error con mensaje claro hacia la vista.
 */
export async function resolverTareaOMRO(
    taskId: string,
    decision: 'Approved' | 'Rejected',
    tareaOriginal?: ResolutionTask
): Promise<boolean> {
    if (!taskId) {
        throw new Error('Identificador de tarea OMRO inválido.');
    }

    const accionRuta = decision === 'Approved' ? 'approve' : 'reject';

    try {
        await apiClient(`/api/Resolutions/${taskId}/${accionRuta}`, {
            method: 'PATCH'
        });
    } catch (err: unknown) {
        if (err instanceof Error && err.message) {
            throw err;
        }
        throw new Error('No se pudo conectar con la API de MedCareOS para registrar la decisión OMRO.');
    }

    if (tareaOriginal) {
        guardarEnCacheResueltas({
            ...tareaOriginal,
            status: decision
        });
    }

    return true;
}
