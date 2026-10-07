import { useState } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { toast } from 'sonner';
import { supabase } from '../../Services/supabaseClient';
import './ModalRegistro.css';
import '../../Pages/RegisterPage/RegisterPage.css';

interface RegisterPatientModalProps {
    onClose: () => void;
}

function RegisterPatientModal({ onClose }: RegisterPatientModalProps) {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [rut, setRut] = useState('');
    const [numero, setNumero] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [genero, setGenero] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            toast.error(`Error al registrar credenciales: ${authError.message}`);
            setLoading(false);
            return;
        }

        const userId = authData.user?.id;

        if (userId) {
            const currentDate = new Date().toISOString();
            const { error: userError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        id: userId,
                        email: email,
                        rol: 'paciente',
                        CreatedAt: currentDate
                    }
                ]);

            if (userError) {
                toast.error(`Error al crear usuario general: ${userError.message}`);
                setLoading(false);
                return;
            }

            const pacienteId = crypto.randomUUID();

            const { error: dbError } = await supabase
                .from('pacientes') 
                .insert([
                    {
                        id: pacienteId,
                        usuario_id: userId, 
                        nombre: nombre,
                        apellido: apellido,
                        rut: rut,
                        telefono: numero,
                        fecha_nacimiento: fechaNacimiento,
                        genero: genero,
                        email: email,
                        CreatedAt: currentDate
                    }
                ]);

            if (dbError) {
                toast.error(`Error al guardar perfil de paciente: ${dbError.message}`);
                setLoading(false);
                return;
            }

            
            toast.success('Paciente registrado exitosamente. Ya puedes asignarle una hora.');
            setLoading(false);
            onClose();
        }
    };

    return (
        <div className="ModalOverlay" onClick={onClose}>
            <div className="ModalContent" onClick={onClose}>
                <div 
                    className="Contenedor-RegisterPage Modal-RegisterPage"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="CloseButton" onClick={onClose} aria-label="Cerrar modal">
                        <FaTimes />
                    </button>
                    <div className="ContenedorTexto-RegisterPage">
                        <h1>Registrar Paciente</h1>
                        <p>Ingresa los datos del paciente para registrarlo</p>
                    </div>
                    <div className="ContenedorFormulario-RegisterPage">
                        <form onSubmit={handleRegister}>
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
                                <div className="ContenedorInput-Password">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        id="Password"
                                        placeholder="Crea una contraseña"
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
                                        <option value="" disabled>Selecciona género</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="femenino">Femenino</option>
                                        <option value="otro">Otro</option>
                                        <option value="prefiero_no_decirlo">Prefiero no decirlo</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button className='Boton-RegisterPage' disabled={loading}>
                                {loading ? 'Registrando...' : 'Registrar Paciente'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPatientModal;

