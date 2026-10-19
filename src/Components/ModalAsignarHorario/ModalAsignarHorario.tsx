import React, { useState, useEffect } from 'react';
import './ModalAsignarHorario.css';
import { toast } from 'sonner';
import { apiClient } from '../../Services/apiClient';

interface ModalAsignarHorarioProps {
    isOpen: boolean;
    onClose: () => void;
    onHorarioCreado?: (nuevoBloque?: any) => void;
}

interface MedicoItem {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
    cargo: string;
}

interface BoxItem {
    id: string;
    nombre: string;
    tipo: string;
    piso: string;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DIAS_MAP: Record<string, number> = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6
};

export const ModalAsignarHorario: React.FC<ModalAsignarHorarioProps> = ({ isOpen, onClose, onHorarioCreado }) => {
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [boxSeleccionado, setBoxSeleccionado] = useState('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [medicoSeleccionado, setMedicoSeleccionado] = useState('');
    
    const [medicos, setMedicos] = useState<MedicoItem[]>([]);
    const [boxes, setBoxes] = useState<BoxItem[]>([]);
    const [guardando, setGuardando] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen) return;

        let cancelado = false;

        const cargarOpciones = async () => {
            try {
                // Consultar exclusivamente médicos al backend usando el query param role=2
                const staffData = await apiClient('/api/Staff?role=2', { method: 'GET' });
                if (!cancelado && Array.isArray(staffData)) {
                    // Filtrar estrictamente profesionales médicos
                    const docs = staffData
                        .filter((item: any) =>
                            item.role === 2 ||
                            String(item.role).toLowerCase() === 'medico' ||
                            (item.role === undefined && String(item.roleName || '').toLowerCase().includes('medico'))
                        )
                        .map((item: any) => ({
                            id: String(item.id || item.staffId),
                            nombre: String(item.firstName || '').trim(),
                            apellido: String(item.lastName || '').trim(),
                            especialidad: String(item.specialty || ''),
                            cargo: String(item.roleName || 'Médico')
                        }));

                    setMedicos(docs);
                }
            } catch (error) {
                console.error('Error al cargar médicos:', error);
            }

            try {
                const boxData = await apiClient('/api/Boxes', { method: 'GET' });
                if (!cancelado && Array.isArray(boxData)) {
                    const boxesList = boxData.map((item: any) => ({
                        id: String(item.id || item.boxId),
                        nombre: item.name || item.nombre || 'Box',
                        tipo: item.type || item.tipo || 'Consulta General',
                        piso: item.floor || item.piso || 'Piso 1'
                    }));
                    setBoxes(boxesList);
                }
            } catch (error) {
                console.error('Error al cargar boxes:', error);
            }
        };

        cargarOpciones();

        return () => {
            cancelado = true;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const toggleDia = (dia: string) => {
        setDiasSeleccionados(prev => 
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (diasSeleccionados.length === 0) {
            toast.warning('Debe seleccionar al menos un día de funcionamiento');
            return;
        }

        if (!medicoSeleccionado) {
            toast.warning('Debe seleccionar un médico');
            return;
        }

        if (!boxSeleccionado) {
            toast.warning('Debe seleccionar un box');
            return;
        }

        setGuardando(true);

        try {
            const diasNumeros = diasSeleccionados.map(d => DIAS_MAP[d]);

            const payload = {
                staffId: medicoSeleccionado,
                boxId: boxSeleccionado,
                startDate: fechaInicio,
                endDate: fechaFin,
                startTime: horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio,
                endTime: horaFin.length === 5 ? `${horaFin}:00` : horaFin,
                daysOfWeek: diasNumeros
            };

            const res = await apiClient('/api/ScheduleBlocks', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Horario asignado exitosamente');

            const medObj = medicos.find(m => m.id === medicoSeleccionado);
            const boxObj = boxes.find(b => b.id === boxSeleccionado);

            const nuevoBloque = {
                id: res?.id ? String(res.id) : crypto.randomUUID(),
                horaInicio,
                horaFin,
                box: {
                    id: boxSeleccionado,
                    nombre: boxObj ? boxObj.nombre : 'Box Asignado',
                    ubicacion: boxObj ? `${boxObj.piso} - ${boxObj.tipo}` : 'Consultas'
                },
                diasSemana: diasSeleccionados,
                rangoFechas: {
                    fechaInicio,
                    fechaFin
                },
                profesional: {
                    id: medicoSeleccionado,
                    nombre: medObj ? medObj.nombre : 'Médico',
                    apellido: medObj ? medObj.apellido : '',
                    especialidad: medObj?.especialidad || 'Medicina General',
                    cargo: medObj?.cargo || 'Médico'
                }
            };

            onHorarioCreado?.(nuevoBloque);

            // Limpiar formulario y cerrar
            setHoraInicio('');
            setHoraFin('');
            setBoxSeleccionado('');
            setDiasSeleccionados([]);
            setFechaInicio('');
            setFechaFin('');
            setMedicoSeleccionado('');
            onClose();
        } catch (error: any) {
            toast.error(`Error al asignar horario: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="ModalAsignarHorario-Overlay" onClick={onClose}>
            <div className="ModalAsignarHorario-Content" onClick={e => e.stopPropagation()}>
                <div className="ModalAsignarHorario-Header">
                    <h2>Asignar Nuevo Horario</h2>
                    <button className="ModalAsignarHorario-CloseBtn" onClick={onClose}>&times;</button>
                </div>
                <form className="ModalAsignarHorario-Form" onSubmit={handleSubmit}>
                    <div className="ModalAsignarHorario-FormGroup">
                        <label>Horario de Inicio</label>
                        <input type="time" required value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
                    </div>
                    <div className="ModalAsignarHorario-FormGroup">
                        <label>Horario de Término</label>
                        <input type="time" required value={horaFin} onChange={e => setHoraFin(e.target.value)} />
                    </div>
                    <div className="ModalAsignarHorario-FormGroup">
                        <label>Ubicación (Box)</label>
                        <select required value={boxSeleccionado} onChange={e => setBoxSeleccionado(e.target.value)}>
                            <option value="">Seleccione un box</option>
                            {boxes.map(box => (
                                <option key={box.id} value={box.id}>
                                    {box.nombre} - {box.tipo} ({box.piso})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ModalAsignarHorario-FormGroup">
                        <label>Días de Funcionamiento</label>
                        <div className="ModalAsignarHorario-Dias">
                            {DIAS_SEMANA.map(dia => (
                                <label key={dia} className="ModalAsignarHorario-DiaCheckbox">
                                    <input 
                                        type="checkbox" 
                                        checked={diasSeleccionados.includes(dia)}
                                        onChange={() => toggleDia(dia)}
                                    />
                                    {dia}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="ModalAsignarHorario-FormGroupRow">
                        <div className="ModalAsignarHorario-FormGroup">
                            <label>Vigencia (Desde)</label>
                            <input type="date" required value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                        </div>
                        <div className="ModalAsignarHorario-FormGroup">
                            <label>Vigencia (Hasta)</label>
                            <input type="date" required value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                        </div>
                    </div>
                    <div className="ModalAsignarHorario-FormGroup">
                        <label>Personal Asignado (Médico)</label>
                        <select required value={medicoSeleccionado} onChange={e => setMedicoSeleccionado(e.target.value)}>
                            <option value="">{medicos.length === 0 ? "No hay médicos disponibles" : "Seleccione un médico"}</option>
                            {medicos.map(medico => (
                                <option key={medico.id} value={medico.id}>
                                    {medico.nombre} {medico.apellido} {medico.especialidad ? `- ${medico.especialidad}` : (medico.cargo ? `- ${medico.cargo}` : '')}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ModalAsignarHorario-Footer">
                        <button type="button" className="ModalAsignarHorario-BtnCancel" onClick={onClose} disabled={guardando}>Cancelar</button>
                        <button type="submit" className="ModalAsignarHorario-BtnSubmit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar Horario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
