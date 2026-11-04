import { useState, useEffect, useMemo } from "react";
import "./ResumenPage.css";
import { FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import { supabase } from "../../../Services/supabaseClient.ts";
import { obtenerCitasLocales, type Cita } from "../../../Services/agenda.ts";

export type Paciente = {
    id: string | number;
    nombre: string;
    edad: number;
    rut?: string;
    diagnostico: string;
    resumen: string;
    diagnosticoCompleto: string;
    tieneAtencion: boolean;
    tieneCita: boolean;
};

const LOCAL_FICHAS_KEY = 'medcare_fichas_clinicas';

function calcularEdad(fechaNacimiento?: string): number {
    if (!fechaNacimiento) return 24;
    const nac = new Date(fechaNacimiento);
    if (isNaN(nac.getTime())) return 24;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return Math.max(0, edad);
}

function normalizarTexto(texto: string): string {
    return (texto || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function ResumenPageMedico(){
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [busqueda, setBusqueda] = useState<string>("");
    const [filtro, setFiltro] = useState<string>("todos");

    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
    const [modoEdicion, setModoEdicion] = useState<boolean>(false);
    const [diagnosticoEditado, setDiagnosticoEditado] = useState<string>("");
    const [evolucionEditada, setEvolucionEditada] = useState<string>("");

    const cargarPacientes = async () => {
        setCargando(true);
        try {
            // 1. Obtener pacientes desde Supabase
            const { data: dbPacientes, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) {
                console.warn('Error al consultar tabla pacientes:', error.message);
            }

            // 2. Obtener citas activas de la agenda
            const citasLocales = obtenerCitasLocales();

            // 3. Obtener fichas clínicas guardadas localmente
            let fichasGuardadas: Record<string, any> = {};
            try {
                const rawFichas = localStorage.getItem(LOCAL_FICHAS_KEY);
                if (rawFichas) fichasGuardadas = JSON.parse(rawFichas);
            } catch {
                // Ignorar error al parsear
            }

            const listaPacientes: Paciente[] = [];
            const nombresProcesados = new Set<string>();

            // Procesar pacientes de la base de datos
            if (Array.isArray(dbPacientes)) {
                for (const p of dbPacientes) {
                    const nombreCompleto = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Paciente';
                    const idStr = String(p.id);
                    const nomNorm = normalizarTexto(nombreCompleto);
                    nombresProcesados.add(nomNorm);

                    // Buscar si tiene una ficha clínica registrada
                    const fichaGuardada = fichasGuardadas[idStr] || fichasGuardadas[nomNorm];

                    // Buscar cita médica activa correspondiente
                    const citaCoincidente = citasLocales.find((c: Cita) => {
                        const cNom = normalizarTexto(c.paciente || '');
                        const pNomSolo = normalizarTexto(p.nombre || '');
                        return cNom.includes(nomNorm) || nomNorm.includes(cNom) || (pNomSolo.length > 3 && cNom.includes(pNomSolo));
                    });

                    const edad = calcularEdad(p.fecha_nacimiento);

                    if (fichaGuardada) {
                        const resumenCorto = fichaGuardada.resumen
                            ? (fichaGuardada.resumen.length > 55 ? `${fichaGuardada.resumen.slice(0, 55).trim()}...` : fichaGuardada.resumen)
                            : 'Ficha clínica actualizada.';

                        listaPacientes.push({
                            id: p.id,
                            nombre: nombreCompleto,
                            edad,
                            rut: p.rut,
                            diagnostico: fichaGuardada.diagnostico || 'Atención Realizada',
                            resumen: resumenCorto,
                            diagnosticoCompleto: fichaGuardada.diagnosticoCompleto || 'Evolución y diagnóstico registrados en ficha.',
                            tieneAtencion: true,
                            tieneCita: !!citaCoincidente
                        });
                    } else if (citaCoincidente) {
                        const motivo = citaCoincidente.motivo || 'Consulta médica general';
                        const sintomasCortos = motivo.length > 55 ? `${motivo.slice(0, 55).trim()}...` : motivo;

                        listaPacientes.push({
                            id: p.id,
                            nombre: nombreCompleto,
                            edad,
                            rut: p.rut,
                            diagnostico: 'Pendiente de atención',
                            resumen: `Síntomas: ${sintomasCortos}`,
                            diagnosticoCompleto: `Paciente agendado para consulta médica en MedCareAI.\n\n` +
                                `• Cita Programada: ${citaCoincidente.fecha || 'Fecha programada'} a las ${citaCoincidente.hora || ''} (Box ${citaCoincidente.box || 1})\n` +
                                `• Motivo / Síntomas completos: "${motivo}"\n\n` +
                                `Estado de Atención: En espera de primera evaluación clínica.\n` +
                                `El paciente aún no cuenta con diagnósticos médicos previos finalizados en el sistema. Presione "Registrar Diagnóstico" para ingresar la evolución médica correspondiente.`,
                            tieneAtencion: false,
                            tieneCita: true
                        });
                    } else {
                        listaPacientes.push({
                            id: p.id,
                            nombre: nombreCompleto,
                            edad,
                            rut: p.rut,
                            diagnostico: 'Paciente Registrado',
                            resumen: 'Sin consultas médicas agendadas actualmente.',
                            diagnosticoCompleto: `Paciente registrado en el sistema MedCareAI.\n\n` +
                                `• RUT: ${p.rut || 'No informado'}\n` +
                                `• Teléfono: ${p.telefono || 'No informado'}\n` +
                                `• Email: ${p.email || 'No informado'}\n\n` +
                                `Estado de Ficha: Sin atenciones médicas previas registradas. Cuando el paciente asista a una consulta, se podrá registrar su evolución médica correspondiente.`,
                            tieneAtencion: false,
                            tieneCita: false
                        });
                    }
                }
            }

            // Procesar citas de pacientes locales que no estén en la base de datos
            for (const c of citasLocales) {
                const cNom = normalizarTexto(c.paciente || '');
                if (!cNom || nombresProcesados.has(cNom)) continue;

                const yaExiste = listaPacientes.some(lp => normalizarTexto(lp.nombre) === cNom);
                if (yaExiste) continue;

                nombresProcesados.add(cNom);
                const idStr = String(c.id);
                const fichaGuardada = fichasGuardadas[idStr] || fichasGuardadas[cNom];

                if (fichaGuardada) {
                    const resumenCorto = fichaGuardada.resumen
                        ? (fichaGuardada.resumen.length > 55 ? `${fichaGuardada.resumen.slice(0, 55).trim()}...` : fichaGuardada.resumen)
                        : 'Ficha clínica actualizada.';
                    listaPacientes.push({
                        id: c.id,
                        nombre: c.paciente,
                        edad: 28,
                        diagnostico: fichaGuardada.diagnostico || 'Atención Realizada',
                        resumen: resumenCorto,
                        diagnosticoCompleto: fichaGuardada.diagnosticoCompleto,
                        tieneAtencion: true,
                        tieneCita: true
                    });
                } else {
                    const motivo = c.motivo || 'Consulta médica general';
                    const sintomasCortos = motivo.length > 55 ? `${motivo.slice(0, 55).trim()}...` : motivo;

                    listaPacientes.push({
                        id: c.id,
                        nombre: c.paciente,
                        edad: 28,
                        diagnostico: 'Pendiente de atención',
                        resumen: `Síntomas: ${sintomasCortos}`,
                        diagnosticoCompleto: `Paciente agendado para consulta médica en MedCareAI.\n\n` +
                            `• Cita Programada: ${c.fecha || 'Fecha programada'} a las ${c.hora || ''} (Box ${c.box || 1})\n` +
                            `• Motivo / Síntomas completos: "${motivo}"\n\n` +
                            `Estado de Atención: En espera de primera evaluación clínica.\n` +
                            `El paciente aún no cuenta con diagnósticos médicos previos finalizados en el sistema. Presione "Registrar Diagnóstico" para ingresar la evolución médica correspondiente.`,
                        tieneAtencion: false,
                        tieneCita: true
                    });
                }
            }

            setPacientes(listaPacientes);
        } catch (error: any) {
            console.error('Error al cargar pacientes:', error);
            toast.error('Error al cargar información de pacientes');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPacientes();
    }, []);

    const pacientesFiltrados = useMemo(() => {
        return pacientes.filter((p) => {
            const query = normalizarTexto(busqueda);
            const nombreNorm = normalizarTexto(p.nombre);
            const rutNorm = normalizarTexto(p.rut || '').replace(/[.\-]/g, '');
            const queryRut = query.replace(/[.\-]/g, '');

            const coincideBusqueda = !query || nombreNorm.includes(query) || (rutNorm && rutNorm.includes(queryRut));
            if (!coincideBusqueda) return false;

            if (filtro === 'con-cita') return p.tieneCita;
            if (filtro === 'con-diagnostico') return p.tieneAtencion;
            if (filtro === 'pendiente') return !p.tieneAtencion;
            return true;
        });
    }, [pacientes, busqueda, filtro]);

    const abrirModal = (paciente: Paciente) => {
        setPacienteSeleccionado(paciente);
        setModoEdicion(false);
        setDiagnosticoEditado(paciente.tieneAtencion ? paciente.diagnostico : "");
        setEvolucionEditada(paciente.tieneAtencion ? paciente.diagnosticoCompleto : "");
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setPacienteSeleccionado(null);
        setModoEdicion(false);
    };

    const iniciarEdicion = () => {
        if (!pacienteSeleccionado) return;
        setDiagnosticoEditado(pacienteSeleccionado.tieneAtencion ? pacienteSeleccionado.diagnostico : "");
        setEvolucionEditada(pacienteSeleccionado.tieneAtencion ? pacienteSeleccionado.diagnosticoCompleto : "");
        setModoEdicion(true);
    };

    const guardarFicha = () => {
        if (!pacienteSeleccionado) return;
        const diag = diagnosticoEditado.trim();
        const evol = evolucionEditada.trim();

        if (!diag) {
            toast.warning('Por favor ingresa un diagnóstico principal.');
            return;
        }

        try {
            let fichasGuardadas: Record<string, any> = {};
            try {
                const raw = localStorage.getItem(LOCAL_FICHAS_KEY);
                if (raw) fichasGuardadas = JSON.parse(raw);
            } catch {
                // Ignorar
            }

            const resumenCorto = evol.length > 80 ? evol.slice(0, 80) + '...' : (evol || diag);
            const idKey = String(pacienteSeleccionado.id);
            const nombreKey = normalizarTexto(pacienteSeleccionado.nombre);

            const nuevaFicha = {
                pacienteId: pacienteSeleccionado.id,
                pacienteNombre: pacienteSeleccionado.nombre,
                diagnostico: diag,
                resumen: resumenCorto,
                diagnosticoCompleto: evol || `Diagnóstico: ${diag}. Sin observaciones adicionales.`,
                fechaActualizacion: new Date().toISOString()
            };

            fichasGuardadas[idKey] = nuevaFicha;
            fichasGuardadas[nombreKey] = nuevaFicha;
            localStorage.setItem(LOCAL_FICHAS_KEY, JSON.stringify(fichasGuardadas));

            const pacienteActualizado: Paciente = {
                ...pacienteSeleccionado,
                diagnostico: diag,
                resumen: resumenCorto,
                diagnosticoCompleto: nuevaFicha.diagnosticoCompleto,
                tieneAtencion: true
            };

            setPacienteSeleccionado(pacienteActualizado);
            setPacientes(prev => prev.map(p => p.id === pacienteActualizado.id ? pacienteActualizado : p));
            setModoEdicion(false);
            toast.success('¡Ficha clínica actualizada exitosamente!');
        } catch (err: any) {
            toast.error(`Error al guardar ficha clínica: ${err.message}`);
        }
    };

    return(
        <>
        <div className="ContenedorPrincipal-ResumenMedico">
            <div className="ContenedorSuperior-ResumenMedico">
                <div className="ContenedorSuperior-Izquierda">
                    <h1>Resumen Pacientes</h1>
                </div>

                <div className="ContenedorSuperior-Derecha">
                    <div className="Contenedor-FiltradoPaciente">
                        <select 
                            id="filtro-rol"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        >
                            <option value="todos">Todos los pacientes</option>
                            <option value="con-cita">Con cita agendada</option>
                            <option value="con-diagnostico">Atendidos (con ficha)</option>
                            <option value="pendiente">Pendientes de atención</option>
                        </select>
                    </div>
                    <div className="Contenedor-BuscadorPaciente">
                        <FaSearch className="Icono-Buscador"/>
                        <input 
                            type="text" 
                            placeholder="Buscar paciente o RUT..." 
                            id="buscador" 
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="ContenedorInferior-ResumenMedico">
                <div className="Contenedor-ListadoResumen">
                    {cargando ? (
                        <div className="Listado-Resumen-Vacio">
                            <p>Cargando información de pacientes...</p>
                        </div>
                    ) : pacientesFiltrados.length === 0 ? (
                        <div className="Listado-Resumen-Vacio">
                            <p>No se encontraron pacientes que coincidan con la búsqueda o filtro.</p>
                        </div>
                    ) : (
                        pacientesFiltrados.map((paciente) => (
                            <div className="Tarjeta-Resumen" key={paciente.id}>
                                <h3>{paciente.nombre}</h3>
                                <p className="Edad-Paciente">Edad: {paciente.edad} años</p>
                                <div className="Contenedor-InformacionPaciente">
                                    <span className="Diagnostico">{paciente.diagnostico}</span>
                                    <p>{paciente.resumen}</p>
                                </div>
                                <button className="Btn-VerMas" onClick={() => abrirModal(paciente)}>
                                    Ver ficha clínica
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {modalAbierto && pacienteSeleccionado && (
            <div className="Modal-FondoOscuro" onClick={cerrarModal}>
                <div className="Modal-Caja" onClick={(e) => e.stopPropagation()}>
                    <div className="Modal-Cabecera">
                        <h2>Ficha Clínica Completa</h2>
                        <button className="Btn-CerrarModal" onClick={cerrarModal}>X</button>
                    </div>
                    
                    <div className="Modal-Cuerpo">
                        <p><strong>Paciente:</strong> {pacienteSeleccionado.nombre}</p>
                        <p><strong>Edad:</strong> {pacienteSeleccionado.edad} años</p>
                        {pacienteSeleccionado.rut && <p><strong>RUT:</strong> {pacienteSeleccionado.rut}</p>}
                        
                        {!modoEdicion ? (
                            <>
                                <p><strong>Diagnóstico Principal:</strong> {pacienteSeleccionado.diagnostico}</p>
                                
                                <div className="Diagnostico-Completo-Caja">
                                    <h4>Evolución y Diagnóstico Detallado</h4>
                                    <p style={{ whiteSpace: 'pre-line' }}>{pacienteSeleccionado.diagnosticoCompleto}</p>
                                </div>
                            </>
                        ) : (
                            <div className="Formulario-Edicion-Ficha">
                                <div className="Campo-Edicion-Ficha">
                                    <label>Diagnóstico Principal:</label>
                                    <input 
                                        type="text" 
                                        value={diagnosticoEditado} 
                                        onChange={(e) => setDiagnosticoEditado(e.target.value)}
                                        placeholder="Ej: Faringitis aguda / Lumbalgia mecánica"
                                    />
                                </div>
                                <div className="Campo-Edicion-Ficha">
                                    <label>Evolución y Diagnóstico Detallado:</label>
                                    <textarea 
                                        rows={6}
                                        value={evolucionEditada} 
                                        onChange={(e) => setEvolucionEditada(e.target.value)}
                                        placeholder="Describa la evolución del paciente, examen físico, indicaciones y tratamiento..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="Modal-Pie">
                        {!modoEdicion ? (
                            <>
                                <button className="Btn-Secundario" onClick={iniciarEdicion}>
                                    {pacienteSeleccionado.tieneAtencion ? 'Editar Ficha' : 'Registrar Diagnóstico'}
                                </button>
                                <button className="Btn-Accion" onClick={cerrarModal}>
                                    Cerrar
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="Btn-Secundario" onClick={() => setModoEdicion(false)}>
                                    Cancelar
                                </button>
                                <button className="Btn-Accion" onClick={guardarFicha}>
                                    Guardar Ficha
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default ResumenPageMedico;
