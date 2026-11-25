import { apiClient } from './apiClient.ts';

export type PeriodoDashboard = '7d' | 'mes' | 'trimestre';

export type NivelRiesgo = 'ALTO' | 'MEDIO' | 'BAJO';

export interface ResumenKPIsDTO {
    totalCitas: number;
    tasaAsistencia: number;
    tasaAusentismo: number;
    deltaAusentismoVsPeriodoAnterior: number;
    citasRescatadasOMRO: number;
    horasMedicasPerdidas: number;
    impactoEstimadoPerdida: number;
}

export interface TendenciaTemporalDTO {
    periodo: string;
    asistidas: number;
    inasistencias: number;
    canceladasAnticipadas: number;
    tasaAusentismo: number;
}

export interface AusentismoEspecialidadDTO {
    especialidad: string;
    totalCitas: number;
    asistencias: number;
    inasistencias: number;
    tasaAusentismo: number;
    tendencia: 'alza' | 'baja' | 'estable';
}

export interface DistribucionEstadoDTO {
    estado: 'Asistió' | 'No Asistió' | 'Cancelada con Aviso' | 'Confirmada Pendiente';
    cantidad: number;
    porcentaje: number;
    color: string;
}

export interface AusentismoHorarioDTO {
    franja: string;
    tasaAusentismo: number;
    citasTotales: number;
}

export interface EfectividadOMRODTO {
    conRecordatorioAsistencia: number;
    sinRecordatorioAsistencia: number;
    recordatoriosEnviados: number;
    confirmacionesRecibidas: number;
}

export interface CitaRiesgoDTO {
    id: string;
    paciente: string;
    rut: string;
    especialidad: string;
    medico: string;
    fecha: string;
    hora: string;
    probabilidadAusentismo: number;
    nivelRiesgo: NivelRiesgo;
    factorPrincipal: string;
    estadoRecordatorio: 'Enviado' | 'Pendiente' | 'Confirmado';
}

export interface OverbookMetricsDTO {
    slotRefilled: number;
    overbookSlotsOpened: number;
    overbookSlotsOccupied: number;
    overbookCollisions: number;
    displacedPatients: number;
    falsePositiveRate: number;
    shadowEvaluatedCount: number;
    shadowFalsePositivesCount: number;
}

export interface DashboardAusentismoDTO {
    kpis: ResumenKPIsDTO;
    tendencia: TendenciaTemporalDTO[];
    porEspecialidad: AusentismoEspecialidadDTO[];
    distribucion: DistribucionEstadoDTO[];
    porHorario: AusentismoHorarioDTO[];
    omro: EfectividadOMRODTO;
    alertasRiesgo: CitaRiesgoDTO[];
    overbookMetrics?: OverbookMetricsDTO;
    esRespaldoMock?: boolean;
}

