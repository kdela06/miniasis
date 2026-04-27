// src/pages/Entregas.jsx
import React, { useState } from 'react';
import { useGlobalState } from '../store/GlobalContext';
import { ModalCrearEvento, theme } from './Calendario';
import { Plus, ArrowLeft, Trash2, Clock, Check, Circle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Entregas() {
  const { entregas, tareas, getCuentaAtras, deleteEntrega, updateEntrega } = useGlobalState();
  const [modalOpen, setModalOpen] = useState(false);
  const [itemAEditar, setItemAEditar] = useState(null);
  const navigate = useNavigate();

  const ESP32_IP = localStorage.getItem('esp32_ip') || "192.168.0.44";
  React.useEffect(() => {
    fetch(`http://${ESP32_IP}/setScreen?screen=ENTREGAS`).catch(() => {});
    return () => fetch(`http://${ESP32_IP}/setScreen?screen=MENU`).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.font }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}><ArrowLeft size={28} /></button>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: theme.textDark }}>Entregas</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {entregas.map(en => {
          const enColor = en.color || theme.cardBlue; // Leer el color personalizado

          return (
          <div key={en.id} style={{ backgroundColor: theme.cardWhite, border: `3px solid ${theme.border}`, borderRadius: '24px', padding: '20px', boxShadow: `0 6px 0 ${theme.border}`, color: theme.textDark }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              
              <div 
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => setItemAEditar({ ...en, _type: 'entrega' })}
              >
                <h2 style={{ margin: 0, fontWeight: 900, color: enColor, wordBreak: 'break-word', textDecoration: 'underline decoration-2' }}>
                  {en.titulo}
                </h2>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMuted }}>
                  <Clock size={14} /> {en.fecha} a las {en.hora || '23:59'}
                </div>
              </div>

              <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                <div style={{ backgroundColor: enColor, color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, border: `2px solid ${theme.border}` }}>
                  {getCuentaAtras(en.fecha, en.hora)}
                </div>
                <button onClick={() => deleteEntrega(en.id)} style={{ background: 'none', border: 'none', marginTop: '10px', cursor: 'pointer', color: theme.textMuted }}><Trash2 size={18} /></button>
              </div>
            </div>

            {/* Apartados */}
            {en.apartados?.map((ap, i) => (
              <div key={i} 
                onClick={() => {
                  const nuevosAps = en.apartados.map(a => a.id === ap.id ? { ...a, completado: !a.completado } : a);
                  updateEntrega(en.id, { apartados: nuevosAps });
                }}
                style={{ 
                  padding: '8px 12px', backgroundColor: ap.completado ? theme.bg : '#F0F4F8', 
                  border: `2px solid ${theme.border}`, borderRadius: '12px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', opacity: ap.completado ? 0.6 : 1 
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem' }}>
                  {ap.completado ? <CheckCircle2 size={16} color={enColor} /> : <Circle size={16} color={theme.textMuted} />}
                  <span style={{ textDecoration: ap.completado ? 'line-through' : 'none' }}>{ap.nombre}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{ap.horas}h</span>
              </div>
            ))}

            {/* Tareas vinculadas */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: theme.textDark }}>Checklist vinculado:</h4>
            {tareas.filter(t => t.vinculo === `en-${en.id}`).map(t => (
              <div key={t.id} style={{ fontSize: '0.8rem', fontWeight: 700, paddingLeft: '10px', borderLeft: `3px solid ${enColor}`, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textDark }}>
                {t.completada ? <Check size={14} strokeWidth={3} /> : <Clock size={14} color={theme.textMuted} />} 
                <span style={{ textDecoration: t.completada ? 'line-through' : 'none', opacity: t.completada ? 0.6 : 1 }}>{t.titulo}</span>
              </div>
            ))}
          </div>
          );
        })}
      </div>

      <button onClick={() => setModalOpen(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '20px', backgroundColor: theme.cardBlue, border: `3px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 0 ${theme.border}`, cursor: 'pointer' }}><Plus size={35} color="white" /></button>
      
      {itemAEditar && <ModalCrearEvento onClose={() => setItemAEditar(null)} itemAEditar={itemAEditar} />}
      {modalOpen && <ModalCrearEvento onClose={() => setModalOpen(false)} defaultTab="entrega" />}
    </div>
  );
}