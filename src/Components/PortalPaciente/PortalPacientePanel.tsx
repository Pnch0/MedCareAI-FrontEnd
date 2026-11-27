import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    FaBell,
    FaCalendarAlt,
    FaCalendarCheck,
    FaClock,
    FaHourglassHalf,
    FaShieldAlt,
    FaTimesCircle
} from 'react-icons/fa';
import { obtenerCatalogoMedicos, type Medico } from '../../Services/catalogoMedico.ts';
import {
    actualizarPreferenciasNotificacionPaciente,
    cancelarMiCitaPaciente,
    obtenerMisCitasPaciente,
    obtenerOpcionesReagendarPaciente,
    obtenerPreferenciasNotificacionPaciente,
    reagendarMiCitaPaciente,
    revocarComunicacionesPaciente,
    type NotificationChannelType,
    type PatientAppointmentItem,
    type PatientRescheduleOption
} from '../../Services/patientPortalService.ts';
import {
    aceptarOfertaListaEspera,
    obtenerMiListaEspera,
    obtenerMisOfertasListaEspera,
    rechazarOfertaListaEspera,
    salirListaEspera,
    unirseListaEspera,
    type WaitingListEntryItem,
    type WaitingListOfferItem
} from '../../Services/waitingListService.ts';
import './PortalPacientePanel.css';

type TabPortal = 'citas' | 'privacidad' | 'espera';