const MOCK_DASHBOARD_POR_PERIODO: Record<PeriodoDashboard, DashboardAusentismoDTO> = {
    '7d': {
        kpis: {
            totalCitas: 312,
            tasaAsistencia: 89.1,
            tasaAusentismo: 10.9,
            deltaAusentismoVsPeriodoAnterior: -1.8,
            citasRescatadasOMRO: 14,
            horasMedicasPerdidas: 11,
            impactoEstimadoPerdida: 275000
        },
        overbookMetrics: {
            slotRefilled: 9,
            overbookSlotsOpened: 12,
            overbookSlotsOccupied: 9,
            overbookCollisions: 0,
            displacedPatients: 0,
            falsePositiveRate: 4.2,
            shadowEvaluatedCount: 38,
            shadowFalsePositivesCount: 2
        },
        tendencia: [
            { periodo: 'Lun', asistidas: 48, inasistencias: 8, canceladasAnticipadas: 4, tasaAusentismo: 13.3 },
            { periodo: 'Mar', asistidas: 52, inasistencias: 6, canceladasAnticipadas: 3, tasaAusentismo: 9.8 },
            { periodo: 'Mié', asistidas: 49, inasistencias: 5, canceladasAnticipadas: 5, tasaAusentismo: 8.5 },
            { periodo: 'Jue', asistidas: 46, inasistencias: 7, canceladasAnticipadas: 2, tasaAusentismo: 12.7 },
            { periodo: 'Vie', asistidas: 44, inasistencias: 5, canceladasAnticipadas: 4, tasaAusentismo: 9.4 },
            { periodo: 'Sáb', asistidas: 39, inasistencias: 3, canceladasAnticipadas: 2, tasaAusentismo: 6.8 }
        ],
        porEspecialidad: [
            { especialidad: 'Medicina General', totalCitas: 115, asistencias: 98, inasistencias: 17, tasaAusentismo: 14.8, tendencia: 'baja' },
            { especialidad: 'Pediatría', totalCitas: 68, asistencias: 60, inasistencias: 8, tasaAusentismo: 11.8, tendencia: 'baja' },
            { especialidad: 'Traumatología', totalCitas: 54, asistencias: 49, inasistencias: 5, tasaAusentismo: 9.3, tendencia: 'estable' },
            { especialidad: 'Cardiología', totalCitas: 42, asistencias: 39, inasistencias: 3, tasaAusentismo: 7.1, tendencia: 'baja' },
            { especialidad: 'Dermatología', totalCitas: 33, asistencias: 32, inasistencias: 1, tasaAusentismo: 3.0, tendencia: 'baja' }
        ],
        distribucion: [
            { estado: 'Asistió', cantidad: 254, porcentaje: 81.4, color: '#10B981' },
            { estado: 'No Asistió', cantidad: 34, porcentaje: 10.9, color: '#EF4444' },
            { estado: 'Cancelada con Aviso', cantidad: 16, porcentaje: 5.1, color: '#0284C7' },
            { estado: 'Confirmada Pendiente', cantidad: 8, porcentaje: 2.6, color: '#F59E0B' }
        ],
        porHorario: [
            { franja: '08:00 - 10:00', tasaAusentismo: 15.6, citasTotales: 64 },
            { franja: '10:00 - 12:00', tasaAusentismo: 8.2, citasTotales: 73 },
            { franja: '12:00 - 14:00', tasaAusentismo: 9.1, citasTotales: 55 },
            { franja: '15:00 - 17:00', tasaAusentismo: 10.4, citasTotales: 67 },
            { franja: '17:00 - 19:00', tasaAusentismo: 13.2, citasTotales: 53 }
        ],
        omro: {
            conRecordatorioAsistencia: 94.8,
            sinRecordatorioAsistencia: 72.1,
            recordatoriosEnviados: 245,
            confirmacionesRecibidas: 218
        },
        alertasRiesgo: [
            {
                id: 'risk-1',
                paciente: 'Camila Rojas Soto',
                rut: '18.432.119-4',
                especialidad: 'Medicina General',
                medico: 'Dr. Gabriel Méndez',
                fecha: 'Mañana',
                hora: '08:30',
                probabilidadAusentismo: 84,
                nivelRiesgo: 'ALTO',
                factorPrincipal: '2 inasistencias previas sin aviso en el último trimestre',
                estadoRecordatorio: 'Pendiente'
            },
            {
                id: 'risk-2',
                paciente: 'Matías Valdés Pinto',
                rut: '16.904.512-K',
                especialidad: 'Traumatología',
                medico: 'Dra. Sofía Herrera',
                fecha: 'Mañana',
                hora: '18:00',
                probabilidadAusentismo: 72,
                nivelRiesgo: 'ALTO',
                factorPrincipal: 'Reserva agendada con >15 días de anticipación sin confirmar',
                estadoRecordatorio: 'Enviado'
            },
            {
                id: 'risk-3',
                paciente: 'Elena Paredes Muñoz',
                rut: '14.210.883-2',
                especialidad: 'Pediatría',
                medico: 'Dr. Andrés Silva',
                fecha: 'Pasado mañana',
                hora: '09:00',
                probabilidadAusentismo: 51,
                nivelRiesgo: 'MEDIO',
                factorPrincipal: 'Franja matinal temprana sin respuesta al primer aviso',
                estadoRecordatorio: 'Pendiente'
            }
        ]
    },
    'mes': {
        kpis: {
            totalCitas: 1280,
            tasaAsistencia: 87.4,
            tasaAusentismo: 12.6,
            deltaAusentismoVsPeriodoAnterior: -2.8,
            citasRescatadasOMRO: 48,
            horasMedicasPerdidas: 42,
            impactoEstimadoPerdida: 1050000
        },
        overbookMetrics: {
            slotRefilled: 34,
            overbookSlotsOpened: 42,
            overbookSlotsOccupied: 34,
            overbookCollisions: 1,
            displacedPatients: 1,
            falsePositiveRate: 5.1,
            shadowEvaluatedCount: 146,
            shadowFalsePositivesCount: 7
        },
        tendencia: [
            { periodo: 'Sem 1', asistidas: 268, inasistencias: 48, canceladasAnticipadas: 18, tasaAusentismo: 14.4 },
            { periodo: 'Sem 2', asistidas: 279, inasistencias: 42, canceladasAnticipadas: 21, tasaAusentismo: 12.3 },
            { periodo: 'Sem 3', asistidas: 288, inasistencias: 37, canceladasAnticipadas: 24, tasaAusentismo: 10.6 },
            { periodo: 'Sem 4', asistidas: 284, inasistencias: 34, canceladasAnticipadas: 22, tasaAusentismo: 10.0 }
        ],
        porEspecialidad: [
            { especialidad: 'Medicina General', totalCitas: 460, asistencias: 386, inasistencias: 74, tasaAusentismo: 16.1, tendencia: 'baja' },
            { especialidad: 'Pediatría', totalCitas: 280, asistencias: 243, inasistencias: 37, tasaAusentismo: 13.2, tendencia: 'baja' },
            { especialidad: 'Traumatología', totalCitas: 220, asistencias: 194, inasistencias: 26, tasaAusentismo: 11.8, tendencia: 'estable' },
            { especialidad: 'Cardiología', totalCitas: 180, asistencias: 166, inasistencias: 14, tasaAusentismo: 7.8, tendencia: 'baja' },
            { especialidad: 'Dermatología', totalCitas: 140, asistencias: 130, inasistencias: 10, tasaAusentismo: 7.1, tendencia: 'baja' }
        ],
        distribucion: [
            { estado: 'Asistió', cantidad: 1034, porcentaje: 80.8, color: '#10B981' },
            { estado: 'No Asistió', cantidad: 161, porcentaje: 12.6, color: '#EF4444' },
            { estado: 'Cancelada con Aviso', cantidad: 61, porcentaje: 4.8, color: '#0284C7' },
            { estado: 'Confirmada Pendiente', cantidad: 24, porcentaje: 1.8, color: '#F59E0B' }
        ],
        porHorario: [
            { franja: '08:00 - 10:00', tasaAusentismo: 17.4, citasTotales: 258 },
            { franja: '10:00 - 12:00', tasaAusentismo: 9.2, citasTotales: 304 },
            { franja: '12:00 - 14:00', tasaAusentismo: 10.5, citasTotales: 228 },
            { franja: '15:00 - 17:00', tasaAusentismo: 11.8, citasTotales: 262 },
            { franja: '17:00 - 19:00', tasaAusentismo: 15.1, citasTotales: 228 }
        ],
        omro: {
            conRecordatorioAsistencia: 94.2,
            sinRecordatorioAsistencia: 71.5,
            recordatoriosEnviados: 980,
            confirmacionesRecibidas: 862
        },
        alertasRiesgo: [
            {
                id: 'risk-1',
                paciente: 'Camila Rojas Soto',
                rut: '18.432.119-4',
                especialidad: 'Medicina General',
                medico: 'Dr. Gabriel Méndez',
                fecha: 'Mañana',
                hora: '08:30',
                probabilidadAusentismo: 84,
                nivelRiesgo: 'ALTO',
                factorPrincipal: '2 inasistencias previas sin aviso en el último trimestre',
                estadoRecordatorio: 'Pendiente'
            },
            {
                id: 'risk-2',
                paciente: 'Matías Valdés Pinto',
                rut: '16.904.512-K',
                especialidad: 'Traumatología',
                medico: 'Dra. Sofía Herrera',
                fecha: 'Mañana',
                hora: '18:00',
                probabilidadAusentismo: 72,
                nivelRiesgo: 'ALTO',
                factorPrincipal: 'Reserva agendada con >15 días de anticipación sin confirmar',
                estadoRecordatorio: 'Enviado'
            },
            {
                id: 'risk-3',
                paciente: 'Elena Paredes Muñoz',
                rut: '14.210.883-2',
                especialidad: 'Pediatría',
                medico: 'Dr. Andrés Silva',
                fecha: 'Pasado mañana',
                hora: '09:00',
                probabilidadAusentismo: 51,
                nivelRiesgo: 'MEDIO',
                factorPrincipal: 'Franja matinal temprana sin respuesta al primer aviso',
                estadoRecordatorio: 'Pendiente'
            },
            {
                id: 'risk-4',
                paciente: 'Ignacio Fuentes Lira',
                rut: '19.551.302-9',
                especialidad: 'Medicina General',
                medico: 'Dr. Gabriel Méndez',
                fecha: 'En 2 días',
                hora: '18:30',
                probabilidadAusentismo: 46,
                nivelRiesgo: 'MEDIO',
                factorPrincipal: 'Cancelación tardía registrada el mes pasado',
                estadoRecordatorio: 'Confirmado'
            }
        ]
    },
    'trimestre': {
        kpis: {
            totalCitas: 3840,
            tasaAsistencia: 85.9,
            tasaAusentismo: 14.1,
            deltaAusentismoVsPeriodoAnterior: -3.4,
            citasRescatadasOMRO: 136,
            horasMedicasPerdidas: 134,
            impactoEstimadoPerdida: 3350000
        },
        overbookMetrics: {
            slotRefilled: 98,
            overbookSlotsOpened: 124,
            overbookSlotsOccupied: 98,
            overbookCollisions: 3,
            displacedPatients: 2,
            falsePositiveRate: 4.8,
            shadowEvaluatedCount: 412,
            shadowFalsePositivesCount: 20
        },
        tendencia: [
            { periodo: 'Sept', asistidas: 1052, inasistencias: 204, canceladasAnticipadas: 54, tasaAusentismo: 15.6 },
            { periodo: 'Oct', asistidas: 1110, inasistencias: 178, canceladasAnticipadas: 68, tasaAusentismo: 13.1 },
            { periodo: 'Nov', asistidas: 1136, inasistencias: 161, canceladasAnticipadas: 77, tasaAusentismo: 11.7 }
        ],
        porEspecialidad: [
            { especialidad: 'Medicina General', totalCitas: 1380, asistencias: 1138, inasistencias: 242, tasaAusentismo: 17.5, tendencia: 'baja' },
            { especialidad: 'Pediatría', totalCitas: 840, asistencias: 718, inasistencias: 122, tasaAusentismo: 14.5, tendencia: 'baja' },
            { especialidad: 'Traumatología', totalCitas: 660, asistencias: 576, inasistencias: 84, tasaAusentismo: 12.7, tendencia: 'estable' },
            { especialidad: 'Cardiología', totalCitas: 540, asistencias: 491, inasistencias: 49, tasaAusentismo: 9.1, tendencia: 'baja' },
            { especialidad: 'Dermatología', totalCitas: 420, asistencias: 384, inasistencias: 36, tasaAusentismo: 8.6, tendencia: 'baja' }
        ],
        distribucion: [
            { estado: 'Asistió', cantidad: 3099, porcentaje: 80.7, color: '#10B981' },
            { estado: 'No Asistió', cantidad: 543, porcentaje: 14.1, color: '#EF4444' },
            { estado: 'Cancelada con Aviso', cantidad: 168, porcentaje: 4.4, color: '#0284C7' },
            { estado: 'Confirmada Pendiente', cantidad: 30, porcentaje: 0.8, color: '#F59E0B' }
        ],
        porHorario: [
            { franja: '08:00 - 10:00', tasaAusentismo: 18.9, citasTotales: 774 },
            { franja: '10:00 - 12:00', tasaAusentismo: 10.1, citasTotales: 912 },
            { franja: '12:00 - 14:00', tasaAusentismo: 11.4, citasTotales: 684 },
            { franja: '15:00 - 17:00', tasaAusentismo: 13.0, citasTotales: 786 },
            { franja: '17:00 - 19:00', tasaAusentismo: 16.5, citasTotales: 684 }
        ],
        omro: {
            conRecordatorioAsistencia: 93.6,
            sinRecordatorioAsistencia: 69.8,
            recordatoriosEnviados: 2890,
            confirmacionesRecibidas: 2514
        },
        alertasRiesgo: [
            {
                id: 'risk-1',
                paciente: 'Camila Rojas Soto',
                rut: '18.432.119-4',
                especialidad: 'Medicina General',
                medico: 'Dr. Gabriel Méndez',
                fecha: 'Mañana',
                hora: '08:30',
                probabilidadAusentismo: 84,
                nivelRiesgo: 'ALTO',
                factorPrincipal: '2 inasistencias previas sin aviso en el último trimestre',
                estadoRecordatorio: 'Pendiente'
            },
            {
                id: 'risk-2',
                paciente: 'Matías Valdés Pinto',
                rut: '16.904.512-K',
                especialidad: 'Traumatología',
                medico: 'Dra. Sofía Herrera',
                fecha: 'Mañana',
                hora: '18:00',
                probabilidadAusentismo: 72,
                nivelRiesgo: 'ALTO',
                factorPrincipal: 'Reserva agendada con >15 días de anticipación sin confirmar',
                estadoRecordatorio: 'Enviado'
            }
        ]
    }
};

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

