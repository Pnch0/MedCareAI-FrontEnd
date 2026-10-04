import { useState } from "react";
import "./GestionHorarios.css";
import { ModalDetalleHorario } from "../../../Components/ModalDetalleHorario/ModalDetalleHorario.tsx";
import { ModalAsignarHorario } from "../../../Components/ModalAsignarHorario/ModalAsignarHorario.tsx";
import { MOCK_BLOQUE_DEFAULT, type BloqueHorario } from "../../../Services/mockHorarios.ts";

const DIAS_COLUMNAS = [
    { id: 'Lunes', letra: 'L', className: 'Listado-GestionHorarios-1' },
    { id: 'Martes', letra: 'M', className: 'Listado-GestionHorarios' },
    { id: 'Miércoles', letra: 'M', className: 'Listado-GestionHorarios' },
    { id: 'Jueves', letra: 'J', className: 'Listado-GestionHorarios' },
    { id: 'Viernes', letra: 'V', className: 'Listado-GestionHorarios' },
    { id: 'Sábado', letra: 'S', className: 'Listado-GestionHorarios' },
    { id: 'Domingo', letra: 'D', className: 'Listado-GestionHorarios-7' },
];

function GestionHorariosAdministrador(){
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
    const [modalAsignarAbierto, setModalAsignarAbierto] = useState<boolean>(false);
    const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueHorario | null>(null);
    const [bloques] = useState<BloqueHorario[]>([MOCK_BLOQUE_DEFAULT]);

    const abrirDetalleBloque = (bloque: BloqueHorario) => {
        setBloqueSeleccionado(bloque);
        setModalDetalleAbierto(true);
    };

    const cerrarDetalleBloque = () => {
        setModalDetalleAbierto(false);
        setBloqueSeleccionado(null);
    };

    const abrirModalAsignar = () => {
        setModalAsignarAbierto(true);
    };

    const cerrarModalAsignar = () => {
        setModalAsignarAbierto(false);
    };

    return(
        <>
        <div className="ContenedorPrincipal-GestionHorarios">
            <div className="ContenedorSuperior-GestionHorarios">
                <div className="ContenedorTitulo-GestionHorarios">
                    <h1>Gestión Horarios</h1>
                </div>
                <div className="ContenedorBoton-GestionHorarios">
                    <button onClick={abrirModalAsignar}>Asignar Horario</button>
                </div>
            </div>
            <div className="ContenedorInferior-GestionHorarios">
                <div className="ContenedorListado-GestionHorarios">
                    {DIAS_COLUMNAS.map((columna) => {
                        const bloquesDelDia = bloques.filter((bloque) =>
                            bloque.diasSemana.some(
                                (d) => d.localeCompare(columna.id, undefined, { sensitivity: 'accent' }) === 0
                            )
                        );

                        return (
                            <div className={columna.className} key={columna.id}>
                                <div className="EncabezadoListado-GestionHorarios">
                                    <h2>{columna.letra}</h2>
                                </div>
                                {bloquesDelDia.map((bloque) => (
                                    <div
                                        key={`${bloque.id}-${columna.id}`}
                                        className="BloqueHorario-GestionHorarios"
                                        onClick={() => abrirDetalleBloque(bloque)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                abrirDetalleBloque(bloque);
                                            }
                                        }}
                                    >
                                        <p>{bloque.horaInicio} - {bloque.horaFin}</p>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <ModalDetalleHorario
            isOpen={modalDetalleAbierto}
            onClose={cerrarDetalleBloque}
            bloque={bloqueSeleccionado}
        />
        
        <ModalAsignarHorario 
            isOpen={modalAsignarAbierto} 
            onClose={cerrarModalAsignar} 
        />
        </>
    )
}

export default GestionHorariosAdministrador;