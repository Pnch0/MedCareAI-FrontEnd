import './LoginPage.css';
import { Link } from 'react-router-dom';


function LoginPage(){

    return(
        <>
        <div className="Contenedor-Centrado">
            <div className="Contenedor-LoginPage">
                <div className="ContenedorTexto-LoginPage">
                    <h1>Login</h1>
                    <p>Inicia sesión con sus datos</p>
                </div>
                <div className="ContenedorFormulario-LoginPage">
                    <form>
                        <label htmlFor="RUT">RUT:</label>
                        <input 
                        type="text" 
                        id='RUT'
                        placeholder='1.111.111-1'
                        required
                        />

                        <label htmlFor="Contraseña">Contraseña:</label>
                        <input 
                        type="password" 
                        id='Contraseña'
                        placeholder='**********'
                        required
                        />

                        <p className="Texto-Registro">
                            ¿No tienes cuenta? <Link to="/registro">Haz clic aquí para crearla</Link>
                        </p>

                        <button className='Boton-LoginPage'>
                            Iniciar Sesion
                        </button>
                    </form>
                    
                </div>
            </div>
        </div>
        </>
    )
}

export default LoginPage;