function aNumero(valor: unknown, defecto: number = 0): number {
    const n = Number(valor);
    return Number.isFinite(n) ? n : defecto;
}

function aPorcentaje(valor: unknown): number {
    const n = aNumero(valor, 0);
    const pct = n > 0 && n <= 1 ? n * 100 : n;
    return Math.round(pct * 10) / 10;
}

function extraerListaObjetos(raw: unknown): Record<string, unknown>[] {
    if (Array.isArray(raw)) {
        return raw.filter(esObjeto);
    }
    if (esObjeto(raw) && Array.isArray(raw.$values)) {
        return raw.$values.filter(esObjeto);
    }
    return [];
}

function normalizarTendencia(valor: unknown): 'alza' | 'baja' | 'estable' {
    const texto = String(valor || '').toLowerCase().trim();
    if (texto === 'alza' || texto === 'baja' || texto === 'estable') {
        return texto;
    }
    return 'estable';
}

function normalizarEstadoDistribucion(valor: unknown): DistribucionEstadoDTO['estado'] {
    const texto = String(valor || '').trim();
    if (
        texto === 'Asistió' ||
        texto === 'No Asistió' ||
        texto === 'Cancelada con Aviso' ||
        texto === 'Confirmada Pendiente'
    ) {
        return texto;
    }
    const lower = texto.toLowerCase();
    if (lower.includes('no asist') || lower.includes('inasist')) return 'No Asistió';
    if (lower.includes('cancel')) return 'Cancelada con Aviso';
    if (lower.includes('pendiente') || lower.includes('confirm')) return 'Confirmada Pendiente';
    return 'Asistió';
}

