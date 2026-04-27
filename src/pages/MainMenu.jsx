// src/pages/MainMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CalendarDays, ListTodo, FileText, Package, Timer, Plus, Settings, MonitorSmartphone, Search, CheckCircle, QrCode, ScanLine } from 'lucide-react';
import TamagotchiWidget from '../components/TamagotchiWidget';
import UpcomingWidget from '../components/UpcomingWidget'; 
import QuickLinksModal from '../components/QuickLinksModal';
import WebLinkButton from '../components/WebLinkButton'; 
import { useGlobalState } from '../store/GlobalContext';
import CompartirDatosQR from '../store/CompartirDatosQR';
import LectorQR from '../store/LectorQR';

// === PALETA ULTRA CLARA Y SUAVE ===
const theme = {
  bg: '#FDFBF7', 
  cardFrog: '#E4ECD9',    
  cardUpcoming: '#E2EAF4', 
  cardCoral: '#e39178', 
  cardBlue: '#84A7D3',  
  cardYellow: '#DFCA73', 
  cardWhite: '#FFFFFF', 
  border: '#412B2E', 
  textDark: '#412B2E', 
  textMuted: '#968A8B', 
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

export function ModalAjustes({ ESP32_IP, setESP32_IP, onClose }) {
  const { tareas, examenes, entregas, planificacion, capacidadExtra, fusionarDatos } = useGlobalState();
  const [tab, setTab] = useState('hardware'); // Pestañas: 'hardware', 'exportar', 'importar'
  
  // --- Estados del escáner ESP32 ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");

  const fetchConTimeout = (url, tiempo = 1500) => {
    return Promise.race([
      fetch(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), tiempo))
    ]);
  };

  const buscarPlacaEnRed = async () => {
    setIsScanning(true);
    setScanResult("Escaneando red local... (puede tardar 10s)");
    
    const subredes = ['192.168.0', '192.168.1']; 
    let encontrada = false;
    const promesas = [];
    
    for (const subred of subredes) {
      for (let i = 1; i < 255; i++) {
        if (encontrada) break; 
        const testIp = `${subred}.${i}`;
        const p = fetchConTimeout(`http://${testIp}/pair`, 1500)
        .then(res => res.json())
        .then(data => {
            if(data.status === "paired" && !encontrada) {
                encontrada = true;
                setScanResult(`¡Encontrada en ${testIp}!`);
                setESP32_IP(testIp);
                localStorage.setItem('esp32_ip', testIp);
                setTimeout(() => { alert("¡Asistente vinculado correctamente!"); }, 500);
            }
        }).catch(() => {});
        promesas.push(p);
      }
    }

    await Promise.allSettled(promesas);
    if (!encontrada) setScanResult("No encontrada. Verifica estar en el mismo WiFi de 2.4GHz.");
    setIsScanning(false);
  };

  // --- FUNCIÓN PARA DESCARGAR EL ARCHIVO ---
  const exportarArchivo = () => {
    const dataObj = { tareas, examenes, entregas, planificacion, capacidadExtra };
    const jsonString = JSON.stringify(dataObj);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Forzamos la descarga del archivo
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `MimiAssist_Backup_${fecha}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- FUNCIÓN PARA LEER EL ARCHIVO ---
  const importarArchivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const datos = JSON.parse(e.target.result);
        fusionarDatos(datos);
      } catch (error) {
        alert("El archivo no es válido o está corrupto.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(65, 43, 46, 0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: theme.bg, padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '450px', border: `3px solid ${theme.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', color: theme.textDark }}>
            <Settings size={26} /> Ajustes
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', color: theme.textDark }}>X</button>
        </div>

        {/* Sistema de Pestañas */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: theme.cardWhite, padding: '6px', borderRadius: '16px', border: `2px solid ${theme.border}` }}>
           <button onClick={() => setTab('hardware')} style={{ flex: 1, padding: '10px 5px', borderRadius: '12px', border: 'none', backgroundColor: tab === 'hardware' ? theme.cardFrog : 'transparent', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: theme.textDark, transition: 'all 0.2s' }}>
             <MonitorSmartphone size={16}/> Placa
           </button>
           <button onClick={() => setTab('exportar')} style={{ flex: 1, padding: '10px 5px', borderRadius: '12px', border: 'none', backgroundColor: tab === 'exportar' ? theme.cardYellow : 'transparent', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: theme.textDark, transition: 'all 0.2s' }}>
             <QrCode size={16}/> Compartir
           </button>
           <button onClick={() => setTab('importar')} style={{ flex: 1, padding: '10px 5px', borderRadius: '12px', border: 'none', backgroundColor: tab === 'importar' ? theme.cardBlue : 'transparent', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: theme.textDark, transition: 'all 0.2s' }}>
             <ScanLine size={16}/> Escanear
           </button>
        </div>

        {/* CONTENIDO DE LA PESTAÑA SELECCIONADA */}
        
        {/* Pestaña 1: Configuración de la Placa ESP32 */}
        {tab === 'hardware' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ fontWeight: 'bold', color: theme.textMuted }}>IP Actual: {ESP32_IP}</p>
            <button 
              onClick={buscarPlacaEnRed} disabled={isScanning}
              style={{ width: '100%', padding: '15px', backgroundColor: isScanning ? theme.bg : theme.cardUpcoming, border: `2px solid ${theme.border}`, borderRadius: '16px', fontWeight: 900, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: isScanning ? 'wait' : 'pointer', color: theme.textDark, boxShadow: isScanning ? 'none' : `0 3px 0 ${theme.border}` }}
            >
              {isScanning ? <Search size={20}/> : <CheckCircle size={20}/>}
              {isScanning ? "Buscando..." : "Búsqueda Automática"}
            </button>
            <p style={{ marginTop: '15px', fontWeight: 'bold', color: scanResult.includes("Encontrada") ? '#2E7D32' : theme.textDark }}>
              {scanResult}
            </p>
          </div>
        )}

       {/* Pestaña 2: Compartir mediante Archivo (Exportar) */}
        {tab === 'exportar' && (
          <div style={{ textAlign: 'center', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ fontWeight: 700, color: theme.textMuted, fontSize: '0.9rem' }}>
              Descarga tus datos en un archivo. Luego pásatelo al otro móvil (por WhatsApp, Bluetooth...) y ábrelo desde allí.
            </p>
            <button 
              onClick={exportarArchivo}
              style={{ padding: '15px', backgroundColor: theme.cardYellow, border: `3px solid ${theme.border}`, borderRadius: '16px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', color: theme.textDark, boxShadow: `0 4px 0 ${theme.border}` }}
            >
              Descargar copia
            </button>
          </div>
        )}

        {/* Pestaña 3: Escanear Archivo (Importar) */}
        {tab === 'importar' && (
          <div style={{ textAlign: 'center', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <p style={{ fontWeight: 700, color: theme.textMuted, fontSize: '0.9rem' }}>
              Selecciona el archivo `.json` que te has pasado desde tu otro móvil para fusionar los datos.
            </p>
            {/* Input de archivo oculto + Botón visible bonito */}
            <input 
              type="file" 
              accept=".json" 
              id="file-upload" 
              style={{ display: 'none' }} 
              onChange={importarArchivo} 
            />
            <label 
              htmlFor="file-upload"
              style={{ padding: '15px', backgroundColor: theme.cardBlue, border: `3px solid ${theme.border}`, borderRadius: '16px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', color: '#FFF', boxShadow: `0 4px 0 ${theme.border}`, display: 'inline-block' }}
            >
              Cargar copia de otro dispositivo
            </label>
          </div>
        )}

      </div>
    </div>
  );
}

