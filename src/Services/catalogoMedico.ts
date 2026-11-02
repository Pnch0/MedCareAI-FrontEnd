import { apiClient } from './apiClient.ts';

export interface Especialidad {
    id: string;
    nombre: string;
}

export interface Medico {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
    especialidadId: string;
    cargo: string;
}

export interface CatalogoMedicosResultado {
    especialidades: Especialidad[];
    medicos: Medico[];
}

export async function obtenerCatalogoMedicos(): Promise<CatalogoMedicosResultado> {
    try {
        const staffData = await apiClient('/api/Staff?role=2', { method: 'GET' });

        if (!Array.isArray(staffData)) {
            return { especialidades: [], medicos: [] };
        }

        const docsValidos = staffData.filter((item: any) =>
            item.role === 2 ||
            String(item.role).toLowerCase() === 'medico' ||
            (item.role === undefined && String(item.roleName || '').toLowerCase().includes('medico'))
        );

        const especialidadesMap = new Map<string, Especialidad>();

        const medicosMapeados: Medico[] = docsValidos.map((item: any) => {
            const rawSpecialty = (item.specialty || '').trim() || 'Medicina General';
            

            const espId = rawSpecialty
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');

            if (!especialidadesMap.has(espId)) {
                especialidadesMap.set(espId, {
                    id: espId,
                    nombre: rawSpecialty
                });
            }

            return {
                id: String(item.id || item.staffId),
                nombre: String(item.firstName || '').trim(),
                apellido: String(item.lastName || '').trim(),
                especialidad: rawSpecialty,
                especialidadId: espId,
                cargo: String(item.roleName || 'Médico')
            };
        });

        const especialidades = Array.from(especialidadesMap.values()).sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );

        return {
            especialidades,
            medicos: medicosMapeados
        };
    } catch (error) {
        console.error('Error al obtener catálogo médico desde el backend:', error);
        return { especialidades: [], medicos: [] };
    }
}

export async function obtenerEspecialidades(): Promise<Especialidad[]> {
    const catalogo = await obtenerCatalogoMedicos();
    return catalogo.especialidades;
}

export async function obtenerMedicosPorEspecialidad(especialidadId: string): Promise<Medico[]> {
    const catalogo = await obtenerCatalogoMedicos();
    return catalogo.medicos.filter((m) => m.especialidadId === especialidadId);
}