export const PortalPacientePanel: React.FC = () => {
    const [tabActiva, setTabActiva] = useState<TabPortal>('citas');

    // Tab 1: Mis Citas
    const [citas, setCitas] = useState<PatientAppointmentItem[]>([]);
    const [cargandoCitas, setCargandoCitas] = useState<boolean>(false);
    const [includePast, setIncludePast] = useState<boolean>(false);
    const [citaACancelar, setCitaACancelar] = useState<PatientAppointmentItem | null>(null);
    const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');
    const [citaAReagendar, setCitaAReagendar] = useState<PatientAppointmentItem | null>(null);
    const [opcionesReagendar, setOpcionesReagendar] = useState<PatientRescheduleOption[]>([]);
    const [cargandoOpciones, setCargandoOpciones] = useState<boolean>(false);
    const [slotElegidoId, setSlotElegidoId] = useState<string>('');
    const [procesandoCita, setProcesandoCita] = useState<boolean>(false);

    // Tab 2: Privacidad y Notificaciones (Ley 21.719)
    const [preferredChannel, setPreferredChannel] = useState<NotificationChannelType>('Email');
    const [whatsAppOptIn, setWhatsAppOptIn] = useState<boolean>(false);
    const [isOptedOut, setIsOptedOut] = useState<boolean>(false);
    const [cargandoPrefs, setCargandoPrefs] = useState<boolean>(false);
    const [guardandoPrefs, setGuardandoPrefs] = useState<boolean>(false);
    const [confirmarOptOutAbierto, setConfirmarOptOutAbierto] = useState<boolean>(false);

    // Tab 3: Lista de Espera y Ofertas
    const [entradasEspera, setEntradasEspera] = useState<WaitingListEntryItem[]>([]);
    const [ofertas, setOfertas] = useState<WaitingListOfferItem[]>([]);
    const [medicos, setMedicos] = useState<Medico[]>([]);
    const [especialidades, setEspecialidades] = useState<string[]>(['Medicina General']);
    const [especialidadSel, setEspecialidadSel] = useState<string>('Medicina General');
    const [medicoPreferidoId, setMedicoPreferidoId] = useState<string>('');
    const [cargandoEspera, setCargandoEspera] = useState<boolean>(false);
    const [procesandoEspera, setProcesandoEspera] = useState<boolean>(false);

    const recargarCitas = useCallback(async (verPasadas: boolean = includePast): Promise<void> => {
        setCargandoCitas(true);
        try {
            const lista = await obtenerMisCitasPaciente(verPasadas);
            setCitas(lista);
        } catch (err: unknown) {
            console.warn('No se pudieron cargar citas del paciente:', err);
        } finally {
            setCargandoCitas(false);
        }
    }, [includePast]);

    const recargarPreferencias = useCallback(async (): Promise<void> => {
        setCargandoPrefs(true);
        try {
            const prefs = await obtenerPreferenciasNotificacionPaciente();
            setPreferredChannel(prefs.preferredChannel);
            setWhatsAppOptIn(prefs.whatsAppOptIn);
            setIsOptedOut(prefs.isOptedOut);
        } catch (err: unknown) {
            console.warn('No se pudieron cargar preferencias de notificación:', err);
        } finally {
            setCargandoPrefs(false);
        }
    }, []);

    const recargarListaEspera = useCallback(async (): Promise<void> => {
        setCargandoEspera(true);
        try {
            const [lista, ofertasActivas] = await Promise.all([
                obtenerMiListaEspera(),
                obtenerMisOfertasListaEspera()
            ]);
            setEntradasEspera(lista);
            setOfertas(ofertasActivas);
        } catch (err: unknown) {
            console.warn('No se pudo cargar lista de espera:', err);
        } finally {
            setCargandoEspera(false);
        }
    }, []);

    useEffect(() => {
        let activo = true;
        const iniciar = async (): Promise<void> => {
            try {
                const [citasRes, prefsRes, listaRes, ofertasRes, catalogoRes] = await Promise.allSettled([
                    obtenerMisCitasPaciente(false),
                    obtenerPreferenciasNotificacionPaciente(),
                    obtenerMiListaEspera(),
                    obtenerMisOfertasListaEspera(),
                    obtenerCatalogoMedicos()
                ]);
                if (!activo) return;

                if (citasRes.status === 'fulfilled') setCitas(citasRes.value);
                if (prefsRes.status === 'fulfilled') {
                    setPreferredChannel(prefsRes.value.preferredChannel);
                    setWhatsAppOptIn(prefsRes.value.whatsAppOptIn);
                    setIsOptedOut(prefsRes.value.isOptedOut);
                }
                if (listaRes.status === 'fulfilled') setEntradasEspera(listaRes.value);
                if (ofertasRes.status === 'fulfilled') setOfertas(ofertasRes.value);
                if (catalogoRes.status === 'fulfilled') {
                    setMedicos(catalogoRes.value.medicos);
                    if (catalogoRes.value.especialidades.length > 0) {
                        const nombresEsp = catalogoRes.value.especialidades.map((e) => e.nombre);
                        setEspecialidades(nombresEsp);
                        setEspecialidadSel(nombresEsp[0]);
                    }
                }
            } catch {
                // Errores individuales manejados por Promise.allSettled
            }
        };

        void iniciar();
        return () => {
            activo = false;
        };
    }, []);

    const abrirModalReagendar = async (cita: PatientAppointmentItem): Promise<void> => {
        setCitaAReagendar(cita);
        setSlotElegidoId('');
        setOpcionesReagendar([]);
        setCargandoOpciones(true);
        try {
            const opciones = await obtenerOpcionesReagendarPaciente(cita.id);
            setOpcionesReagendar(opciones);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudieron cargar opciones de reagendamiento.'
            );
        } finally {
            setCargandoOpciones(false);
        }
    };

    const confirmarCancelacion = async (): Promise<void> => {
        if (!citaACancelar || procesandoCita) return;
        setProcesandoCita(true);
        try {
            await cancelarMiCitaPaciente(citaACancelar.id, motivoCancelacion);
            toast.success('Cita cancelada correctamente.');
            setCitaACancelar(null);
            setMotivoCancelacion('');
            await recargarCitas();
        } catch (err: unknown) {
            toast.error(err instanceof Error && err.message ? err.message : 'No se pudo cancelar la cita.');
        } finally {
            setProcesandoCita(false);
        }
    };

    const confirmarReagendamiento = async (): Promise<void> => {
        if (!citaAReagendar || !slotElegidoId || procesandoCita) return;
        setProcesandoCita(true);
        try {
            await reagendarMiCitaPaciente(citaAReagendar.id, slotElegidoId);
            toast.success('Cita reagendada correctamente.');
            setCitaAReagendar(null);
            await recargarCitas();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message ? err.message : 'No se pudo reagendar la cita.'
            );
        } finally {
            setProcesandoCita(false);
        }
    };

    const guardarPreferencias = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (guardandoPrefs) return;
        setGuardandoPrefs(true);
        try {
            const actualizadas = await actualizarPreferenciasNotificacionPaciente({
                preferredChannel,
                whatsAppOptIn,
                source: 'patient_portal'
            });
            setPreferredChannel(actualizadas.preferredChannel);
            setWhatsAppOptIn(actualizadas.whatsAppOptIn);
            setIsOptedOut(actualizadas.isOptedOut);
            toast.success('Preferencias de privacidad y notificación guardadas.');
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudieron guardar las preferencias.'
            );
        } finally {
            setGuardandoPrefs(false);
        }
    };

    const confirmarOptOut = async (): Promise<void> => {
        if (guardandoPrefs) return;
        setGuardandoPrefs(true);
        try {
            await revocarComunicacionesPaciente('patient_portal');
            setIsOptedOut(true);
            setWhatsAppOptIn(false);
            setConfirmarOptOutAbierto(false);
            toast.success('Comunicaciones revocadas (Opt-Out registrado según Ley 21.719).');
            await recargarPreferencias();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo registrar la revocación.'
            );
        } finally {
            setGuardandoPrefs(false);
        }
    };

    const manejarUnirseListaEspera = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (procesandoEspera || !especialidadSel) return;
        setProcesandoEspera(true);
        try {
            await unirseListaEspera({
                specialty: especialidadSel,
                preferredStaffId: medicoPreferidoId || null
            });
            toast.success('Te has inscrito en la lista de espera.');
            await recargarListaEspera();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo inscribir en la lista de espera.'
            );
        } finally {
            setProcesandoEspera(false);
        }
    };

    const manejarSalirListaEspera = async (id: string): Promise<void> => {
        if (procesandoEspera) return;
        setProcesandoEspera(true);
        try {
            await salirListaEspera(id, 'Retiro voluntario desde portal');
            toast.info('Has salido de la lista de espera.');
            await recargarListaEspera();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo retirar la solicitud.'
            );
        } finally {
            setProcesandoEspera(false);
        }
    };

    const manejarAceptarOferta = async (offerId: string): Promise<void> => {
        if (procesandoEspera) return;
        setProcesandoEspera(true);
        try {
            await aceptarOfertaListaEspera(offerId);
            toast.success('¡Cupo adelantado aceptado y cita confirmada!');
            await Promise.all([recargarListaEspera(), recargarCitas()]);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo aceptar la oferta.'
            );
        } finally {
            setProcesandoEspera(false);
        }
    };

    const manejarRechazarOferta = async (offerId: string): Promise<void> => {
        if (procesandoEspera) return;
        setProcesandoEspera(true);
        try {
            await rechazarOfertaListaEspera(offerId);
            toast.info('Oferta rechazada.');
            await recargarListaEspera();
        } catch (err: unknown) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : 'No se pudo rechazar la oferta.'
            );
        } finally {
            setProcesandoEspera(false);
        }
    };

    return (
        <section className="PortalPaciente-Wrapper" aria-label="Portal del Paciente">
            <header className="PortalPaciente-Header">
                <div>
                    <h2>Mi Portal de Atención</h2>
                    <p>Gestiona tus citas médicas, lista de espera y consentimiento de comunicaciones</p>
                </div>
            </header>

            <nav className="PortalPaciente-Tabs" role="tablist" aria-label="Secciones del portal">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === 'citas'}
                    className={`PortalPaciente-TabBtn ${tabActiva === 'citas' ? 'activo' : ''}`}
                    onClick={() => setTabActiva('citas')}
                >
                    <FaCalendarAlt aria-hidden="true" />
                    Mis Citas
                    <span className="PortalPaciente-Pill">{citas.length}</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === 'privacidad'}
                    className={`PortalPaciente-TabBtn ${tabActiva === 'privacidad' ? 'activo' : ''}`}
                    onClick={() => setTabActiva('privacidad')}
                >
                    <FaShieldAlt aria-hidden="true" />
                    Privacidad y Notificaciones (Ley 21.719)
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === 'espera'}
                    className={`PortalPaciente-TabBtn ${tabActiva === 'espera' ? 'activo' : ''}`}
                    onClick={() => setTabActiva('espera')}
                >
                    <FaHourglassHalf aria-hidden="true" />
                    Lista de Espera y Ofertas
                    {ofertas.length > 0 && (
                        <span className="PortalPaciente-Pill alerta">{ofertas.length}</span>
                    )}
                </button>
            </nav>

            <div className="PortalPaciente-Body">
                {/* TAB 1: MIS CITAS */}
                {tabActiva === 'citas' && (
                    <>
                        <label className="PortalCheckbox">
                            <input
                                type="checkbox"
                                checked={includePast}
                                onChange={(e) => {
                                    const val = e.target.checked;
                                    setIncludePast(val);
                                    void recargarCitas(val);
                                }}
                            />
                            Incluir citas pasadas
                        </label>

                        {cargandoCitas ? (
                            <div className="PortalEmpty">Cargando tus citas médicas...</div>
                        ) : citas.length === 0 ? (
                            <div className="PortalEmpty">
                                No tienes citas registradas en este momento. Puedes agendar una desde
                                &quot;Reservar Hora&quot;.
                            </div>
                        ) : (
                            <div className="PortalGrid-Cards">
                                {citas.map((cita) => {
                                    const stLower = cita.status.toLowerCase();
                                    const cancelada =
                                        stLower.includes('cancel') || stLower.includes('final');
                                    return (
                                        <article key={cita.id} className="PortalCard">
                                            <div className="PortalCard-Top">
                                                <h3>{cita.specialty}</h3>
                                                <span
                                                    className={`PortalBadge ${
                                                        cancelada
                                                            ? 'cancelada'
                                                            : stLower.includes('confirm')
                                                            ? 'confirmada'
                                                            : ''
                                                    }`}
                                                >
                                                    {cita.status}
                                                </span>
                                            </div>
                                            <div className="PortalCard-Meta">
                                                <span>
                                                    <strong>Fecha:</strong> {cita.dateLocal} ·{' '}
                                                    {cita.timeLocal}
                                                </span>
                                                <span>
                                                    <strong>Profesional:</strong> {cita.staffName}
                                                </span>
                                                <span>
                                                    <strong>Box:</strong> {cita.boxName}
                                                </span>
                                                <span>
                                                    <strong>Confirmación:</strong>{' '}
                                                    {cita.confirmationState}
                                                </span>
                                            </div>
                                            {!cancelada && (
                                                <div className="PortalCard-Actions">
                                                    <button
                                                        type="button"
                                                        className="PortalBtn PortalBtn-Primary"
                                                        onClick={() => void abrirModalReagendar(cita)}
                                                    >
                                                        <FaClock aria-hidden="true" />
                                                        Reagendar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="PortalBtn PortalBtn-Danger"
                                                        onClick={() => setCitaACancelar(cita)}
                                                    >
                                                        <FaTimesCircle aria-hidden="true" />
                                                        Cancelar
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* TAB 2: PRIVACIDAD Y NOTIFICACIONES (LEY 21.719) */}
                {tabActiva === 'privacidad' && (
                    <form className="PortalForm-Box" onSubmit={(e) => void guardarPreferencias(e)}>
                        <div className="PortalLeyBox">
                            <FaShieldAlt aria-hidden="true" />{' '}
                            <strong>Protección de Datos (Ley 21.719):</strong> Tú decides por qué canal
                            recibir recordatorios operativos y ofertas de adelanto de hora. Puedes
                            revocar tu consentimiento en cualquier momento.
                        </div>

                        {cargandoPrefs ? (
                            <div className="PortalEmpty">Cargando preferencias...</div>
                        ) : (
                            <>
                                <div className="PortalForm-Row">
                                    <label className="PortalField">
                                        Canal preferido de notificación:
                                        <select
                                            className="PortalSelect"
                                            value={preferredChannel}
                                            onChange={(e) =>
                                                setPreferredChannel(
                                                    e.target.value as NotificationChannelType
                                                )
                                            }
                                            disabled={guardandoPrefs}
                                        >
                                            <option value="Email">Correo Electrónico (Email)</option>
                                            <option value="WhatsApp">WhatsApp</option>
                                        </select>
                                    </label>
                                </div>

                                <label className="PortalCheckbox">
                                    <input
                                        type="checkbox"
                                        checked={whatsAppOptIn}
                                        onChange={(e) => setWhatsAppOptIn(e.target.checked)}
                                        disabled={guardandoPrefs}
                                    />
                                    Autorizo recibir recordatorios y ofertas de lista de espera vía
                                    WhatsApp.
                                </label>

                                {isOptedOut && (
                                    <div className="PortalBadge cancelada" style={{ width: 'fit-content' }}>
                                        Estado actual: Comunicaciones revocadas (Opt-Out activo)
                                    </div>
                                )}

                                <div className="PortalCard-Actions">
                                    <button
                                        type="submit"
                                        className="PortalBtn PortalBtn-Primary"
                                        disabled={guardandoPrefs}
                                    >
                                        <FaBell aria-hidden="true" />
                                        {guardandoPrefs ? 'Guardando...' : 'Guardar Preferencias'}
                                    </button>
                                    <button
                                        type="button"
                                        className="PortalBtn PortalBtn-Danger"
                                        disabled={guardandoPrefs}
                                        onClick={() => setConfirmarOptOutAbierto(true)}
                                    >
                                        Revocar comunicaciones
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                )}

                {/* TAB 3: LISTA DE ESPERA Y OFERTAS */}
                {tabActiva === 'espera' && (
                    <>
                        {ofertas.length > 0 &&
                            ofertas.map((oferta) => (
                                <div key={oferta.id} className="PortalOferta-Banner" role="status">
                                    <div className="PortalOferta-Header">
                                        <span className="PortalOferta-Badge">
                                            <FaCalendarCheck aria-hidden="true" />
                                            ¡Cupo adelantado disponible!
                                        </span>
                                        <span className="PortalBadge">{oferta.status}</span>
                                    </div>
                                    <div className="PortalOferta-Info">
                                        <strong>{oferta.specialty}</strong> · {oferta.dateLocal} a las{' '}
                                        <strong>{oferta.timeLocal}</strong> ({oferta.staffName})
                                    </div>
                                    <div className="PortalOferta-Actions">
                                        <button
                                            type="button"
                                            className="PortalBtn PortalBtn-Confirm"
                                            disabled={procesandoEspera}
                                            onClick={() => void manejarAceptarOferta(oferta.id)}
                                        >
                                            Aceptar Cupo
                                        </button>
                                        <button
                                            type="button"
                                            className="PortalBtn PortalBtn-Danger"
                                            disabled={procesandoEspera}
                                            onClick={() => void manejarRechazarOferta(oferta.id)}
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}

                        <form
                            className="PortalForm-Box"
                            onSubmit={(e) => void manejarUnirseListaEspera(e)}
                        >
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                Unirme a Lista de Espera
                            </h3>
                            <div className="PortalForm-Row">
                                <label className="PortalField">
                                    Especialidad:
                                    <select
                                        className="PortalSelect"
                                        value={especialidadSel}
                                        onChange={(e) => setEspecialidadSel(e.target.value)}
                                        disabled={procesandoEspera}
                                    >
                                        {especialidades.map((esp) => (
                                            <option key={esp} value={esp}>
                                                {esp}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="PortalField">
                                    Médico preferido (opcional):
                                    <select
                                        className="PortalSelect"
                                        value={medicoPreferidoId}
                                        onChange={(e) => setMedicoPreferidoId(e.target.value)}
                                        disabled={procesandoEspera}
                                    >
                                        <option value="">Cualquier profesional</option>
                                        {medicos.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                Dr(a). {m.nombre} {m.apellido} ({m.especialidad})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="PortalBtn PortalBtn-Primary"
                                    disabled={procesandoEspera}
                                >
                                    {procesandoEspera ? 'Inscribiendo...' : 'Unirse a Lista de Espera'}
                                </button>
                            </div>
                        </form>

                        {cargandoEspera ? (
                            <div className="PortalEmpty">Cargando tu lista de espera...</div>
                        ) : entradasEspera.length === 0 ? (
                            <div className="PortalEmpty">
                                No tienes solicitudes activas en lista de espera.
                            </div>
                        ) : (
                            <div className="PortalGrid-Cards">
                                {entradasEspera.map((entry) => (
                                    <article key={entry.id} className="PortalCard">
                                        <div className="PortalCard-Top">
                                            <h3>{entry.specialty}</h3>
                                            <span className="PortalBadge">{entry.status}</span>
                                        </div>
                                        <div className="PortalCard-Meta">
                                            {entry.preferredStaffName && (
                                                <span>
                                                    <strong>Profesional:</strong>{' '}
                                                    {entry.preferredStaffName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="PortalCard-Actions">
                                            <button
                                                type="button"
                                                className="PortalBtn PortalBtn-Danger"
                                                disabled={procesandoEspera}
                                                onClick={() => void manejarSalirListaEspera(entry.id)}
                                            >
                                                Salir
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Cancelar Cita */}
            {citaACancelar && (
                <div
                    className="PortalModal-Backdrop"
                    role="presentation"
                    onClick={() => !procesandoCita && setCitaACancelar(null)}
                >
                    <div
                        className="PortalModal-Card"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>¿Cancelar cita de {citaACancelar.specialty}?</h3>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                            Fecha: {citaACancelar.dateLocal} · {citaACancelar.timeLocal}
                        </p>
                        <label className="PortalField">
                            Motivo (opcional):
                            <input
                                type="text"
                                className="PortalInput"
                                value={motivoCancelacion}
                                onChange={(e) => setMotivoCancelacion(e.target.value)}
                                placeholder="Ej. Cambio de disponibilidad"
                                disabled={procesandoCita}
                            />
                        </label>
                        <div className="PortalModal-Footer">
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-Secondary"
                                onClick={() => setCitaACancelar(null)}
                                disabled={procesandoCita}
                            >
                                Volver
                            </button>
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-DangerSolid"
                                onClick={() => void confirmarCancelacion()}
                                disabled={procesandoCita}
                            >
                                {procesandoCita ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Reagendar Cita */}
            {citaAReagendar && (
                <div
                    className="PortalModal-Backdrop"
                    role="presentation"
                    onClick={() => !procesandoCita && setCitaAReagendar(null)}
                >
                    <div
                        className="PortalModal-Card"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Reagendar {citaAReagendar.specialty}</h3>
                        {cargandoOpciones ? (
                            <div className="PortalEmpty">Buscando horarios disponibles...</div>
                        ) : opcionesReagendar.length === 0 ? (
                            <div className="PortalEmpty">
                                No hay horarios disponibles para reagendar en este momento.
                            </div>
                        ) : (
                            <div className="PortalSlots-List">
                                {opcionesReagendar.map((op) => (
                                    <button
                                        key={op.scheduleBlockId}
                                        type="button"
                                        className={`PortalSlot-Item ${
                                            slotElegidoId === op.scheduleBlockId ? 'activo' : ''
                                        }`}
                                        onClick={() => setSlotElegidoId(op.scheduleBlockId)}
                                    >
                                        <strong>
                                            {op.dateLocal} · {op.timeLocal}
                                        </strong>
                                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                                            {op.staffName} · {op.boxName}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="PortalModal-Footer">
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-Secondary"
                                onClick={() => setCitaAReagendar(null)}
                                disabled={procesandoCita}
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-Primary"
                                disabled={!slotElegidoId || procesandoCita}
                                onClick={() => void confirmarReagendamiento()}
                            >
                                {procesandoCita ? 'Reagendando...' : 'Confirmar Nuevo Horario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Opt-Out */}
            {confirmarOptOutAbierto && (
                <div
                    className="PortalModal-Backdrop"
                    role="presentation"
                    onClick={() => !guardandoPrefs && setConfirmarOptOutAbierto(false)}
                >
                    <div
                        className="PortalModal-Card"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>¿Revocar comunicaciones?</h3>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                            Dejarás de recibir recordatorios automáticos y ofertas de lista de espera
                            conforme a la Ley 21.719.
                        </p>
                        <div className="PortalModal-Footer">
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-Secondary"
                                onClick={() => setConfirmarOptOutAbierto(false)}
                                disabled={guardandoPrefs}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="PortalBtn PortalBtn-DangerSolid"
                                onClick={() => void confirmarOptOut()}
                                disabled={guardandoPrefs}
                            >
                                {guardandoPrefs ? 'Procesando...' : 'Confirmar Opt-Out'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
