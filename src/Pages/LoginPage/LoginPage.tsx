import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from 'sonner';
import { supabase } from '../../Services/supabaseClient.ts';
import { apiClient } from '../../Services/apiClient.ts';
import './LoginPage.css';

const mapearRolStaff = (role: number | string): string => {
    if (typeof role === 'number') {
        const numMap: Record<number, string> = {
            0: 'paciente',
            1: 'recepcionista',
            2: 'medico',
            3: 'administrador'
        };
        return numMap[role] || 'recepcionista';
    }
    const r = String(role).toLowerCase();
    if (r === 'administrador' || r === 'admin') return 'administrador';
    if (r === 'medico' || r === 'doctor') return 'medico';
    if (r === 'recepcionista' || r === 'receptionist') return 'recepcionista';
    if (r === 'paciente' || r === 'patient') return 'paciente';
    return r;
};

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
        const userEmail = data.user.email || email;
        const accessToken = data.session.access_token;
        localStorage.setItem('token', accessToken);

        let userRole = 'paciente';
        let userName = data.user.user_metadata?.full_name ||
            (data.user.user_metadata?.first_name ? `${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name || ''}`.trim() : '') ||
            userEmail.split('@')[0];

        const { data: userData } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', userId)
            .single();

        if (userData?.rol) {
            userRole = userData.rol;
        }

        try {
            const staffList = await apiClient('/api/Staff', { method: 'GET' });
            if (Array.isArray(staffList)) {
                const staffMember = staffList.find((s: any) =>
                    (s.userId && s.userId === userId) ||
                    (s.email && s.email.toLowerCase() === userEmail.toLowerCase())
                );

                if (staffMember) {
                    if (staffMember.firstName || staffMember.lastName) {
                        userName = `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
                    }
                    if (staffMember.role !== undefined) {
                        const mappedRole = mapearRolStaff(staffMember.role);
                        if (mappedRole) {
                            userRole = mappedRole;
                            if (userData?.rol !== mappedRole) {
                                await supabase
                                    .from('usuarios')
                                    .upsert({
                                        id: userId,
                                        email: userEmail,
                                        rol: mappedRole,
                                        CreatedAt: new Date().toISOString()
                                    });
                            }
                        }
                    }
                }
            }
        } catch (staffErr) {
            console.warn('No se pudo verificar staff en backend, usando rol de Supabase:', staffErr);
        }

        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);

        toast.success('Inicio de sesión exitoso');

        if (userRole === 'paciente') navigate('/main-page-paciente');
        else if (userRole === 'medico') navigate('/home-page-medico');
        else if (userRole === 'recepcionista') navigate('/home-page-recepcionista');
        else if (userRole === 'administrador') navigate('/home-page-administrador');
        else navigate('/');
    };

    const simularAcceso = (role: string, path: string) => {
        const nombresSimulados: Record<string, string> = {
            administrador: 'Admin MedCare',
            medico: 'Dr. Médico Staff',
            recepcionista: 'Recepcionista MedCare',
            paciente: 'Paciente MedCare'
        };
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', nombresSimulados[role] || 'Usuario MedCare');
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
