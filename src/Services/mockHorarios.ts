import { MEDICOS, ESPECIALIDADES } from './catalogoMedico.ts';

export interface ProfesionalHorario {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
    cargo: string;
    rut?: string;
    telefono?: string;
    email?: string;
}

export interface BloqueHorario {
    id: string;
    horaInicio: string;
    horaFin: string;
    box: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
    diasSemana: string[]; // Días en los que funciona: e.g. ['Lunes', 'Martes', 'Miércoles']
    rangoFechas: {
        fechaInicio: string; // ej: '01/10/2026'
        fechaFin: string;    // ej: '31/12/2026'
    };
    profesional: ProfesionalHorario;
}

// Resuelve el nombre de la especialidad usando el catálogo oficial de especialidades
const obtenerNombreEspecialidad = (especialidadId: string): string => {
    const especialidad = ESPECIALIDADES.find((e) => e.id === especialidadId);
    return especialidad ? especialidad.nombre : 'Medicina General';
};

// Obtenemos los datos directamente de MEDICOS en catalogoMedico.ts
const medicoCamila = MEDICOS.find((m) => m.id === 'med-1') || MEDICOS[0];

export const MOCK_BLOQUE_DEFAULT: BloqueHorario = {
    id: 'bloque-09-13',
    horaInicio: '09:00',
    horaFin: '13:00',
    box: {
        id: 1,
        nombre: 'Box 1',
        ubicacion: 'Piso 2 - Sector Consultas A'
    },
    // Asignado para Lunes, Martes y Miércoles
    diasSemana: ['Lunes', 'Martes', 'Miércoles'],
    rangoFechas: {
        fechaInicio: '01/10/2026',
        fechaFin: '31/12/2026'
    },
    profesional: {
        id: medicoCamila.id,
        nombre: medicoCamila.nombre,
        apellido: medicoCamila.apellido,
        especialidad: obtenerNombreEspecialidad(medicoCamila.especialidadId),
        cargo: medicoCamila.cargo,
        rut: '18.765.432-7',
        telefono: '+56 9 8345 6789',
        email: 'camila.fernandez@medcare.cl'
    }
};

export const MOCK_HORARIOS: BloqueHorario[] = [
    MOCK_BLOQUE_DEFAULT
];
