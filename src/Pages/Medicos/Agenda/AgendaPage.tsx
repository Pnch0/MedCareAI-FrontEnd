import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import esLocale from '@fullcalendar/react/locales/es'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'
import "./AgendaPage.css"

function AgendaPageMedico(){

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
                             const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
                             return days[(arg.date.getUTCDay() + 6) % 7];
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
                    <div className="Citas-AgendaMedico-1">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>L</h1>
                        </div>
                        <div className="Bloque-CitaMedica">
                            <p>12:00 - 13:00</p>
                            <h4>Juan Perez</h4>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>M</h1>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>M</h1>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>J</h1>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>V</h1>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>S</h1>
                        </div>
                    </div>
                    <div className="Citas-AgendaMedico-7">
                        <div className="EncabezadoCitas-AgendaMedico">
                            <h1>D</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )

}

export default AgendaPageMedico;