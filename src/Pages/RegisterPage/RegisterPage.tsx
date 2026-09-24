import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../Services/supabaseClient.ts';
import './RegisterPage.css';

function RegisterPage() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [rut, setRut] = useState('');
    const [numero, setNumero] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [genero, setGenero] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            setErrorMsg(`Error al registrar credenciales: ${authError.message}`);
            setLoading(false);
            return;
        }

        const userId = authData.user?.id;

        if (userId) {
            const { error: dbError } = await supabase
                .from('pacientes') 
                .insert([
                    {
                        id: userId, 
                        nombre: nombre,
                        apellido: apellido,
                        rut: rut,
                        numero: numero,
                        fecha_nacimiento: fechaNacimiento,
                        genero: genero,
                    }
                ]);

            if (dbError) {
                setErrorMsg(`Error al guardar perfil: ${dbError.message}`);
                setLoading(false);
                return;
            }

            console.log('Usuario y perfil creados exitosamente');
            navigate('/');
        }
    };

    return (
        <div className="Contenedor-Centrado">
            <div className="Contenedor-RegisterPage">
                <div className="ContenedorTexto-RegisterPage">
                    <h1>Register</h1>
                    <p>Ingresa tus datos y crea tu cuenta</p>
                </div>
                <div className="ContenedorFormulario-RegisterPage">
                    <form onSubmit={handleRegister}>
                        {errorMsg && <p style={{ color: 'red', gridColumn: '1 / -1' }}>{errorMsg}</p>}

                        <div className="Campo-Largo">
                            <label htmlFor="Email">Correo Electrónico:</label>
                            <input 
                                type="email" 
                                id="Email"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="Campo-Largo">
                            <label htmlFor="Password">Contraseña:</label>
                            <input 
                                type="password" 
                                id="Password"
                                placeholder="Crea una contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="Fila-Doble">
                            <div className="Campo-Grupo">
                                <label htmlFor="Nombre">Nombre:</label>
                                <input 
                                    type="text" 
                                    id="Nombre"
                                    placeholder="Nombre"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo">
                                <label htmlFor="Apellido">Apellido:</label>
                                <input 
                                    type="text" 
                                    id="Apellido"
                                    placeholder="Apellido"
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
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
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo">
                                <label htmlFor="Numero">Numero:</label>
                                <input 
                                    type="text" 
                                    id="Numero"
                                    placeholder="Numero"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="Fila-Doble">
                            <div className="Campo-Grupo">
                                <label htmlFor="Fecha_Nacimiento">Fecha de Nacimiento:</label>
                                <input 
                                    type="date" 
                                    id="Fecha_Nacimiento"
                                    value={fechaNacimiento}
                                    onChange={(e) => setFechaNacimiento(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="Campo-Grupo">
                                <label htmlFor="Genero">Genero:</label>
                                <select 
                                    id="Genero" 
                                    required
                                    value={genero}
                                    onChange={(e) => setGenero(e.target.value)}
                                >
                                    <option value="" disabled>Selecciona tu género</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                    <option value="otro">Otro</option>
                                    <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
                                </select>
                            </div>
                        </div>
                        
                        <button className='Boton-RegisterPage' disabled={loading}>
                            {loading ? 'Registrando...' : 'Crear Cuenta'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;