function normalizarNivelRiesgo(valor: unknown): NivelRiesgo {
    const upper = String(valor || '').toUpperCase().trim();
    if (upper === 'ALTO' || upper === 'MEDIO' || upper === 'BAJO') {
        return upper;
    }
    return 'MEDIO';
}

function normalizarEstadoRecordatorio(valor: unknown): CitaRiesgoDTO['estadoRecordatorio'] {
    const texto = String(valor || '').trim();
    if (texto === 'Enviado' || texto === 'Pendiente' || texto === 'Confirmado') {
        return texto;
    }
    const lower = texto.toLowerCase();
    if (lower.includes('confirm')) return 'Confirmado';
    if (lower.includes('envi')) return 'Enviado';
    return 'Pendiente';
}

export function normalizarOverbookMetrics(raw: unknown): OverbookMetricsDTO {
    const obj = esObjeto(raw) ? raw : {};
    return {
        slotRefilled: Math.round(aNumero(leerProp(obj, 'slotRefilled', 'SlotRefilled'))),
        overbookSlotsOpened: Math.round(
            aNumero(leerProp(obj, 'overbookSlotsOpened', 'OverbookSlotsOpened'))
        ),
        overbookSlotsOccupied: Math.round(
            aNumero(leerProp(obj, 'overbookSlotsOccupied', 'OverbookSlotsOccupied'))
        ),
        overbookCollisions: Math.round(
            aNumero(leerProp(obj, 'overbookCollisions', 'OverbookCollisions'))
        ),
        displacedPatients: Math.round(
            aNumero(leerProp(obj, 'displacedPatients', 'DisplacedPatients'))
        ),
        falsePositiveRate: aPorcentaje(leerProp(obj, 'falsePositiveRate', 'FalsePositiveRate')),
        shadowEvaluatedCount: Math.round(
            aNumero(leerProp(obj, 'shadowEvaluatedCount', 'ShadowEvaluatedCount'))
        ),
        shadowFalsePositivesCount: Math.round(
            aNumero(leerProp(obj, 'shadowFalsePositivesCount', 'ShadowFalsePositivesCount'))
        )
    };
}

