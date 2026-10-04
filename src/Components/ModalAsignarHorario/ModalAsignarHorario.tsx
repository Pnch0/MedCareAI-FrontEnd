import React, { useState } from 'react';
import './ModalAsignarHorario.css';
import { MEDICOS } from '../../Services/catalogoMedico';

interface ModalAsignarHorarioProps {
    isOpen: boolean;
    onClose: () => void;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const ModalAsignarHorario: React.FC<ModalAsignarHorarioProps> = ({ isOpen, onClose }) => {
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [box, setBox] = useState('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [medicoSeleccionado, setMedicoSeleccionado] = useState('');

    if (!isOpen) return null;

    const toggleDia = (dia: string) => {
        setDiasSeleccionados(prev => 
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here we could handle saving the schedule block
        console.log({
            horaInicio,
            horaFin,
            box,
            diasSeleccionados,
            vigencia: { inicio: fechaInicio, fin: fechaFin },
            medico: medicoSeleccionado
        });
        onClose();
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
                        <input type="text" placeholder="Ej: Box 1, Box 2" required value={box} onChange={e => setBox(e.target.value)} />
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
                            <option value="">Seleccione un médico</option>
                            {MEDICOS.map(medico => (
                                <option key={medico.id} value={medico.id}>
                                    {medico.nombre} {medico.apellido} - {medico.cargo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ModalAsignarHorario-Footer">
                        <button type="button" className="ModalAsignarHorario-BtnCancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="ModalAsignarHorario-BtnSubmit">Guardar Horario</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
