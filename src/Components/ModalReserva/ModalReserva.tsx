import React, { useState, useEffect } from 'react';
import './ModalReserva.css';

interface ReservaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DayInfo {
    name: string;
    date: string;
    fullDate: Date;
}

export const ModalReserva: React.FC<ReservaModalProps> = ({ isOpen, onClose }) => {
    const [baseDate, setBaseDate] = useState<Date>(new Date());
    const [days, setDays] = useState<DayInfo[]>([]); 
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('12:00');
    const [sintomas, setSintomas] = useState<string>('');
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    useEffect(() => {
        const current = new Date(baseDate);
        const dayOfWeek = current.getDay(); 
        const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        current.setDate(current.getDate() - distanceToMonday);

        const week: DayInfo[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(current);
            day.setDate(current.getDate() + i);
            week.push({
                name: dayNames[i],
                date: day.getDate().toString().padStart(2, '0'),
                fullDate: day,
            });
        }
        setDays(week);

        if (!selectedDay) {
            setSelectedDay(new Date());
        }
    }, [baseDate]);

    if (!isOpen) return null;

    const nextWeek = () => {
        const newDate = new Date(baseDate);
        newDate.setDate(baseDate.getDate() + 7);
        setBaseDate(newDate);
    };

    const prevWeek = () => {
        const newDate = new Date(baseDate);
        newDate.setDate(baseDate.getDate() - 7);
        setBaseDate(newDate);
    };

    const nextMonth = () => {
        const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        setBaseDate(newDate);
    };

    const prevMonth = () => {
        const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
        setBaseDate(newDate);
    };

    const getDisplayMonthYear = () => {
        const monthName = baseDate.toLocaleString('es-ES', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        return `${capitalizedMonth} ${baseDate.getFullYear()}`;
    };

    const formatSummaryDate = (date: Date | null) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const monthStr = date.toLocaleString('es-ES', { month: 'short' });
        const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    const handleReservar = () => {
        console.log("Reserva confirmada:", {
            fecha: selectedDay,
            hora: selectedTime,
            sintomas: sintomas
        });
        onClose();
    };

    return (
        <div className="Modal-Overlay" onClick={onClose}>
            <div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
                <h2 className="Modal-Title">Reservar Hora</h2>
                
                <div className="Modal-Body">
                    <div className="Modal-Panel Izquierdo">
                        
                        <div className="Month-Container">
                            <button onClick={prevMonth} className="Nav-Button">◀</button>
                            <span className="Month-Label">{getDisplayMonthYear()}</span>
                            <button onClick={nextMonth} className="Nav-Button">▶</button>
                        </div>

                        <div className="Week-Container">
                            <button onClick={prevWeek} className="Nav-Button">◀ Semana Anterior</button>
                            <button onClick={nextWeek} className="Nav-Button">Semana Siguiente ▶</button>
                        </div>

                        <h4 className="Modal-Subtitle">Seleccione Dia:</h4>

                        <div className="Days-Grid">
                            {days.map((day, index) => {
                                const isActive = selectedDay?.toDateString() === day.fullDate.toDateString();
                                
                                return (
                                    <button 
                                        key={index} 
                                        className={`Day-Button ${isActive ? 'active' : ''}`}
                                        onClick={() => setSelectedDay(day.fullDate)}
                                    >
                                        <span className="Day-Name">{day.name}</span>
                                        <span className="Day-Number">{day.date}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <h4 className="Modal-Subtitle">Seleccione Horario:</h4>
                        <div className="Times-Grid">
                            {times.map((time, index) => (
                                <button 
                                    key={index} 
                                    className={`Time-Button ${selectedTime === time ? 'active' : ''}`}
                                    onClick={() => setSelectedTime(time)}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>

                        <div className="Sintomas-Container">
                            <h4 className="Modal-Subtitle">Describe tus síntomas (Opcional):</h4>
                            <textarea 
                                className="Sintomas-Textarea" 
                                placeholder="Ej: Tengo dolor de cabeza desde hace 3 días, fiebre por las noches y cansancio general..."
                                value={sintomas}
                                onChange={(e) => setSintomas(e.target.value)}
                            />
                        </div>

                    </div>

                    <div className="Modal-Panel Derecho">
                        <div className="Image-Placeholder"></div>
                        <div className="Summary-Info">
                            <p><strong>Dia:</strong> {formatSummaryDate(selectedDay)}</p>
                            <p><strong>Hora:</strong> {selectedTime} {parseInt(selectedTime) >= 12 ? 'PM' : 'AM'}</p>
                        </div>
                        <button className="Boton-Reservar-Final" onClick={handleReservar}>
                            Reservar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};