/**
 * Obtiene métricas dedicadas de sobrecupo y modo sombra desde GET /api/Dashboard/overbook-metrics.
 */
export async function obtenerMetricasSobrecupo(): Promise<OverbookMetricsDTO | null> {
    try {
        const respuesta: unknown = await apiClient('/api/Dashboard/overbook-metrics', {
            method: 'GET'
        });
        if (esObjeto(respuesta)) {
            return normalizarOverbookMetrics(respuesta);
        }
    } catch (err: unknown) {
        console.warn('No se pudo consultar GET /api/Dashboard/overbook-metrics:', err);
    }
    return null;
}

/**
 * Normaliza el payload DashboardAusentismoDto del backend C# (PascalCase o camelCase)
 * hacia la interfaz estricta del Frontend.
 */
export function normalizarDashboardAusentismo(raw: unknown): DashboardAusentismoDTO {
    if (!esObjeto(raw)) {
        throw new Error('Respuesta inválida del servidor para DashboardAusentismoDto');
    }

    const rawKpis = leerProp(raw, 'kpis', 'Kpis');
    if (!esObjeto(rawKpis)) {
        throw new Error('Falta el objeto Kpis en la respuesta de /api/dashboard/metrics');
    }

    const kpis: ResumenKPIsDTO = {
        totalCitas: Math.round(aNumero(leerProp(rawKpis, 'totalCitas', 'TotalCitas'))),
        tasaAsistencia: aPorcentaje(leerProp(rawKpis, 'tasaAsistencia', 'TasaAsistencia')),
        tasaAusentismo: aPorcentaje(leerProp(rawKpis, 'tasaAusentismo', 'TasaAusentismo')),
        deltaAusentismoVsPeriodoAnterior: aNumero(
            leerProp(
                rawKpis,
                'deltaAusentismoVsMesAnterior',
                'DeltaAusentismoVsMesAnterior',
                'deltaAusentismoVsPeriodoAnterior',
                'DeltaAusentismoVsPeriodoAnterior'
            )
        ),
        citasRescatadasOMRO: Math.round(aNumero(leerProp(rawKpis, 'citasRescatadasOMRO', 'CitasRescatadasOMRO'))),
        horasMedicasPerdidas: Math.round(aNumero(leerProp(rawKpis, 'horasMedicasPerdidas', 'HorasMedicasPerdidas'))),
        impactoEstimadoPerdida: aNumero(leerProp(rawKpis, 'impactoEstimadoPerdida', 'ImpactoEstimadoPerdida'))
    };

    const tendencia: TendenciaTemporalDTO[] = extraerListaObjetos(leerProp(raw, 'tendencia', 'Tendencia')).map(
        (item) => ({
            periodo: String(leerProp(item, 'periodo', 'Periodo') ?? ''),
            asistidas: Math.round(aNumero(leerProp(item, 'asistidas', 'Asistidas'))),
            inasistencias: Math.round(aNumero(leerProp(item, 'inasistencias', 'Inasistencias'))),
            canceladasAnticipadas: Math.round(
                aNumero(leerProp(item, 'canceladasAnticipadas', 'CanceladasAnticipadas'))
            ),
            tasaAusentismo: aPorcentaje(leerProp(item, 'tasaAusentismo', 'TasaAusentismo'))
        })
    );

    const porEspecialidad: AusentismoEspecialidadDTO[] = extraerListaObjetos(
        leerProp(raw, 'porEspecialidad', 'PorEspecialidad')
    ).map((item) => ({
        especialidad: String(leerProp(item, 'especialidad', 'Especialidad') ?? 'General'),
        totalCitas: Math.round(aNumero(leerProp(item, 'totalCitas', 'TotalCitas'))),
        asistencias: Math.round(aNumero(leerProp(item, 'asistencias', 'Asistencias'))),
        inasistencias: Math.round(aNumero(leerProp(item, 'inasistencias', 'Inasistencias'))),
        tasaAusentismo: aPorcentaje(leerProp(item, 'tasaAusentismo', 'TasaAusentismo')),
        tendencia: normalizarTendencia(leerProp(item, 'tendencia', 'Tendencia'))
    }));

    const distribucion: DistribucionEstadoDTO[] = extraerListaObjetos(
        leerProp(raw, 'distribucion', 'Distribucion')
    ).map((item) => ({
        estado: normalizarEstadoDistribucion(leerProp(item, 'estado', 'Estado')),
        cantidad: Math.round(aNumero(leerProp(item, 'cantidad', 'Cantidad'))),
        porcentaje: aPorcentaje(leerProp(item, 'porcentaje', 'Porcentaje')),
        color: String(leerProp(item, 'color', 'Color') ?? '#1E9CF1')
    }));

    const porHorario: AusentismoHorarioDTO[] = extraerListaObjetos(
        leerProp(raw, 'porHorario', 'PorHorario')
    ).map((item) => ({
        franja: String(leerProp(item, 'franja', 'Franja') ?? ''),
        tasaAusentismo: aPorcentaje(leerProp(item, 'tasaAusentismo', 'TasaAusentismo')),
        citasTotales: Math.round(aNumero(leerProp(item, 'citasTotales', 'CitasTotales')))
    }));

    const rawOmro = leerProp(raw, 'omro', 'Omro');
    const omroObj = esObjeto(rawOmro) ? rawOmro : {};
    const omro: EfectividadOMRODTO = {
        conRecordatorioAsistencia: aPorcentaje(
            leerProp(omroObj, 'conRecordatorioAsistencia', 'ConRecordatorioAsistencia')
        ),
        sinRecordatorioAsistencia: aPorcentaje(
            leerProp(omroObj, 'sinRecordatorioAsistencia', 'SinRecordatorioAsistencia')
        ),
        recordatoriosEnviados: Math.round(
            aNumero(
                leerProp(
                    omroObj,
                    'recordatoriosEnviadosMes',
                    'RecordatoriosEnviadosMes',
                    'recordatoriosEnviados',
                    'RecordatoriosEnviados'
                )
            )
        ),
        confirmacionesRecibidas: Math.round(
            aNumero(leerProp(omroObj, 'confirmacionesRecibidas', 'ConfirmacionesRecibidas'))
        )
    };

    const alertasRiesgo: CitaRiesgoDTO[] = extraerListaObjetos(
        leerProp(raw, 'alertasRiesgo', 'AlertasRiesgo')
    ).map((item) => ({
        id: String(leerProp(item, 'id', 'Id') ?? crypto.randomUUID()),
        paciente: String(leerProp(item, 'paciente', 'Paciente') ?? 'Paciente'),
        rut: String(leerProp(item, 'rut', 'Rut') ?? ''),
        especialidad: String(leerProp(item, 'especialidad', 'Especialidad') ?? ''),
        medico: String(leerProp(item, 'medico', 'Medico') ?? ''),
        fecha: String(leerProp(item, 'fecha', 'Fecha') ?? ''),
        hora: String(leerProp(item, 'hora', 'Hora') ?? ''),
        probabilidadAusentismo: aPorcentaje(
            leerProp(item, 'probabilidadAusentismo', 'ProbabilidadAusentismo')
        ),
        nivelRiesgo: normalizarNivelRiesgo(leerProp(item, 'nivelRiesgo', 'NivelRiesgo')),
        factorPrincipal: String(leerProp(item, 'factorPrincipal', 'FactorPrincipal') ?? ''),
        estadoRecordatorio: normalizarEstadoRecordatorio(
            leerProp(item, 'estadoRecordatorio', 'EstadoRecordatorio')
        )
    }));

    const rawOverbook = leerProp(raw, 'overbookMetrics', 'OverbookMetrics');
    const overbookMetrics = esObjeto(rawOverbook)
        ? normalizarOverbookMetrics(rawOverbook)
        : undefined;

    return {
        kpis,
        tendencia,
        porEspecialidad,
        distribucion,
        porHorario,
        omro,
        alertasRiesgo,
        ...(overbookMetrics ? { overbookMetrics } : {})
    };
}

