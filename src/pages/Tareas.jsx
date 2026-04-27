// src/pages/Tareas.jsx
import React, { useState } from 'react';
import { useGlobalState } from '../store/GlobalContext';
import { ModalCrearEvento, theme } from './Calendario';
import { Plus, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tareas() {
  const { tareas, toggleTarea, deleteTarea } = useGlobalState();
  const [modalOpen, setModalOpen] = useState(false);
  const [itemAEditar, setItemAEditar] = useState(null);

  const navigate = useNavigate();
  const ESP32_IP = localStorage.getItem('esp32_ip') || "192.168.0.44";

  // Sincronizar pantalla con ESP32
  React.useEffect(() => {
    fetch(`http://${ESP32_IP}/setScreen?screen=TAREAS`).catch(() => {});
    return () => fetch(`http://${ESP32_IP}/setScreen?screen=MENU`).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.font }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}><ArrowLeft size={28} /></button>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: theme.textDark }}>Mis Tareas</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tareas.length === 0 && <p style={{ textAlign: 'center', color: theme.textMuted }}>No hay tareas aún.</p>}
        
        {tareas.map(t => {
          // Color automático o el que hayamos elegido:
          let bgColor = t.color || (t.vinculo?.startsWith('ex-') ? theme.cardCoral : t.vinculo?.startsWith('en-') ? theme.cardBlue : theme.cardYellow);

          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '15px',
              backgroundColor: t.completada ? '#E0E0E0' : bgColor,
              border: `2px solid ${theme.border}`, borderRadius: '18px',
              boxShadow: t.completada ? 'none' : `0 4px 0 ${theme.border}`,
              opacity: t.completada ? 0.6 : 1, transition: 'all 0.2s'
            }}>
              <div 
                onClick={() => toggleTarea(t.id)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px', border: `2px solid ${theme.border}`,
                  backgroundColor: t.completada ? theme.textDark : theme.cardWhite,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                {t.completada && <Check size={18} color="white" strokeWidth={4} />}
              </div>

              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => setItemAEditar({ ...t, _type: 'tarea' })}
              >
                <div style={{ fontWeight: 800, fontSize: '1rem', textDecoration: t.completada ? 'line-through' : 'none', wordBreak: 'break-word', color: theme.textDark }}>
                  {t.titulo}
                </div>
                {t.horasEstimadas && <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, color: theme.textDark }}>{t.horasEstimadas}h estimadas</div>}
              </div>

              <button onClick={() => deleteTarea(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}>
                <Trash2 size={20} />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={() => setModalOpen(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '20px', backgroundColor: theme.cardYellow, border: `3px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 0 ${theme.border}`, cursor: 'pointer' }}>
        <Plus size={35} strokeWidth={3} color={theme.textDark} />
      </button>

      {itemAEditar && <ModalCrearEvento onClose={() => setItemAEditar(null)} itemAEditar={itemAEditar} />}
      {modalOpen && <ModalCrearEvento onClose={() => setModalOpen(false)} defaultTab="tarea" />}
    </div>
  );
}