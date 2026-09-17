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

    // Mantenemos tus constantes
    const times = ['07:00', '08:00', '09:00', '09:30', '10:00', '11:00', '12:00'];
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

    const formatSummaryDate = (date: Date | null) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const monthStr = date.toLocaleString('es-ES', { month: 'short' });
        const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
        const year = date.getFullYear();
        return `${day} ${month}, ${year}`;
    };

    return (
        <div className="Modal-Overlay" onClick={onClose}>
            <div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
                <h2 className="Modal-Title">Reservar Hora</h2>
                
                <div className="Modal-Body">
                    <div className="Modal-Panel Izquierdo">
                        <div className="Week-Header">
                            <h4 className="Modal-Subtitle">Seleccione Dia:</h4>
                            <div className="Week-Navigation">
                                <button onClick={prevWeek} className="Nav-Button">◀ Ant</button>
                                <button onClick={nextWeek} className="Nav-Button">Sig ▶</button>
                            </div>
                        </div>

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
                    </div>

                    <div className="Modal-Panel Derecho">
                        <div className="Image-Placeholder"></div>
                        <div className="Summary-Info">
                            <p><strong>Dia:</strong> {formatSummaryDate(selectedDay)}</p>
                            <p><strong>Hora:</strong> {selectedTime} {parseInt(selectedTime) >= 12 ? 'PM' : 'AM'}</p>
                        </div>
                        <button className="Boton-Reservar-Final" onClick={onClose}>
                            Reservar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};