/**
 * Obtiene las métricas del dashboard de ausentismo desde GET /api/Dashboard/metrics.
 * Si no incluye overbookMetrics, consulta GET /api/Dashboard/overbook-metrics como fallback.
 * Si hay un error de conexión, timeout o listado inválido, recurre automáticamente
 * a la mockdata tipada de respaldo (MOCK_DASHBOARD_POR_PERIODO).
 */
export async function obtenerMetricasAusentismo(
    periodo: PeriodoDashboard = 'mes'
): Promise<DashboardAusentismoDTO> {
    try {
        const respuesta: unknown = await apiClient('/api/Dashboard/metrics', {
            method: 'GET'
        });
        console.log('[Dashboard] Datos recibidos de GET /api/Dashboard/metrics:', respuesta);
        const normalizado = normalizarDashboardAusentismo(respuesta);

        if (!normalizado.overbookMetrics) {
            const overbookFallback = await obtenerMetricasSobrecupo();
            if (overbookFallback) {
                normalizado.overbookMetrics = overbookFallback;
            }
        }

        return {
            ...normalizado,
            esRespaldoMock: false
        };
    } catch (error: unknown) {
        console.warn(
            'Error al consultar GET /api/Dashboard/metrics; usando mockdata de respaldo:',
            error
        );
        const datosMock = MOCK_DASHBOARD_POR_PERIODO[periodo];
        return {
            ...structuredClone(datosMock),
            esRespaldoMock: true
        };
    }
}
