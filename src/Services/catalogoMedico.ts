export type Especialidad = {
    id: string;
    nombre: string;
};

export type Medico = {
    id: string;
    nombre: string;
    apellido: string;
    especialidadId: string;
    cargo: string;
};

export const ESPECIALIDADES: Especialidad[] = [
    { id: 'cardiologia', nombre: 'Cardiología' },
    { id: 'pediatria', nombre: 'Pediatría' },
    { id: 'dermatologia', nombre: 'Dermatología' },
    { id: 'traumatologia', nombre: 'Traumatología' },
    { id: 'neurologia', nombre: 'Neurología' }
];

export const MEDICOS: Medico[] = [
    { id: 'med-1', nombre: 'Camila', apellido: 'Fernández Reyes', especialidadId: 'cardiologia', cargo: 'Médico Cardióloga' },
    { id: 'med-2', nombre: 'Sebastián', apellido: 'Maldonado Cruz', especialidadId: 'pediatria', cargo: 'Médico Pediatra' },
    { id: 'med-3', nombre: 'Isabel', apellido: 'Contreras Rivas', especialidadId: 'dermatologia', cargo: 'Médico Dermatóloga' },
    { id: 'med-4', nombre: 'Rodrigo', apellido: 'Salas Pinto', especialidadId: 'cardiologia', cargo: 'Médico Cardiólogo' },
    { id: 'med-5', nombre: 'Matías', apellido: 'Villalobos Tapia', especialidadId: 'traumatologia', cargo: 'Médico Traumatólogo' },
    { id: 'med-6', nombre: 'Javiera', apellido: 'Núñez Paredes', especialidadId: 'neurologia', cargo: 'Médico Neuróloga' },
    { id: 'med-7', nombre: 'Andrés', apellido: 'Cifuentes Mora', especialidadId: 'neurologia', cargo: 'Médico Neurólogo' }
];

const ESPERA_SIMULADA_MS = 300;

const simularEspera = <T,>(datos: T): Promise<T> =>
    new Promise((resolve) => setTimeout(() => resolve(datos), ESPERA_SIMULADA_MS));

export async function obtenerEspecialidades(): Promise<Especialidad[]> {
    return simularEspera(ESPECIALIDADES);
}

export async function obtenerMedicosPorEspecialidad(especialidadId: string): Promise<Medico[]> {
    return simularEspera(MEDICOS.filter((medico) => medico.especialidadId === especialidadId));
}
