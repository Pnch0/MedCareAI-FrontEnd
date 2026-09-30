import { useState } from "react";
import "./GestionBoxes.css";

type Box = {
    id: number;
    nombre: string;
    estado: string;
}

const MOCK_BOXES: Box[] = [
    { id: 1, nombre: "Box 1", estado: "Activo" },
    { id: 2, nombre: "Box 2", estado: "Activo" },
    { id: 3, nombre: "Box 3", estado: "Inactivo" },
    { id: 4, nombre: "Box 4", estado: "Activo" },
    { id: 5, nombre: "Box 5", estado: "Activo" },
    { id: 6, nombre: "Box 6", estado: "Inactivo" },
];

function GestionBoxesAdminitrador(){
    const [boxes] = useState<Box[]>(MOCK_BOXES);

    return(
        <>
        <div className="ContenedorPrincipal-GestionBoxes">
            <div className="ContenedorSuperior-GestionBoxes">
                <div className="ContenendorTitulo-GestionBoxes">
                    <h1>Gestión de Boxes</h1>
                </div>
                <div className="ContenedorBoton-GestionBoxes">
                    <button>Añadir Box</button>
                </div>
            </div>
            <div className="ContenedorInferior-GestionBoxes">
                {boxes.map((box) => (
                    <div className={`CardBox ${box.estado.toLowerCase()}`} key={box.id}>
                        <div className="CardBox-Superior">
                            <h2>{box.nombre}</h2>
                            <h3>{box.estado}</h3>
                        </div>
                        <div className="CardBox-Inferior">
                            <button>Editar</button>
                            <button>Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    )

}

export default GestionBoxesAdminitrador;