import { apiClient } from './apiClient.ts';

export interface SetAutoOverbookRequestDto {
    tenantId?: string | null;
    enabled: boolean;
    reason: string;
    allowDemoOverride?: boolean;
}

export interface SeedSyntheticRequestDto {
    tenantId?: string | null;
    sampleSize?: number;
}

export interface OverbookAutonomyReadiness {
    tenantId: string | null;
    autoOverbookEnabled: boolean;
    isReady: boolean;
    evaluatedWouldOverbookCount: number;
    minimumRequiredEvaluations: number;
    falsePositiveCount: number;
    falsePositiveRate: number;
    maxFalsePositiveRate: number;
    wilsonUpperBound95: number;
    blockingReasons: string[];
}

export interface OverbookPolicyAuditLogItem {
    id: string;
    tenantId: string | null;
    adminUserId: string | null;
    actorLabel: string;
    previousEnabled: boolean | null;
    newEnabled: boolean;
    reason: string;
    allowDemoOverride: boolean;
    createdAtIso: string;
}

export interface SetTenantAutoOverbookResult {
    autoOverbookEnabled: boolean;
    message?: string;
}

export interface SeedSyntheticResult {
    seededCount: number;
    message?: string;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function leerProp(obj: Record<string, unknown>, ...claves: string[]): unknown {
    for (const clave of claves) {
        if (clave in obj && obj[clave] !== undefined && obj[clave] !== null) {
            return obj[clave];
        }
    }
    return undefined;
}

function aNumero(valor: unknown, fallback: number = 0): number {
    if (typeof valor === 'number' && !Number.isNaN(valor)) return valor;
    if (typeof valor === 'string') {
        const num = Number(valor);
        if (!Number.isNaN(num)) return num;
    }
    return fallback;
}

function aPorcentaje(valor: unknown, fallback: number = 0): number {
    const num = aNumero(valor, fallback);
    const pct = num > 0 && num <= 1 ? num * 100 : num;
    return Math.round(pct * 10) / 10;
}

function aBooleano(valor: unknown, fallback: boolean = false): boolean {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
        const lower = valor.trim().toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
    }
    return fallback;
}

function normalizarListaStrings(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw.map((item) => String(item).trim()).filter((s) => s.length > 0);
    }
    if (esObjeto(raw) && Array.isArray(raw.$values)) {
        return raw.$values.map((item) => String(item).trim()).filter((s) => s.length > 0);
    }
    return [];
}

function normalizarListaObjetos(raw: unknown): Record<string, unknown>[] {
    if (Array.isArray(raw)) {
        return raw.filter(esObjeto);
    }
    if (esObjeto(raw) && Array.isArray(raw.$values)) {
        return raw.$values.filter(esObjeto);
    }
    return [];
}

export function normalizarReadiness(raw: unknown): OverbookAutonomyReadiness {
    const obj = esObjeto(raw) ? raw : {};

    const evaluatedCount = Math.round(
        aNumero(
            leerProp(
                obj,
                'evaluatedWouldOverbookCount',
                'EvaluatedWouldOverbookCount',
                'shadowEvaluatedCount',
                'ShadowEvaluatedCount'
            ),
            0
        )
    );

    const minRequired = Math.round(
        aNumero(
            leerProp(
                obj,
                'minimumRequiredEvaluations',
                'MinimumRequiredEvaluations',
                'requiredEvaluations',
                'RequiredEvaluations',
                'minSampleSize',
                'MinSampleSize'
            ),
            200
        )
    );

    const fpCount = Math.round(
        aNumero(
            leerProp(
                obj,
                'falsePositiveCount',
                'FalsePositiveCount',
                'shadowFalsePositivesCount',
                'ShadowFalsePositivesCount'
            ),
            0
        )
    );

    const fpRate = aPorcentaje(
        leerProp(
            obj,
            'falsePositiveRate',
            'FalsePositiveRate',
            'observedFalsePositiveRate',
            'ObservedFalsePositiveRate'
        ),
        evaluatedCount > 0 ? Math.round((fpCount / evaluatedCount) * 1000) / 10 : 0
    );

    const maxFpRate = aPorcentaje(
        leerProp(
            obj,
            'maxFalsePositiveRate',
            'MaxFalsePositiveRate',
            'falsePositiveThreshold',
            'FalsePositiveThreshold'
        ),
        15
    );

    const wilsonUpper = aPorcentaje(
        leerProp(
            obj,
            'wilsonUpperBound95',
            'WilsonUpperBound95',
            'wilsonUpperBound',
            'WilsonUpperBound',
            'upperBound95',
            'UpperBound95'
        ),
        0
    );

    const blockingReasons = normalizarListaStrings(
        leerProp(obj, 'blockingReasons', 'BlockingReasons')
    );

    const autoOverbookEnabled = aBooleano(
        leerProp(obj, 'autoOverbookEnabled', 'AutoOverbookEnabled', 'isEnabled', 'IsEnabled'),
        false
    );

    const isReadyRaw = leerProp(obj, 'isReady', 'IsReady', 'canEnable', 'CanEnable', 'ready', 'Ready');
    const isReady =
        isReadyRaw !== undefined
            ? aBooleano(isReadyRaw, false)
            : blockingReasons.length === 0 && evaluatedCount >= minRequired && wilsonUpper <= maxFpRate;

    const rawTenantId = leerProp(obj, 'tenantId', 'TenantId');

    return {
        tenantId: rawTenantId ? String(rawTenantId) : null,
        autoOverbookEnabled,
        isReady,
        evaluatedWouldOverbookCount: evaluatedCount,
        minimumRequiredEvaluations: minRequired > 0 ? minRequired : 200,
        falsePositiveCount: fpCount,
        falsePositiveRate: fpRate,
        maxFalsePositiveRate: maxFpRate > 0 ? maxFpRate : 15,
        wilsonUpperBound95: wilsonUpper,
        blockingReasons
    };
}

