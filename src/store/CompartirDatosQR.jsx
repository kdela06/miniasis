import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import { useGlobalState } from '../store/GlobalContext';

export default function CompartirDatosQR() {
  const { tareas, examenes, entregas, planificacion, capacidadExtra } = useGlobalState();

  const datosComprimidos = useMemo(() => {
    // Pro-Tip: Si la app crece mucho, podrías enviar SOLO las tareas no completadas
    // const tareasActivas = tareas.filter(t => !t.completada);
    
    const dataObj = { tareas, examenes, entregas, planificacion, capacidadExtra };
    const jsonString = JSON.stringify(dataObj);
    
    // Comprimimos el JSON para que el QR sea legible
    return LZString.compressToEncodedURIComponent(jsonString);
  }, [tareas, examenes, entregas, planificacion, capacidadExtra]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>Escanea esto desde tu otro móvil</h3>
      {datosComprimidos.length > 2500 ? (
        <p style={{ color: 'red' }}>Advertencia: Tienes demasiados datos para generar un QR estable.</p>
      ) : (
        <QRCodeSVG 
          value={datosComprimidos} 
          size={250} 
          level="L" 
          includeMargin={true}
        />
      )}
    </div>
  );
}