import { useState } from 'react';
import './RegisterPage.css';


function RegisterPage(){
    const [seguroMedico, setSeguroMedico] = useState('');

    return(
        <>
        <div className="Contenedor-Centrado">
            <div className="Contenedor-RegisterPage">
                <div className="ContenedorTexto-RegisterPage">
                    <h1>Register</h1>
                    <p>Ingresa tus datos y crea tu cuenta</p>
                </div>
                <div className="ContenedorFormulario-RegisterPage">
                    <form>
                        <div className="Fila-Doble">
                            <div className="Campo-Grupo">
                                <label htmlFor="Nombre">Nombre:</label>
                                <input 
                                    type="text" 
                                    id="Nombre"
                                    placeholder="Nombre"
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo">
                                <label htmlFor="Apellido">Apellido:</label>
                                <input 
                                    type="text" 
                                    id="Apellido"
                                    placeholder="Apellido"
                                    required
                                />
                            </div>
                        </div>

                        <div className="Fila-Doble">
                            <div className="Campo-Grupo">
                                <label htmlFor="RUT">RUT:</label>
                                <input 
                                    type="text" 
                                    id="RUT"
                                    placeholder="RUT"
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo">
                                <label htmlFor="Numero">Numero:</label>
                                <input 
                                    type="text" 
                                    id="Numero"
                                    placeholder="Numero"
                                    required
                                />
                            </div>
                        </div>
                            <div className="Campo-Grupo">
                            <label>Seguro Médico / Previsión:</label>
                            </div>
                    </form>
                </div>
            </div>
            
        </div>
        </>
    )
}

export default RegisterPage;