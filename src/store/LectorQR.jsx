import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import LZString from 'lz-string';
import { useGlobalState } from '../store/GlobalContext';

export default function LectorQR() {
  const { fusionarDatos } = useGlobalState();
  const [escaneando, setEscaneando] = useState(true);

  const handleScan = (detectedCodes) => {
    if (detectedCodes.length > 0) {
      setEscaneando(false);
      try {
        const textoComprimido = detectedCodes[0].rawValue;
        // Descomprimimos lo que leemos del QR
        const jsonString = LZString.decompressFromEncodedURIComponent(textoComprimido);
        const datos = JSON.parse(jsonString);
        
        // Llamamos a la lógica de GlobalContext
        fusionarDatos(datos);
      } catch (error) {
        alert("El código QR no es válido o está corrupto.");
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Escanea el QR de tu otro móvil</h3>
      {escaneando ? (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <Scanner onScan={handleScan} />
        </div>
      ) : (
        <button onClick={() => setEscaneando(true)}>Volver a escanear</button>
      )}
    </div>
  );
}