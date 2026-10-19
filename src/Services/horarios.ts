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
        id: number | string;
        nombre: string;
        ubicacion: string;
    };
    diasSemana: string[];
    rangoFechas: {
        fechaInicio: string;
        fechaFin: string;
    };
    profesional: ProfesionalHorario;
}
