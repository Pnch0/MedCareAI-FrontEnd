import { useMemo, useState } from "react";
import "./GestionCitas.css";

type EstadoCita = 'pendiente' | 'en-curso'

type CitaGestion = {
    id: string
    paciente: string
    edad: number
    horaInicio: string
    horaFin: string
    estado: EstadoCita
}

const MOCK_CITAS: CitaGestion[] = [
    {
        id: 'gestion-1',
        paciente: 'Luis Torres',
        edad: 29,
        horaInicio: '12:00',
        horaFin: '13:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-2',
        paciente: 'Juan Pérez',
        edad: 22,
        horaInicio: '09:00',
        horaFin: '10:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-3',
        paciente: 'Diego Fernández',
        edad: 45,
        horaInicio: '15:00',
        horaFin: '16:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-4',
        paciente: 'Carlos Ruiz',
        edad: 22,
        horaInicio: '10:00',
        horaFin: '11:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-5',
        paciente: 'Valentina Ortiz',
        edad: 27,
        horaInicio: '16:00',
        horaFin: '17:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-6',
        paciente: 'Ana Soto',
        edad: 30,
        horaInicio: '11:00',
        horaFin: '12:00',
        estado: 'pendiente'
    },
    {
        id: 'gestion-7',
        paciente: 'Elena Castro',
        edad: 18,
        horaInicio: '14:00',
        horaFin: '15:00',
        estado: 'pendiente'
    },

]

function GestionCitasMedico(){

    const [citas, setCitas] = useState<CitaGestion[]>(MOCK_CITAS);

    const citasOrdenadas = useMemo(
        () => [...citas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
        [citas]
    );

    const iniciarCita = (id: string) => {
        setCitas(prev => prev.map(cita => cita.id === id ? { ...cita, estado: 'en-curso' } : cita))
    }

    const finalizarCita = (id: string) => {
        setCitas(prev => prev.filter(cita => cita.id !== id))
    }

    return(
        <>
        <div className="ContenedorPrincipal-GestionCitas">
            <div className="ContenedorTitulo-GestionCitas">
                <h1>Gestión de Citas</h1>
            </div>
            <div className="ContenedorListado-GestionCitas">
                <div className="Tarjetas-GestionCitas">
                    {citasOrdenadas.length === 0 ? (
                        <p className="ListadoVacio-GestionCitas">No hay citas pendientes por gestionar</p>
                    ) : (
                        citasOrdenadas.map((cita) => (
                            <div key={cita.id} className="Tarjeta-GestionCitas">
                                <h3>{cita.paciente}</h3>
                                <p className="Edad-Cita">Edad: {cita.edad}</p>
                                <p className="Hora-Cita">Hora: {cita.horaInicio} - {cita.horaFin}</p>
                                {cita.estado === 'pendiente' ? (
                                    <button
                                        type="button"
                                        className="Btn-Accion-Cita Iniciar"
                                        onClick={() => iniciarCita(cita.id)}
                                    >
                                        Iniciar cita
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="Btn-Accion-Cita Finalizar"
                                        onClick={() => finalizarCita(cita.id)}
                                    >
                                        Finalizar cita
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
        
        </>
    )

}


export default GestionCitasMedico;
