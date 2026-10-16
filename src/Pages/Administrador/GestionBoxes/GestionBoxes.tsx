import { useState, useEffect } from "react";
import "./GestionBoxes.css";
import { toast } from "sonner";
import { ModalBox, type Box } from "../../../Components/ModalBox/ModalBox.tsx";
import { apiClient } from "../../../Services/apiClient.ts";

function GestionBoxesAdminitrador(){
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [boxEditando, setBoxEditando] = useState<Box | null>(null);

    const cargarBoxes = async () => {
        try {
            setCargando(true);
            const data = await apiClient('/api/Boxes', { method: 'GET' });
            if (Array.isArray(data)) {
                const listado: Box[] = data.map((item: any) => ({
                    id: item.id || item.boxId || crypto.randomUUID(),
                    nombre: item.name || item.nombre || 'Box',
                    tipo: item.type || item.tipo || 'Consulta General',
                    capacidad: item.capacity || item.capacidad || 1,
                    piso: item.floor || item.piso || 'Piso 1',
                    isActive: item.isActive !== undefined ? item.isActive : true
                }));
                setBoxes(listado);
            }
        } catch (error: any) {
            toast.error(`Error al cargar boxes: ${error.message}`);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarBoxes();
    }, []);

    const abrirModalAñadir = () => {
        setBoxEditando(null);
        setModalAbierto(true);
    };

    const abrirModalEditar = (box: Box) => {
        setBoxEditando(box);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setBoxEditando(null);
    };

    const manejarGuardarBox = async (boxGuardado: Box) => {
        if (boxEditando) {
            try {
                const payload = {
                    boxId: boxGuardado.id,
                    name: boxGuardado.nombre,
                    type: boxGuardado.tipo || "Consulta General",
                    capacity: Number(boxGuardado.capacidad) || 1,
                    floor: boxGuardado.piso || "Piso 1",
                    isActive: boxGuardado.isActive !== undefined ? boxGuardado.isActive : true
                };

                await apiClient(`/api/Boxes/${boxGuardado.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                toast.success('Box actualizado exitosamente');
                await cargarBoxes();
                cerrarModal();
            } catch (error: any) {
                toast.error(`Error al actualizar box: ${error.message}`);
            }
            return;
        }

        try {
            const payload = {
                name: boxGuardado.nombre,
                type: boxGuardado.tipo || "Consulta General",
                capacity: Number(boxGuardado.capacidad) || 1,
                floor: boxGuardado.piso || "Piso 1"
            };

            await apiClient('/api/Boxes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Box creado exitosamente');
            await cargarBoxes();
            cerrarModal();
        } catch (error: any) {
            toast.error(`Error al guardar box: ${error.message}`);
        }
    };

    const eliminarBox = (id: string | number) => {
        const confirmar = window.confirm('¿Estas seguro de eliminar este box?');
        if (confirmar) {
            setBoxes(prev => prev.filter(box => box.id !== id));
        }
    };

    return(
        <>
        <div className="ContenedorPrincipal-GestionBoxes">
            <div className="ContenedorSuperior-GestionBoxes">
                <div className="ContenendorTitulo-GestionBoxes">
                    <h1>Gestión de Boxes</h1>
                </div>
                <div className="ContenedorBoton-GestionBoxes">
                    <button type="button" onClick={abrirModalAñadir}>Añadir Box</button>
                </div>
            </div>
            <div className="ContenedorInferior-GestionBoxes">
                {cargando ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', fontSize: '18px' }}>
                        Cargando boxes...
                    </p>
                ) : boxes.length === 0 ? (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', fontSize: '18px' }}>
                        No hay boxes registrados en la base de datos.
                    </p>
                ) : (
                    boxes.map((box) => (
                        <div className="CardBox" key={box.id}>
                            <div className="CardBox-Superior">
                                <h2>{box.nombre}</h2>
                                {box.piso && <span style={{ fontSize: '14px', color: '#666' }}>{box.piso}</span>}
                                {box.isActive === false && (
                                    <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>Inactivo</span>
                                )}
                            </div>
                            <div className="CardBox-Inferior">
                                <button type="button" onClick={() => abrirModalEditar(box)}>Editar</button>
                                <button type="button" onClick={() => eliminarBox(box.id)}>Eliminar</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <ModalBox
            isOpen={modalAbierto}
            onClose={cerrarModal}
            onGuardar={manejarGuardarBox}
            boxAEditar={boxEditando}
        />
        </>
    )

}

export default GestionBoxesAdminitrador;