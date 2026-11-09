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

export async function obtenerMedicosPorEspecialidad(
    especialidadNombreOId: string,
    especialidadId?: string
): Promise<Medico[]> {
    if (!especialidadNombreOId) return [];

    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sinTildes = normalize(especialidadNombreOId);
    const espId = especialidadId || sinTildes.toLowerCase().replace(/\s+/g, '-');

    // Variantes de búsqueda (con tilde y sin tilde) para asegurar coincidencia con la base de datos
    const variantes = Array.from(new Set([
        especialidadNombreOId.trim(),
        sinTildes.trim()
    ])).filter(Boolean);

    const doctoresMap = new Map<string, Medico>();

    await Promise.all(
        variantes.map(async (variante) => {
            try {
                const data = await apiClient(`/api/Staff/lookup?specialty=${encodeURIComponent(variante)}`, {
                    method: 'GET'
                });

                if (Array.isArray(data)) {
                    for (const item of data) {
                        const id = String(item.id || item.staffId || '').trim();
                        if (!id || doctoresMap.has(id)) continue;

                        const rawName = String(item.name || '').trim();
                        const partes = rawName ? rawName.split(/\s+/) : [];
                        const nombre = partes[0] || 'Médico';
                        const apellido = partes.slice(1).join(' ') || '';

                        doctoresMap.set(id, {
                            id,
                            nombre,
                            apellido,
                            especialidad: especialidadNombreOId,
                            especialidadId: espId,
                            cargo: 'Médico'
                        });
                    }
                }
            } catch {
                // Si la especialidad no tiene médicos en backend o arroja error, se ignora limpiamente
            }
        })
    );

    const medicosLookup = Array.from(doctoresMap.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );

    // Si lookup encontró médicos, los retornamos
    if (medicosLookup.length > 0) {
        return medicosLookup;
    }

    // Fallback: si lookup no retornó registros (ej. por diferencias en el string), buscar en el catálogo general
    try {
        const catalogo = await obtenerCatalogoMedicos();
        return catalogo.medicos.filter(
            (m) =>
                m.especialidadId === espId ||
                normalize(m.especialidad).toLowerCase() === sinTildes.toLowerCase()
        );
    } catch {
        return [];
    }
}
