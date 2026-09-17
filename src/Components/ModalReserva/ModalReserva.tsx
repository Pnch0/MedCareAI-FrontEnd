import React, { useState } from 'react';
import './ReservaModal.css';

interface ReservaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReservaModal: React.FC<ReservaModalProps> = ({ isOpen, onClose }) => {
    const [selectedDay, setSelectedDay] = useState<string>('02');
    const [selectedTime, setSelectedTime] = useState<string>('12:00');

    if (!isOpen) return null;

    const days = [
        { name: 'Lun', date: '31' },
        { name: 'Mar', date: '01' },
        { name: 'Mie', date: '02' },
        { name: 'Juv', date: '03' },
        { name: 'Vie', date: '04' },
        { name: 'Sab', date: '05' },
        { name: 'Dom', date: '06' },
    ];

    const times = ['07:00', '08:00', '09:00', '09:30', '10:00', '11:00', '12:00'];

    return (
        <div className="Modal-Overlay" onClick={onClose}>
            <div className="Modal-Content" onClick={(e) => e.stopPropagation()}>
                <h2 className="Modal-Title">Reservar Hora</h2>
                
                <div className="Modal-Body">
                    <div className="Modal-Panel Izquierdo">
                        <h4 className="Modal-Subtitle">Seleccione Dia:</h4>
                        <div className="Days-Grid">
                            {days.map((day, index) => (
                                <button 
                                    key={index} 
                                    className={`Day-Button ${selectedDay === day.date ? 'active' : ''}`}
                                    onClick={() => setSelectedDay(day.date)}
                                >
                                    <span className="Day-Name">{day.name}</span>
                                    <span className="Day-Number">{day.date}</span>
                                </button>
                            ))}
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
                            <p><strong>Dia:</strong> {selectedDay} Sept, 2026</p>
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