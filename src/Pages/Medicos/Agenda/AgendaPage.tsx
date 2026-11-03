import { useEffect, useMemo, useState } from 'react'
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
import {
    obtenerAgendaSemanalMedico,
    obtenerIndiceDia,
    MEDICO_DEFAULT_ID,
    type Cita,
    type DiaSemana
} from '../../../Services/agenda.ts';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const
const NOMBRES_DIA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const

function obtenerMinutosInicio(hora: string): number {
    const [inicio] = hora.split('-').map((parte) => parte.trim())
    const [horas, minutos] = inicio.split(':').map(Number)
    return horas * 60 + minutos
}

function AgendaPageMedico(){

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
    const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>(obtenerIndiceDia(new Date()));
    const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date());
    const [citas, setCitas] = useState<Cita[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);

    useEffect(() => {
        let cancelado = false;
        const cargarCitas = async () => {
            setCargando(true);
            try {
                const staffId = localStorage.getItem('staffId') || localStorage.getItem('medicoId') || MEDICO_DEFAULT_ID;
                const citasCargadas = await obtenerAgendaSemanalMedico(staffId, fechaSeleccionada);
                if (!cancelado) {
                    setCitas(citasCargadas);
                }
            } catch (error) {
                console.error('Error al cargar agenda del médico:', error);
            } finally {
                if (!cancelado) {
                    setCargando(false);
                }
            }
        };

        cargarCitas();
        return () => {
            cancelado = true;
        };
    }, [fechaSeleccionada]);

    const citasOrdenadas = useMemo(
        () => citas
            .filter((cita) => cita.dia === diaSeleccionado)
            .sort((a, b) => obtenerMinutosInicio(a.hora) - obtenerMinutosInicio(b.hora)),
        [citas, diaSeleccionado]
    );

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
                         dateClick={(arg) => {
                             setDiaSeleccionado(obtenerIndiceDia(arg.date));
                             setFechaSeleccionada(arg.date);
                         }}
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
                        {cargando ? (
                            <p className="Listado-AgendaMedico-Vacio">
                                Cargando agenda...
                            </p>
                        ) : citasOrdenadas.length === 0 ? (
                            <p className="Listado-AgendaMedico-Vacio">
                                No hay citas para el {NOMBRES_DIA[diaSeleccionado].toLowerCase()}
                            </p>
                        ) : (
                            citasOrdenadas.map((cita) => {
                                const [horaInicio, horaFin] = cita.hora.split('-').map((parte) => parte.trim());

                                return (
                                    <div
                                        key={cita.id}
                                        className="FilaCita-AgendaMedico"
                                        onClick={() => abrirModalCita(cita)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="BloqueHora-AgendaMedico">
                                            <p className="BloqueHora-Inicio">{horaInicio}</p>
                                            <span className="BloqueHora-Separador">a</span>
                                            <p className="BloqueHora-Fin">{horaFin}</p>
                                        </div>
                                        <div className="BloqueDatos-AgendaMedico">
                                            <h4>{cita.paciente}</h4>
                                            <p className="BloqueDatos-Box">Box {cita.box}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            <div className="ContenedorDerecha-AgendaMedico">
                <div className="ContenedorCitas-AgendaMedico">
                    {DIAS_SEMANA.map((dia, indice) => {
                        const citasDelDia = citas
                            .filter((cita) => cita.dia === indice)
                            .sort((a, b) => obtenerMinutosInicio(a.hora) - obtenerMinutosInicio(b.hora));
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