export default function MainMenu() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  
  const { tareas, examenes, entregas } = useGlobalState(); 

  const [quickLinks, setQuickLinks] = useState(() => {
    const saved = localStorage.getItem('miniasis_quicklinks');
    return saved ? JSON.parse(saved) : [];
  });

  const datosDeHoy = { 
    totalTareas: tareas.length, 
    tareasCompletadas: tareas.filter(t => t.completada).length 
  };

  const [ESP32_IP, setESP32_IP] = useState(localStorage.getItem('esp32_ip') || "192.168.0.44");
  // En src/pages/MainMenu.jsx

  useEffect(() => {
    // 1. Capturamos la IP si venimos de la pegatina NFC
    const urlParams = new URLSearchParams(window.location.search);
    const ipDetectada = urlParams.get('ip');
    
    if (ipDetectada) {
        // La guardamos en el móvil para siempre
        localStorage.setItem('esp32_ip', ipDetectada);
        setESP32_IP(ipDetectada);
        
        // 2. Avisamos a la placa para que pase al Menú físico
        fetch(`http://${ipDetectada}/pair`)
        .then(() => console.log("¡Vinculación completada!"))
        .catch(err => console.error("Fallo al avisar a la placa", err));
        
        // Limpiamos la URL para que no se quede el ?ip=... ahí arriba
        window.history.replaceState({}, document.title, "/");
    }
    }, []);

  useEffect(() => {
    const mood = datosDeHoy.tareasCompletadas > 0 ? "FELIZ" : "DORMIDA";
    fetch(`http://${ESP32_IP}/setScreen?screen=TAMAGOTCHI&status=${mood}`).catch(()=>{});
  }, [tareas]);

  useEffect(() => {
    localStorage.setItem('miniasis_quicklinks', JSON.stringify(quickLinks));
  }, [quickLinks]);


  const addQuickLink = (newLink) => {
    setQuickLinks((oldLinks) => [...oldLinks, newLink]);
  };

  const deleteQuickLink = (id) => {
    setQuickLinks((oldLinks) => oldLinks.filter(link => link.id !== id));
  };

  // --- LÓGICA DE PRÓXIMOS EVENTOS ---
  const now = new Date();
  
  // Juntamos exámenes, entregas y tareas (que tengan fecha y no estén completadas)
  const allEvents = [
    ...examenes.map(e => ({ 
      id: `ex-${e.id}`, 
      title: e.titulo, 
      type: 'examen', 
      date: new Date(`${e.fecha}T${e.hora || '23:59'}`) 
    })),
    ...entregas.map(e => ({ 
      id: `en-${e.id}`, 
      title: e.titulo, 
      type: 'entrega', 
      date: new Date(`${e.fecha}T${e.hora || '23:59'}`) 
    })),
    ...tareas.filter(t => t.fecha && !t.completada).map(t => ({ 
      id: `ta-${t.id}`, 
      title: t.titulo, 
      type: 'tarea', 
      date: new Date(`${t.fecha}T${t.hora || '23:59'}`) 
    }))
  ];

  // Filtramos solo los eventos que no han pasado y los ordenamos por cercanía
  const eventosProximosReales = allEvents
    .filter(ev => !isNaN(ev.date) && ev.date >= now)
    .sort((a, b) => a.date - b.date);

  return (
    <div className="app-container" style={{ 
      padding: '24px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      backgroundColor: theme.bg, 
      color: theme.textDark,
      fontFamily: theme.font, 
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button style={{ 
          padding: '10px 18px', 
          borderRadius: '24px', 
          border: `2px solid ${theme.border}`, 
          backgroundColor: theme.cardFrog, 
          color: theme.textDark,
          fontWeight: '700',
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 3px 0 ${theme.border}` 
        }}>
          <LayoutGrid size={16} strokeWidth={2.5} /> Menú
        </button>
      </header>

      {/* SECCIÓN CENTRAL: Tamagotchi y Próximos conectados a datos reales */}
      <section style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'stretch' }}>
        <TamagotchiWidget datosDeHoy={datosDeHoy} theme={theme} />
        <UpcomingWidget events={eventosProximosReales} theme={theme} />
      </section>

      {/* ESTILOS CSS */}
      <style>{`
        button, input, a { font-family: inherit; outline: none; }

        .nav-btn-pill {
          background-color: ${theme.cardWhite};
          color: ${theme.textDark}; 
          border: 2px solid ${theme.border}; 
          border-radius: 20px; 
          padding: 16px 10px; 
          text-decoration: none; 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: center;
          gap: 10px; 
          font-weight: 700;
          font-size: 0.75rem; 
          transition: transform 0.1s ease;
          box-shadow: 0 3px 0 ${theme.border}; 
        }

        .nav-btn-pill:active { 
          transform: translateY(3px);
          box-shadow: none;
        }
        
        .section-title {
          margin: 0 0 16px 5px; 
          font-size: 0.9rem; 
          font-weight: 800;
          color: ${theme.textDark}; 
        }
      `}</style>
      
      {/* NAVEGACIÓN PRINCIPAL */}
      <h3 className="section-title"></h3>
      <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' }}>
        <Link to="/calendario" className="nav-btn-pill">
          <CalendarDays size={24} strokeWidth={2} color={theme.cardCoral} />
          <span>Calendario</span>
        </Link>
        <Link to="/tareas" className="nav-btn-pill">
          <ListTodo size={24} strokeWidth={2} color={theme.cardBlue} />
          <span>Tareas</span>
        </Link>
        <Link to="/examenes" className="nav-btn-pill">
          <FileText size={24} strokeWidth={2} color={theme.cardYellow} /> 
          <span>Exámenes</span>
        </Link>
        <Link to="/entregas" className="nav-btn-pill">
          <Package size={24} strokeWidth={2} color={theme.cardCoral} />
          <span>Entregas</span>
        </Link>
        <Link to="/pomodoro" className="nav-btn-pill">
          <Timer size={24} strokeWidth={2} color={theme.cardBlue} />
          <span>Pomodoro</span>
        </Link>
      </nav>
      
      {/* ACCESOS RÁPIDOS */}
      <h3 className="section-title">Accesos Rápidos</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', paddingBottom: '30px' }}>
        
        {quickLinks.map(link => (
          // ✅ FIJAMOS EL TAMAÑO EXACTO a 65x65px (mini cuadrados)
          <div key={link.id} style={{ width: '65px', height: '65px', position: 'relative' }}> 
            
            <button 
              onClick={() => deleteQuickLink(link.id)}
              style={{
                position: 'absolute', top: '-6px', right: '-6px', zIndex: 10,
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#FFEBEE', color: '#D32F2F', border: `1px solid #D32F2F`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <WebLinkButton name={link.name} url={link.url} imageUrl={link.imageUrl} theme={theme} />
          </div>
        ))}

        {/* ✅ Botón "+" también en 65x65px */}
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            backgroundColor: theme.cardUpcoming,
            width: '65px', height: '65px', // Tamaño fijo mini
            borderRadius: '14px', border: `2px solid ${theme.border}`, boxShadow: `0 3px 0 ${theme.border}`, transition: 'transform 0.1s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(3px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={24} strokeWidth={3} color={theme.textDark} />
        </button>
        
      </div>
      {/* MODAL DE CONFIGURACIÓN DE HARDWARE */}
      {showHardwareModal && (
        <ModalAjustes 
          ESP32_IP={ESP32_IP} 
          setESP32_IP={setESP32_IP} 
          onClose={() => setShowHardwareModal(false)} 
        />
      )}
      <QuickLinksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSaveLink={addQuickLink} 
        theme={theme}
      />

    </div>
  );
}