import { useState, useEffect } from "react";
import "./GestionHorarios.css";
import { toast } from "sonner";
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

const DIA_MAP: Record<string, string> = {
    '0': 'Domingo',
    '1': 'Lunes',
    '2': 'Martes',
    '3': 'Miércoles',
    '4': 'Jueves',
    '5': 'Viernes',
    '6': 'Sábado',
    'sunday': 'Domingo',
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'domingo': 'Domingo',
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado'
};

const normalizarNombreDia = (d: any): string => {
    if (d === null || d === undefined) return 'Lunes';
    const clave = String(d).trim().toLowerCase();
    return DIA_MAP[clave] || 'Lunes';
};

function GestionHorariosAdministrador(){
    const [modalDetalleAbierto, setModalDetalleAbierto] = useState<boolean>(false);
    const [modalAsignarAbierto, setModalAsignarAbierto] = useState<boolean>(false);
    const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueHorario | null>(null);
    const [bloques, setBloques] = useState<BloqueHorario[]>([]);

    const cargarBloquesHorarios = async () => {
        try {
            const [blocksRes, staffRes, boxesRes] = await Promise.allSettled([
                apiClient('/api/ScheduleBlocks', { method: 'GET' }),
                apiClient('/api/Staff', { method: 'GET' }),
                apiClient('/api/Boxes', { method: 'GET' })
            ]);

            const data = blocksRes.status === 'fulfilled' ? blocksRes.value : null;
            const staffList = staffRes.status === 'fulfilled' && Array.isArray(staffRes.value) ? staffRes.value : [];
            const boxesList = boxesRes.status === 'fulfilled' && Array.isArray(boxesRes.value) ? boxesRes.value : [];

            console.log('Datos recibidos de ScheduleBlocks:', data);

            const listaCruda = Array.isArray(data)
                ? data
                : (data?.sblocks || data?.data || data?.items || data?.scheduleBlocks || data?.$values || []);

            if (Array.isArray(listaCruda)) {
                const lista: BloqueHorario[] = listaCruda.map((item: any) => {
                    const rawDias = item.daysOfWeek || item.DaysOfWeek || item.dayOfWeeks || item.DayOfWeeks || [];
                    const dias = Array.isArray(rawDias)
                        ? rawDias.map(normalizarNombreDia)
                        : [];

                    const rawStartTime = item.startTime || item.StartTime || item.horaInicio || item.HoraInicio || '08:00';
                    const rawEndTime = item.endTime || item.EndTime || item.horaFin || item.HoraFin || '17:00';

                    const staffId = String(item.staffId || item.StaffId || item.medicoId || item.MedicoId || '');
                    const boxId = String(item.boxId || item.BoxId || '');

                    const medico = staffList.find((s: any) => String(s.id || s.staffId) === staffId);
                    const boxObj = boxesList.find((b: any) => String(b.id || b.boxId) === boxId);

                    return {
                        id: String(item.id || item.Id || item.ruleGroupId || item.RuleGroupId || crypto.randomUUID()),
                        horaInicio: String(rawStartTime).substring(0, 5),
                        horaFin: String(rawEndTime).substring(0, 5),
                        box: {
                            id: boxId,
                            nombre: boxObj?.name || boxObj?.nombre || item.boxName || item.BoxName || 'Box Asignado',
                            ubicacion: boxObj?.floor || boxObj?.piso ? `${boxObj.floor || boxObj.piso} - ${boxObj.type || boxObj.tipo || 'Consultas'}` : (item.boxLocation || item.BoxLocation || 'Consultas')
                        },
                        diasSemana: dias,
                        rangoFechas: {
                            fechaInicio: item.startDate || item.StartDate || '',
                            fechaFin: item.endDate || item.EndDate || ''
                        },
                        profesional: {
                            id: staffId,
                            nombre: medico?.firstName || item.staffFirstName || item.StaffFirstName || 'Médico',
                            apellido: medico?.lastName || item.staffLastName || item.StaffLastName || '',
                            especialidad: medico?.specialty || item.specialty || item.Specialty || 'Medicina General',
                            cargo: medico?.roleName || item.roleName || item.RoleName || 'Médico'
                        }
                    };
                });

                setBloques(lista);
            }
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
