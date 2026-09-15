import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import './ComboboxSeguro.css';

const OPCIONES_SEGURO: readonly string[] = [
  'Fonasa',
  'Banmédica',
  'Consalud',
  'CruzBlanca',
  'Colmena',
  'Nueva Masvida',
  'Vida Tres',
  'EsSalud',
  'Sanitas',
  'Sura',
  'Mapfre',
  'Particular / Sin seguro',
  'Otro'
];

interface ComboboxSeguroProps {
  value: string;
  onChange: (value: string) => void;
}

function ComboboxSeguro({ value, onChange }: ComboboxSeguroProps) {
  const [query, setQuery] = useState<string>(value || '');
  const [abierto, setAbierto] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filtrados = OPCIONES_SEGURO.filter((opcion) =>
    opcion.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickAfuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const handleSelect = (opcion: string) => {
    setQuery(opcion);
    onChange(opcion);
    setAbierto(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;
    setQuery(nuevoValor);
    onChange(nuevoValor);
    setAbierto(true);
  };

  return (
    <div className="Combobox-Wrapper" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Buscar seguro médico..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => setAbierto(true)}
        className="Combobox-Input"
        autoComplete="off"
        required
      />

      {abierto && (
        <ul className="Combobox-Menu">
          {filtrados.length > 0 ? (
            filtrados.map((opcion) => (
              <li
                key={opcion}
                onClick={() => handleSelect(opcion)}
                className={`Combobox-Opcion ${opcion === value ? 'seleccionada' : ''}`}
              >
                {opcion}
              </li>
            ))
          ) : (
            <li className="Combobox-SinResultados">No se encontraron resultados</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default ComboboxSeguro;