export function normalizarAuditLog(raw: unknown): OverbookPolicyAuditLogItem[] {
    const items = normalizarListaObjetos(raw);

    return items
        .map((item, idx) => {
            const id = String(leerProp(item, 'id', 'Id') ?? `audit-${idx}`);
            const tenantRaw = leerProp(item, 'tenantId', 'TenantId');
            const adminRaw = leerProp(
                item,
                'adminUserId',
                'AdminUserId',
                'changedByUserId',
                'ChangedByUserId',
                'changedBy',
                'ChangedBy'
            );
            const actorRaw = leerProp(
                item,
                'adminEmail',
                'AdminEmail',
                'changedByName',
                'ChangedByName',
                'actorName',
                'ActorName'
            );

            const prevRaw = leerProp(
                item,
                'previousEnabled',
                'PreviousEnabled',
                'previousValue',
                'PreviousValue'
            );
            const newRaw = leerProp(
                item,
                'newEnabled',
                'NewEnabled',
                'enabled',
                'Enabled',
                'newValue',
                'NewValue',
                'autoOverbookEnabled',
                'AutoOverbookEnabled'
            );

            const reason = String(
                leerProp(item, 'reason', 'Reason', 'justification', 'Justification') ?? 'Sin motivo registrado'
            );

            const allowOverride = aBooleano(
                leerProp(item, 'allowDemoOverride', 'AllowDemoOverride'),
                false
            );

            const createdAtIso = String(
                leerProp(item, 'createdAt', 'CreatedAt', 'changedAt', 'ChangedAt', 'timestamp', 'Timestamp') ?? ''
            );

            return {
                id,
                tenantId: tenantRaw ? String(tenantRaw) : null,
                adminUserId: adminRaw ? String(adminRaw) : null,
                actorLabel: actorRaw
                    ? String(actorRaw)
                    : adminRaw
                    ? `Admin (${String(adminRaw).slice(0, 8)}...)`
                    : 'Administrador',
                previousEnabled: prevRaw !== undefined ? aBooleano(prevRaw, false) : null,
                newEnabled: aBooleano(newRaw, false),
                reason,
                allowDemoOverride: allowOverride,
                createdAtIso
            };
        })
        .sort((a, b) => {
            const tA = new Date(a.createdAtIso).getTime() || 0;
            const tB = new Date(b.createdAtIso).getTime() || 0;
            return tB - tA;
        });
}

/**
 * GET /api/admin/tenants/overbook-autonomy/readiness
 */
export async function obtenerOverbookReadiness(
    tenantId?: string | null
): Promise<OverbookAutonomyReadiness> {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    const respuesta: unknown = await apiClient(`/api/admin/tenants/overbook-autonomy/readiness${query}`, {
        method: 'GET'
    });
    return normalizarReadiness(respuesta);
}

/**
 * PATCH /api/admin/tenants/overbook-autonomy
 */
export async function actualizarAutoOverbook(
    request: SetAutoOverbookRequestDto
): Promise<SetTenantAutoOverbookResult> {
    const respuesta: unknown = await apiClient('/api/admin/tenants/overbook-autonomy', {
        method: 'PATCH',
        body: JSON.stringify(request)
    });
    const obj = esObjeto(respuesta) ? respuesta : {};
    return {
        autoOverbookEnabled: aBooleano(
            leerProp(obj, 'autoOverbookEnabled', 'AutoOverbookEnabled', 'enabled', 'Enabled'),
            request.enabled
        ),
        message: typeof obj.message === 'string' ? obj.message : undefined
    };
}

/**
 * GET /api/admin/tenants/overbook-autonomy/audit
 */
export async function obtenerOverbookAuditLogs(
    tenantId?: string | null
): Promise<OverbookPolicyAuditLogItem[]> {
    const query = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    const respuesta: unknown = await apiClient(`/api/admin/tenants/overbook-autonomy/audit${query}`, {
        method: 'GET'
    });
    return normalizarAuditLog(respuesta);
}

/**
 * POST /api/admin/tenants/overbook-autonomy/seed-synthetic
 */
export async function generarEvaluacionSintetica(
    request: SeedSyntheticRequestDto = { sampleSize: 220 }
): Promise<SeedSyntheticResult> {
    const respuesta: unknown = await apiClient('/api/admin/tenants/overbook-autonomy/seed-synthetic', {
        method: 'POST',
        body: JSON.stringify(request)
    });
    const obj = esObjeto(respuesta) ? respuesta : {};
    const seededCount = Math.round(
        aNumero(
            leerProp(obj, 'seededCount', 'SeededCount', 'insertedCount', 'InsertedCount', 'sampleSize', 'SampleSize'),
            request.sampleSize ?? 220
        )
    );
    return {
        seededCount,
        message: typeof obj.message === 'string' ? obj.message : undefined
    };
}
