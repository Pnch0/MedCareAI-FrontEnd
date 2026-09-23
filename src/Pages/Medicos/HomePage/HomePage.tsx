import "./HomePage.css"

function HomePageMedico(){

    return(

        <>
        <div className="ContenedorPrincipal-HomeMedico">
            <div className="ContenedorNombre-HomeMedico">
                <h1>Bienvenido Wilson Flores</h1>
            </div>
            <div className="Contenedor-DashboardMedico">
                <div className="ContenedorDarboard-Izquierda">
                    <div className="Contenedor-AgendaMedico">
                        <div className="Contenedor-EncabezadoAgenda">
                            <h2>Agenda</h2>
                        </div>
                        <div className="Contenedor-ListadoAgenda">

                        </div>
                    </div>
                </div>
                <div className="ContenedorDarboard-Derecha">
                    <div className="Contenedor-ResumenClinico">
                        <div className="Titulo-ResumenClinico">
                            <h3>Resumen Clinico</h3>
                        </div>
                        <div className="ContenedorListado-ResumenClinico">
                            <h3>Juan Perez</h3>
                            <p>Edad: 50 años</p>
                            <div className="ContenedorDiagnostico-ResumenClinico">
                                
                            </div>
                        </div>
                        
                    </div>
                    <div className="Contenedor-ControlCita">
                        <div className="Titulo-ControlCita">
                            <h3>Control Gestion de Cita</h3>
                        </div>
                        <div className="ContenedorListado-ControlCita">
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>

    )

}

export default HomePageMedico;