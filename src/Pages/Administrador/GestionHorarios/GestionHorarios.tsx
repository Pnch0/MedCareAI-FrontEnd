import { useState, useEffect } from "react";
import "./GestionHorarios.css";
import { toast } from "sonner";
import { FaClock, FaUserMd } from "react-icons/fa";
import { ModalDetalleHorario } from "../../../Components/ModalDetalleHorario/ModalDetalleHorario.tsx";
import { ModalAsignarHorario } from "../../../Components/ModalAsignarHorario/ModalAsignarHorario.tsx";
import { type BloqueHorario, obtenerBloquesHorarios } from "../../../Services/horarios.ts";

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
    const [bloques, setBloques] = useState<BloqueHorario[]>([]);

    const cargarBloquesHorarios = async () => {
        try {
            const lista = await obtenerBloquesHorarios();
            setBloques(lista);
        } catch (error: any) {
            console.error('Error al cargar bloques horarios:', error);
            toast.error(`Error al cargar bloques horarios: ${error.message}`);
        }
    };

    useEffect(() => {
        cargarBloquesHorarios();
    }, []);

    const manejarHorarioCreado = (nuevoBloque?: BloqueHorario) => {
        if (nuevoBloque) {
            setBloques(prev => [...prev, nuevoBloque]);
        }
        cargarBloquesHorarios();
    };

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

    const formatearNombreMedico = (nombre?: string, apellido?: string): string => {
        const nom = (nombre || '').trim();
        const ape = (apellido || '').trim();
        const completo = `${nom} ${ape}`.trim();
        if (!completo || completo.toLowerCase() === 'médico' || completo.toLowerCase() === 'medico') {
            return 'Médico Asignado';
        }
        if (completo.toLowerCase().startsWith('dr')) {
            return completo;
        }
        return `Dr. ${completo}`;
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
                                {bloquesDelDia.map((bloque) => {
                                    const nombreMedico = formatearNombreMedico(
                                        bloque.profesional?.nombre,
                                        bloque.profesional?.apellido
                                    );
                                    const especialidad = bloque.profesional?.especialidad || 'Medicina General';

                                    return (
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
                                            <div className="BloqueHorario-Hora">
                                                <FaClock className="Icono-Hora-GestionHorarios" aria-hidden="true" />
                                                <span>{bloque.horaInicio} - {bloque.horaFin}</span>
                                            </div>
                                            <div className="BloqueHorario-Medico" title={nombreMedico}>
                                                <FaUserMd className="Icono-Medico-GestionHorarios" aria-hidden="true" />
                                                <span>{nombreMedico}</span>
                                            </div>
                                            <div className="BloqueHorario-Especialidad" title={especialidad}>
                                                {especialidad}
                                            </div>
                                        </div>
                                    );
                                })}
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
            onHorarioCreado={manejarHorarioCreado}
        />
        </>
    )
}

export default GestionHorariosAdministrador;
