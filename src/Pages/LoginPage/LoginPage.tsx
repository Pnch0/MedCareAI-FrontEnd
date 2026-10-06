import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from 'sonner';
import { supabase } from '../../Services/supabaseClient.ts';
import './LoginPage.css';


function LoginPage() {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            toast.error('Credenciales incorrectas. Inténtalo de nuevo.');
            setLoading(false);
            return;
        }

        const userId = data.user.id;

        const { data: userData, error: roleError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', userId)
            .single();

        if (roleError || !userData) {
            toast.error('Error al obtener el rol del usuario.');
            setLoading(false);
            return;
        }

        const userRole = userData.rol;
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('userRole', userRole);

        toast.success('Inicio de sesión exitoso');

        if (userRole === 'paciente') navigate('/main-page-paciente');
        else if (userRole === 'medico') navigate('/home-page-medico');
        else if (userRole === 'recepcionista') navigate('/home-page-recepcionista');
        else if (userRole === 'administrador') navigate('/home-page-administrador');
        else navigate('/');
    };

    const simularAcceso = (role: string, path: string) => {
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('userRole', role);
        toast.success(`Inicio de sesión exitoso (Simulado: ${role})`);
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
                        <div className="ContenedorInput-Password">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="Contraseña"
                                placeholder="**********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="Boton-VerPassword"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                            </button>
                        </div>

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