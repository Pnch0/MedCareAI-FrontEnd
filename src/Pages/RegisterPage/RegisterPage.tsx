import { useState } from 'react';
import './RegisterPage.css';
import ComboboxSeguro from '../../Components/ComboBox/ComboboxSeguro.tsx';


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
                        <div className="Campo-Grupo" style={{ width: '100%', marginTop: '5px' }}>
                            <label>Seguro Médico / Previsión:</label>
                            <ComboboxSeguro 
                                value={seguroMedico} 
                                onChange={(valor) => setSeguroMedico(valor)} 
                            />
                        </div>

                        <button className='Boton-RegisterPage'>
                            Iniciar Sesion
                        </button>
                    </form>
                </div>
            </div>
            
        </div>
        </>
    )
}

export default RegisterPage;