import { useState } from "react";
import "./GestionBoxes.css";
import { ModalBox, type Box } from "../../../Components/ModalBox/ModalBox.tsx";

const MOCK_BOXES: Box[] = [
    { id: 1, nombre: "Box 1"},
    { id: 2, nombre: "Box 2"},
    { id: 3, nombre: "Box 3" },
    { id: 4, nombre: "Box 4"},
    { id: 5, nombre: "Box 5"},
    { id: 6, nombre: "Box 6" },
];

function GestionBoxesAdminitrador(){
    const [boxes, setBoxes] = useState<Box[]>(MOCK_BOXES);
    const [modalAbierto, setModalAbierto] = useState<boolean>(false);
    const [boxEditando, setBoxEditando] = useState<Box | null>(null);

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

    const manejarGuardarBox = (boxGuardado: Box) => {
        if (boxEditando) {
            setBoxes(prev =>
                prev.map(b => (b.id === boxGuardado.id ? boxGuardado : b))
            );
        } else {
            setBoxes(prev => [...prev, boxGuardado]);
        }

        cerrarModal();
    };

    const eliminarBox = (id: number) => {
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
                {boxes.map((box) => (
                    <div className="CardBox" key={box.id}>
                        <div className="CardBox-Superior">
                            <h2>{box.nombre}</h2>
                        </div>
                        <div className="CardBox-Inferior">
                            <button type="button" onClick={() => abrirModalEditar(box)}>Editar</button>
                            <button type="button" onClick={() => eliminarBox(box.id)}>Eliminar</button>
                        </div>
                    </div>
                ))}
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