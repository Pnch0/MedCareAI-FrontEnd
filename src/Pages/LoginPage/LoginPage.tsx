import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../Services/supabaseClient.ts';
import './LoginPage.css';

function LoginPage() {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(''); 

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setErrorMsg('Credenciales incorrectas. Inténtalo de nuevo.');
            setLoading(false);
            return;
        }

        const userId = data.user.id;

        // Obtener el rol del usuario desde la tabla 'usuarios'
        const { data: userData, error: roleError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', userId)
            .single();

        if (roleError || !userData) {
            setErrorMsg('Error al obtener el rol del usuario.');
            setLoading(false);
            return;
        }

        const userRole = userData.rol;

        // Guardar la sesión y el rol para proteger las rutas
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('userRole', userRole);

        // Redirigir según el rol
        if (userRole === 'paciente') navigate('/main-page-paciente');
        else if (userRole === 'medico') navigate('/home-page-medico');
        else if (userRole === 'recepcionista') navigate('/home-page-recepcionista');
        else if (userRole === 'administrador') navigate('/home-page-administrador');
        else navigate('/');
    };

    const simularAcceso = (role: string, path: string) => {
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('userRole', role);
        navigate(path);
    };

    return (
        <div className="Contenedor-Centrado">
            <div className="Contenedor-LoginPage">
                <div className="ContenedorTexto-LoginPage">
                    <h1>Login</h1>
                    <p>Inicia sesión con tus datos</p>
                </div>
                <div className="ContenedorFormulario-LoginPage">
                    <form onSubmit={handleLogin}>
                        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

                        <label htmlFor="Email">Correo Electrónico:</label>
                        <input 
                            type="email" 
                            id="Email"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label htmlFor="Contraseña">Contraseña:</label>
                        <input 
                            type="password" 
                            id="Contraseña"
                            placeholder="**********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <p className="Texto-Registro">
                            ¿No tienes cuenta? <Link to="/register-page">Haz clic aquí para crearla</Link>
                        </p>

                        <button 
                            className="Boton-LoginPage" 
                            disabled={loading}
                        >
                            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>
            </div>

            {import.meta.env.DEV && (
                <div className="Contenedor-AccesoRapido">
                    <div className="ContenedorTexto-AccesoRapido">
                        <h2>Acceso rápido</h2>
                        <p>Solo desarrollo - simula un rol sin autenticación</p>
                    </div>
                    <div className="ContenedorBotones-AccesoRapido">
                        <button className="Boton-AccesoRapido" onClick={() => simularAcceso('paciente', '/main-page-paciente')}>Paciente</button>
                        <button className="Boton-AccesoRapido" onClick={() => simularAcceso('medico', '/home-page-medico')}>Médico</button>
                        <button className="Boton-AccesoRapido" onClick={() => simularAcceso('recepcionista', '/home-page-recepcionista')}>Recepcionista</button>
                        <button className="Boton-AccesoRapido" onClick={() => simularAcceso('administrador', '/home-page-administrador')}>Administrador</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginPage;