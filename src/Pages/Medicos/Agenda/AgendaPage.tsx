import { useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import esLocale from '@fullcalendar/react/locales/es'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'
import { FaRegUserCircle } from "react-icons/fa";
import "./AgendaPage.css"

type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6
type Box = 1 | 2 | 3 | 4 | 5 | 6 | 7

type Cita = {
    id: string
    dia: DiaSemana
    hora: string
    paciente: string
    motivo: string
    box: Box
}

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const

const mockCitas: Cita[] = [
    {
        id: 'cita-1',
        dia: 0,
        hora: '12:00 - 13:00',
        paciente: 'Juan Perez',
        motivo: 'Motivo de consulta por dolor de garganta persistente, congestión nasal intensa y fatiga general desde hace cuatro días, con molestias agudas al tragar especialmente por las mañanas, dificultad para respirar por la nariz durante la noche, sensación de decaimiento por falta de descanso adecuado y episodios leves de escalofríos sin fiebre alta confirmada, buscando una evaluación médica para descartar infección y recibir el tratamiento farmacológico adecuado.',
        box: 5
    },
    {
        id: 'cita-2',
        dia: 0,
        hora: '14:00 - 15:00',
        paciente: 'Maria Lopez',
        motivo: 'Motivo de consulta por dolor de garganta persistente, congestión nasal intensa y fatiga general desde hace cuatro días, con molestias agudas al tragar especialmente por las mañanas, dificultad para respirar por la nariz durante la noche, sensación de decaimiento por falta de descanso adecuado y episodios leves de escalofríos sin fiebre alta confirmada, buscando una evaluación médica para descartar infección y recibir el tratamiento farmacológico adecuado.',
        box: 2
    },
    {
        id: 'cita-3',
        dia: 1,
        hora: '09:00 - 10:00',
        paciente: 'Ana Gomez',
        motivo: 'Motivo de consulta por dolor de garganta persistente, congestión nasal intensa y fatiga general desde hace cuatro días, con molestias agudas al tragar especialmente por las mañanas, dificultad para respirar por la nariz durante la noche, sensación de decaimiento por falta de descanso adecuado y episodios leves de escalofríos sin fiebre alta confirmada, buscando una evaluación médica para descartar infección y recibir el tratamiento farmacológico adecuado.',
        box: 3
    },
    {
        id: 'cita-4',
        dia: 3,
        hora: '11:00 - 12:00',
        paciente: 'Carlos Ruiz',
        motivo: 'Motivo de consulta por dolor de garganta persistente, congestión nasal intensa y fatiga general desde hace cuatro días, con molestias agudas al tragar especialmente por las mañanas, dificultad para respirar por la nariz durante la noche, sensación de decaimiento por falta de descanso adecuado y episodios leves de escalofríos sin fiebre alta confirmada, buscando una evaluación médica para descartar infección y recibir el tratamiento farmacológico adecuado.',
        box: 5
    },
    {
        id: 'cita-5',
        dia: 4,
        hora: '16:00 - 17:00',
        paciente: 'Sofia Diaz',
        motivo: 'Motivo de consulta por dolor de garganta persistente, congestión nasal intensa y fatiga general desde hace cuatro días, con molestias agudas al tragar especialmente por las mañanas, dificultad para respirar por la nariz durante la noche, sensación de decaimiento por falta de descanso adecuado y episodios leves de escalofríos sin fiebre alta confirmada, buscando una evaluación médica para descartar infección y recibir el tratamiento farmacológico adecuado.',
        box: 6
    }
]

function AgendaPageMedico(){

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

    const abrirModalCita = (datosCita: Cita) => {
        setCitaSeleccionada(datosCita);
        setIsModalOpen(true);
    };

    const cerrarModal = () => {
        setIsModalOpen(false);
        setCitaSeleccionada(null);
    };

    return(
        <>
        <div className="ContenedorPrincipal-AgendaMedico">
            <div className="ContenedorIzquierda-AgendaMedico">
                <div className="ContenedorCalendario-AgendaMedico">
                    <FullCalendar
                        plugins={[dayGridPlugin, classicThemePlugin]}
                        initialView="dayGridMonth"
                        locale={esLocale}
                        headerToolbar={{
                            left: 'prev',
                            center: 'title',
                            right: 'next'
                         }}
                         fixedWeekCount={false}
                         firstDay={1}
                         borderless
                         toolbarTitleClass="agenda-calendar-title"
                         headerToolbarClass="agenda-calendar-toolbar"
                         buttonClass="agenda-calendar-button"
                         dayHeaderInnerClass="agenda-calendar-day-header"
                         dayCellClass={({ isOther, isToday }) =>
                             `agenda-calendar-day ${isOther ? 'agenda-calendar-day-other' : ''} ${isToday ? 'agenda-calendar-day-today' : ''}`
                         }
                         dayCellTopClass="agenda-calendar-day-top"
                         dayCellTopInnerClass="agenda-calendar-day-number"
                         dayCellInnerClass="agenda-calendar-day-content"

                         dayHeaderContent={(arg) => {
                             const indice = (arg.date.getUTCDay() + 6) % 7;
                             return DIAS_SEMANA[indice];
                         }}
                    />
                </div>
                <div className="ContenedorListado-AgendaMedico">
                    <div className="Listado-AgendaMedico">
                        
                    </div>
                </div>
            </div>
            <div className="ContenedorDerecha-AgendaMedico">
                <div className="ContenedorCitas-AgendaMedico">
                    {DIAS_SEMANA.map((dia, indice) => {
                        const citasDelDia = mockCitas.filter((cita) => cita.dia === indice);
                        const claseColumna = indice === 0
                            ? 'Citas-AgendaMedico-1'
                            : indice === 6
                                ? 'Citas-AgendaMedico-7'
                                : 'Citas-AgendaMedico';

                        return (
                            <div key={`${dia}-${indice}`} className={claseColumna}>
                                <div className="EncabezadoCitas-AgendaMedico">
                                    <h1>{dia}</h1>
                                </div>
                                {citasDelDia.map((cita) => (
                                    <div
                                        key={cita.id}
                                        className="Bloque-CitaMedica"
                                        onClick={() => abrirModalCita(cita)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <p>{cita.hora}</p>
                                        <h4>{cita.paciente}</h4>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {isModalOpen && (
            <div className="ModalOverlay-Cita">
                <div className="ModalContenido-Cita">
                    <div className="Contenedor-ImagenUsuario">
                        <FaRegUserCircle className='Icono-Usuario'/>
                    </div>
                    {citaSeleccionada && (
                        <>
                            <p className='Nombre-Paciente'>{citaSeleccionada.paciente}</p>
                            <div className="Modal-FilaDoble">
                                <p>Box: {citaSeleccionada.box}</p>
                                <p>Horario: {citaSeleccionada.hora}</p>
                            </div>
                            <div className="Contenedor-MotivoConsulta">
                                <p>{citaSeleccionada.motivo}</p>
                            </div>
                        </>
                    )}
                    <button
                        type="button"
                        className="ModalCerrar-Cita"
                        onClick={cerrarModal}
                        aria-label="Cerrar"
                    >
                        <FaTimes aria-hidden="true" />
                    </button>
                </div>
            </div>
        )}
        </>
    )

}

export default AgendaPageMedico;
