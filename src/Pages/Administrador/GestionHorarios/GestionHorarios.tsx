import { useState, useEffect } from "react";
import "./GestionHorarios.css";
import { ModalDetalleHorario } from "../../../Components/ModalDetalleHorario/ModalDetalleHorario.tsx";
import { ModalAsignarHorario } from "../../../Components/ModalAsignarHorario/ModalAsignarHorario.tsx";
import type { BloqueHorario } from "../../../Services/horarios.ts";
import { apiClient } from "../../../Services/apiClient.ts";

const DIAS_COLUMNAS = [
    { id: 'Lunes', letra: 'L', className: 'Listado-GestionHorarios-1' },
    { id: 'Martes', letra: 'M', className: 'Listado-GestionHorarios' },
    { id: 'Miércoles', letra: 'M', className: 'Listado-GestionHorarios' },
    { id: 'Jueves', letra: 'J', className: 'Listado-GestionHorarios' },
    { id: 'Viernes', letra: 'V', className: 'Listado-GestionHorarios' },
    { id: 'Sábado', letra: 'S', className: 'Listado-GestionHorarios' },
    { id: 'Domingo', letra: 'D', className: 'Listado-GestionHorarios-7' },
];

const NUMERO_A_DIA: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
};

function GestionHorariosAdministrador(){
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
    const [modalAsignarAbierto, setModalAsignarAbierto] = useState<boolean>(false);
    const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueHorario | null>(null);
    const [bloques, setBloques] = useState<BloqueHorario[]>([]);

    const cargarBloquesHorarios = async () => {
        try {
            const data = await apiClient('/api/ScheduleBlocks', { method: 'GET' });
            if (Array.isArray(data)) {
                const lista: BloqueHorario[] = data.map((item: any) => {
                    const dias = Array.isArray(item.daysOfWeek)
                        ? item.daysOfWeek.map((d: number | string) => typeof d === 'number' ? (NUMERO_A_DIA[d] || 'Lunes') : String(d))
                        : [];
                    return {
                        id: String(item.id || item.ruleGroupId || crypto.randomUUID()),
                        horaInicio: item.startTime ? String(item.startTime).substring(0, 5) : '08:00',
                        horaFin: item.endTime ? String(item.endTime).substring(0, 5) : '17:00',
                        box: {
                            id: item.boxId || item.box?.id || '',
                            nombre: item.boxName || item.box?.name || 'Box Asignado',
                            ubicacion: item.boxLocation || item.box?.location || 'Consultas'
                        },
                        diasSemana: dias,
                        rangoFechas: {
                            fechaInicio: item.startDate || '',
                            fechaFin: item.endDate || ''
                        },
                        profesional: {
                            id: item.staffId || item.staff?.id || '',
                            nombre: item.staffFirstName || item.staff?.firstName || 'Médico',
                            apellido: item.staffLastName || item.staff?.lastName || '',
                            especialidad: item.specialty || item.staff?.specialty || 'Medicina General',
                            cargo: item.roleName || item.staff?.roleName || 'Médico'
                        }
                    };
                });
                setBloques(lista);
            }
        } catch {
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
            onHorarioCreado={manejarHorarioCreado}
        />
        </>
    )
}

export default GestionHorariosAdministrador;