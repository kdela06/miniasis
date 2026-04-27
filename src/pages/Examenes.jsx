// src/pages/Examenes.jsx
import React, { useState } from 'react';
import { useGlobalState } from '../store/GlobalContext';
import { ModalCrearEvento, theme } from './Calendario';
import { Plus, ArrowLeft, BookOpen, Trash2, Calendar as CalendarIcon, Check, Clock, Circle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Examenes() {
  const { examenes, tareas, getCuentaAtras, deleteExamen, updateExamen } = useGlobalState();
  const [modalOpen, setModalOpen] = useState(false);
  const [itemAEditar, setItemAEditar] = useState(null);
  const navigate = useNavigate();

  const ESP32_IP = localStorage.getItem('esp32_ip') || "192.168.0.44";
  React.useEffect(() => {
    fetch(`http://${ESP32_IP}/setScreen?screen=EXAMENES`).catch(() => {});
    return () => fetch(`http://${ESP32_IP}/setScreen?screen=MENU`).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 20px', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.font }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}><ArrowLeft size={28} /></button>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: theme.textDark }}>Exámenes</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {examenes.map(ex => {
          const exColor = ex.color || theme.cardCoral; // Leer el color personalizado

          return (
          <div key={ex.id} style={{ backgroundColor: theme.cardWhite, border: `3px solid ${theme.border}`, borderRadius: '24px', padding: '20px', boxShadow: `0 6px 0 ${theme.border}`, color: theme.textDark }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              
              <div 
                style={{ flex: 1, cursor: 'pointer' }} 
                onClick={() => setItemAEditar({ ...ex, _type: 'examen' })}
              >
                <h2 style={{ margin: 0, fontWeight: 900, color: exColor, wordBreak: 'break-word', textDecoration: 'underline decoration-2' }}>
                  {ex.titulo}
                </h2>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textMuted }}>
                  <CalendarIcon size={14} /> {ex.fecha} a las {ex.hora || '--:--'}
                </div>
              </div>

              <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                <div style={{ backgroundColor: exColor, color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, border: `2px solid ${theme.border}` }}>
                  {getCuentaAtras(ex.fecha, ex.hora)}
                </div>
                <button onClick={() => deleteExamen(ex.id)} style={{ background: 'none', border: 'none', marginTop: '10px', cursor: 'pointer', color: theme.textMuted }}><Trash2 size={18} /></button>
              </div>
            </div>

            {/* Temario */}
            <div style={{ backgroundColor: theme.bg, borderRadius: '15px', padding: '12px', border: `2px solid ${theme.border}`, marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', color: theme.textDark }}><BookOpen size={16}/> Temario</h4>
              
              {ex.temas?.map((t, i) => {
                const todoCompletado = t.conEjercicios ? (t.completado && t.ejerciciosCompletados) : t.completado;

                return (
                  <div key={i} style={{ marginBottom: '8px', opacity: todoCompletado ? 0.6 : 1 }}>
                    
                    {/* Fila del Tema */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: t.completado && !todoCompletado ? 0.5 : 1 }}>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => {
                          const nuevosTemas = ex.temas.map(tema => tema.id === t.id ? { ...tema, completado: !tema.completado } : tema);
                          updateExamen(ex.id, { temas: nuevosTemas });
                        }}
                      >
                        {t.completado ? <CheckCircle2 size={18} color={exColor} /> : <Circle size={18} color={theme.textMuted} />}
                        <span style={{ textDecoration: t.completado ? 'line-through' : 'none' }}>{t.nombre}</span>
                      </div>
                      <span style={{ opacity: 0.6 }}>{t.dificultad === 'custom' ? t.horasCustom : t.dificultad}h</span>
                    </div>
                    
                    {/* Checklist para ejercicios si existen */}
                    {t.conEjercicios && (
                      <div 
                        onClick={() => {
                          const nuevosTemas = ex.temas.map(tema => tema.id === t.id ? { ...tema, ejerciciosCompletados: !tema.ejerciciosCompletados } : tema);
                          updateExamen(ex.id, { temas: nuevosTemas });
                        }}
                        style={{ fontSize: '0.75rem', fontWeight: 700, color: exColor, paddingLeft: '26px', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: t.ejerciciosCompletados && !todoCompletado ? 0.5 : 1 }}
                      >
                        {t.ejerciciosCompletados ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        <span style={{ textDecoration: t.ejerciciosCompletados ? 'line-through' : 'none' }}>Ejercicios: {t.horasEjercicios}h</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Tareas vinculadas */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: theme.textDark }}>Tareas Vinculadas:</h4>
            {tareas.filter(t => t.vinculo === `ex-${ex.id}`).map(t => (
              <div key={t.id} style={{ fontSize: '0.8rem', fontWeight: 700, paddingLeft: '10px', borderLeft: `3px solid ${exColor}`, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: theme.textDark }}>
                {t.completada ? <Check size={14} strokeWidth={3} /> : <Clock size={14} color={theme.textMuted} />} 
                <span style={{ textDecoration: t.completada ? 'line-through' : 'none', opacity: t.completada ? 0.6 : 1 }}>{t.titulo}</span>
              </div>
            ))}
          </div>
          );
        })}
      </div>

      <button onClick={() => setModalOpen(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '20px', backgroundColor: theme.cardCoral, border: `3px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 0 ${theme.border}`, cursor: 'pointer' }}><Plus size={35} color="white" /></button>
      
      {itemAEditar && <ModalCrearEvento onClose={() => setItemAEditar(null)} itemAEditar={itemAEditar} />}
      {modalOpen && <ModalCrearEvento onClose={() => setModalOpen(false)} defaultTab="examen" />}
    </div>
  );
}