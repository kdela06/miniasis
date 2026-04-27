// src/pages/Calendario.jsx
import React, { useState, useMemo } from 'react';
import { useGlobalState } from '../store/GlobalContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings, Plus, X, Trash2, ListTodo, Clock, Palette, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const theme = {
  bg: '#F9F6F0', cardCream: '#EDDCBC', cardBlue: '#9EB3D6', cardYellow: '#CEB45B', 
  cardCoral: '#eb916e', cardWhite: '#FFFFFF', border: '#412B2E', textDark: '#412B2E', 
  textMuted: '#a8a8a8', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};
export const subjectColors = [theme.cardYellow, theme.cardCoral, theme.cardBlue, '#A3C9A8', '#D9A5B3', '#d2cedc'];

const getFechaString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDaysDate = (d, days) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };
const startOfWeekMonday = (date) => { const d = new Date(date); const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0, 0, 0, 0); return d; };

const formatearFechaTimeline = (isoDate) => {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    const date = new Date(y, m - 1, d);
    const dia = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d}`;
};

export default function Calendario() {
  const navigate = useNavigate();
  
  const { 
    tareas, examenes, entregas, 
    capacidadBase, setCapacidadBase, capacidadExtra, setCapacidadExtra,
    planificacion, setPlanificacion 
  } = useGlobalState();

  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('month'); 

  const [modalDiaAbierto, setModalDiaAbierto] = useState(null);
  const [modalBaseAbierto, setModalBaseAbierto] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [backlogAbierto, setBacklogAbierto] = useState(false);
  const [planificandoItem, setPlanificandoItem] = useState(null); 
  const [editandoPlan, setEditandoPlan] = useState(null); 
  const [itemAEditar, setItemAEditar] = useState(null); 

  const eventsByDate = useMemo(() => {
    const map = new Map();
    const allEvents = [
      ...examenes.map(e => ({ ...e, _type: 'examen' })),
      ...entregas.map(e => ({ ...e, _type: 'entrega' })),
      // CAMBIO: Filtramos las tareas para que si ya están completadas no salgan en el calendario
      ...tareas.filter(t => t.fecha && !t.completada).map(e => ({ ...e, _type: 'tarea' })) 
    ];
    allEvents.forEach(ev => {
      if (!ev.fecha) return;
      const key = String(ev.fecha);
      const arr = map.get(key) || [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [examenes, entregas, tareas]);

  const getHorasLibresBloque = (fStr, bloque) => {
    const cap = capacidadExtra[fStr] || capacidadBase[new Date(fStr).getDay()] || { m: 0, t: 0, n: 0 };
    const maxHoras = Number(cap[bloque] || 0);
    
    // Horas usadas por bloques planificados desde el backlog
    const planDia = planificacion[fStr] || {m:[], t:[], n:[]};
    const usadasPlan = (planDia[bloque] || []).reduce((acc, b) => acc + parseFloat(b.horas || 0), 0);
    
    // CAMBIO: Horas usadas por Tareas directas creadas con fecha y bloque
    const usadasTareasFijas = tareas
      .filter(t => t.fecha === fStr && t.bloque === bloque && !t.completada)
      .reduce((acc, t) => acc + parseFloat(t.horasEstimadas || 0), 0);

    return maxHoras - usadasPlan - usadasTareasFijas;
  };

  const getHorasLibresTotalesDia = (fStr) => getHorasLibresBloque(fStr, 'm') + getHorasLibresBloque(fStr, 't') + getHorasLibresBloque(fStr, 'n');

  const visibleDates = useMemo(() => {
    if (viewMode === 'week' || viewMode === 'agenda') return Array.from({ length: 7 }, (_, i) => getFechaString(addDaysDate(startOfWeekMonday(cursorDate), i)));
    
    const firstOfMonth = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    const offset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
    return Array.from({ length: 42 }, (_, i) => getFechaString(addDaysDate(addDaysDate(firstOfMonth, -offset), i)));
  }, [cursorDate, viewMode]);

  const btnStyle = { padding: '8px 12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.cardWhite, color: theme.textDark, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 3px 0 ${theme.border}`, transition: 'transform 0.1s ease', fontSize: '0.85rem' };

  return (
    <div style={{ padding: '24px 15px', minHeight: '100vh', backgroundColor: theme.bg, color: theme.textDark, fontFamily: theme.font, display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}>
          <ArrowLeft size={28} />
        </button>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: theme.textDark }}>Calendario</h1>
      </header>

      {/* CONTROLES DEL CALENDARIO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setCursorDate(d => viewMode === 'month' ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : addDaysDate(d, -7))} style={btnStyle}><ChevronLeft size={18} strokeWidth={3} /></button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarIcon color={theme.cardCoral} size={20}/> 
            {viewMode === 'month' ? `${['Enero', 'Feb', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Sept', 'Oct', 'Nov', 'Dic'][cursorDate.getMonth()]} ${cursorDate.getFullYear()}` : `Semana del ${startOfWeekMonday(cursorDate).getDate()}`}
          </h2>
          <button onClick={() => setCursorDate(d => viewMode === 'month' ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDaysDate(d, +7))} style={btnStyle}><ChevronRight size={18} strokeWidth={3} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button onClick={() => setBacklogAbierto(true)} style={{ ...btnStyle, backgroundColor: theme.cardYellow, flex: 1, justifyContent: 'center' }}>
            <ListTodo size={16} /> Backlog
          </button>
          <div style={{ display: 'flex', gap: '6px', flex: 2 }}>
            <button onClick={() => setViewMode('agenda')} style={{ ...btnStyle, flex: 1, padding: '8px', justifyContent: 'center', backgroundColor: viewMode === 'agenda' ? theme.cardCream : theme.cardWhite }}>Ag.</button>
            <button onClick={() => setViewMode('week')} style={{ ...btnStyle, flex: 1, padding: '8px', justifyContent: 'center', backgroundColor: viewMode === 'week' ? theme.cardCream : theme.cardWhite }}>Sem.</button>
            <button onClick={() => setViewMode('month')} style={{ ...btnStyle, flex: 1, padding: '8px', justifyContent: 'center', backgroundColor: viewMode === 'month' ? theme.cardCream : theme.cardWhite }}>Mes</button>
            <button onClick={() => setModalBaseAbierto(true)} style={{ ...btnStyle, backgroundColor: theme.cardBlue }} title="Ajustes de horas"><Settings size={18} /></button>
          </div>
        </div>
      </div>

      {/* CALENDARIO */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera de días (Solo visible en mes y semana) */}
        {(viewMode === 'month' || viewMode === 'week') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} style={{ textAlign: 'center', fontWeight: '800', color: theme.textMuted, fontSize: '0.85rem' }}>{d}</div>)}
            </div>
        )}
        
        {/* Contenedor dinámico */}
        <div style={{ 
            display: viewMode === 'agenda' ? 'flex' : 'grid', 
            gridTemplateColumns: viewMode === 'agenda' ? 'none' : 'repeat(7, 1fr)', 
            flexDirection: viewMode === 'agenda' ? 'column' : 'row',
            gap: viewMode === 'agenda' ? '15px' : '6px', 
            flex: 1 
        }}>
          {visibleDates.map(fStr => {
            const d = new Date(fStr);
            const isToday = fStr === getFechaString(new Date());
            const isOutsideMonth = viewMode === 'month' && d.getMonth() !== cursorDate.getMonth();
            
            const horasLibres = getHorasLibresTotalesDia(fStr);
            const planDia = planificacion[fStr] || {m:[], t:[], n:[]};
            const dayEventsFixed = eventsByDate.get(fStr) || [];
            
            const bloquesAsignados = [
              ...(planDia.m||[]).map(b => ({...b, bq: 'M'})),
              ...(planDia.t||[]).map(b => ({...b, bq: 'T'})),
              ...(planDia.n||[]).map(b => ({...b, bq: 'N'})),
            ];

            // ================= MODO AGENDA =================
            if (viewMode === 'agenda') {
              return (
                <div key={fStr} onClick={() => setModalDiaAbierto(fStr)}
                     style={{
                       backgroundColor: isToday ? '#FFFAF2' : theme.cardWhite,
                       border: `3px solid ${isToday ? theme.cardCoral : theme.border}`,
                       borderRadius: '16px', padding: '16px', cursor: 'pointer',
                       boxShadow: `0 4px 0 ${isToday ? theme.cardCoral : theme.border}`,
                       display: 'flex', flexDirection: 'column', gap: '12px'
                     }}>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px dashed ${theme.border}`, paddingBottom: '10px' }}>
                     <span style={{ fontSize: '1.1rem', fontWeight: '900', color: isToday ? theme.cardCoral : theme.textDark }}>
                         {formatearFechaTimeline(fStr)} {isToday && '(Hoy)'}
                     </span>
                     <span style={{ fontSize: '0.8rem', fontWeight: '800', color: horasLibres <= 0 ? '#D32F2F' : theme.textMuted, backgroundColor: horasLibres <= 0 ? '#FFEBEE' : theme.bg, padding: '4px 8px', borderRadius: '8px', border: `1px solid ${horasLibres <= 0 ? '#D32F2F' : theme.border}` }}>
                        Libres: {horasLibres.toFixed(1)}h
                     </span>
                   </div>

                   {dayEventsFixed.length === 0 && bloquesAsignados.length === 0 ? (
                     <div style={{ color: theme.textMuted, fontSize: '0.85rem', fontWeight: 'bold', fontStyle: 'italic', padding: '10px 0', textAlign: 'center' }}>Sin planes para hoy ✨</div>
                   ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Eventos fijos con sus colores reales */}
                        {dayEventsFixed.map(ev => {
                          const colorFondo = ev.color || (ev._type === 'examen' ? theme.cardCoral : ev._type === 'entrega' ? theme.cardBlue : theme.cardYellow);
                          const badge = ev._type === 'tarea' && ev.bloque ? ev.bloque.toUpperCase() : null;

                          return (
                            <div key={`${ev._type}-${ev.id}`} onClick={(e) => { e.stopPropagation(); setItemAEditar(ev); }}
                                 style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: colorFondo, border: `2px solid ${theme.border}`, borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', boxShadow: `0 2px 0 ${theme.border}` }}>
                               
                               {/* Badge M/T/N si es una tarea */}
                               {badge && <span style={{ fontWeight: '900', fontSize: '0.8rem', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '2px 8px' }}>{badge}</span>}
                               
                               <span style={{ fontWeight: '900', fontSize: '0.9rem', flex: 1, wordBreak: 'break-word', lineHeight: '1.3' }}>{ev.titulo}</span>
                               
                               {/* Hora exacta solo si aplica (examenes, entregas, o tareas antiguas) */}
                               {ev.hora && <span style={{ fontSize: '0.75rem', fontWeight: '900', backgroundColor: theme.cardWhite, padding: '4px 8px', borderRadius: '8px', border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/>{ev.hora}</span>}
                            </div>
                          )
                        })}

                        {bloquesAsignados.map(b => (
                          <div key={b.id} onClick={(e) => { e.stopPropagation(); setEditandoPlan({ ...b, fStr }); }}
                               style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: b.color || theme.bg, border: `2px dashed ${theme.border}`, borderRadius: '12px', padding: '10px 14px', cursor: 'pointer' }}>
                              <span style={{ fontWeight: '900', fontSize: '0.8rem', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '8px', padding: '2px 8px' }}>{b.bq}</span>
                              <span style={{ fontWeight: '800', fontSize: '0.9rem', flex: 1, wordBreak: 'break-word', lineHeight: '1.3' }}>{b.title}</span>
                              <span style={{ fontWeight: '900', fontSize: '0.9rem' }}>{b.horas}h</span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              );
            }

            // ================= MODO MES / SEMANA =================
            return (
              <div key={fStr} onClick={() => setModalDiaAbierto(fStr)}
                style={{
                  backgroundColor: isOutsideMonth ? 'transparent' : theme.cardWhite,
                  border: `2px solid ${isOutsideMonth ? 'transparent' : theme.border}`, borderRadius: '12px', padding: '6px',
                  minHeight: viewMode === 'month' ? '100px' : '200px', display: 'flex', flexDirection: 'column', gap: '4px',
                  boxShadow: isOutsideMonth ? 'none' : `0 3px 0 ${theme.border}`, opacity: isOutsideMonth ? 0.4 : 1, cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? theme.textDark : 'transparent', color: isToday ? theme.cardWhite : theme.textDark, fontWeight: '800', fontSize: '0.8rem' }}>{d.getDate()}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '800', color: horasLibres <= 0 ? '#D32F2F' : theme.textMuted, backgroundColor: horasLibres <= 0 ? '#FFEBEE' : theme.bg, padding: '2px 4px', borderRadius: '6px', border: `1px solid ${horasLibres <= 0 ? '#D32F2F' : theme.border}` }}>
                    {horasLibres.toFixed(1)}h
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                  
                  {dayEventsFixed.map(ev => {
                      const colorFondo = ev.color || (ev._type === 'examen' ? theme.cardCoral : ev._type === 'entrega' ? theme.cardBlue : theme.cardYellow);
                      const badge = ev._type === 'tarea' && ev.bloque ? ev.bloque.toUpperCase() : null;

                      return (
                        <div key={`${ev._type}-${ev.id}`} onClick={(e) => { e.stopPropagation(); setItemAEditar(ev); }} 
                          style={{ display: 'flex', gap: '4px', backgroundColor: colorFondo, border: `2px dashed ${theme.border}`, borderRadius: '6px', padding: '3px 4px', fontSize: '0.65rem', fontWeight: '800', color: theme.textDark, cursor: 'pointer' }}>
                            {badge && <div style={{ backgroundColor: theme.cardWhite, borderRadius: '4px', padding: '0 4px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center' }}>{badge}</div>}
                            <div style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.2' }}>{ev.titulo} {ev.hora ? `(${ev.hora})` : ''}</div>
                        </div>
                      )
                  })}

                  {bloquesAsignados.map(b => (
                    <div key={b.id} onClick={(e) => { e.stopPropagation(); setEditandoPlan({ ...b, fStr }); }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: b.color || theme.bg, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '3px 4px', boxShadow: `0 1px 0 ${theme.border}`, cursor: 'pointer' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', flex: 1, paddingRight: '4px', lineHeight: '1.2', wordBreak: 'break-word' }}>{b.bq}: {b.title}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800' }}>{b.horas}h</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => setModalCrearAbierto(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '20px', backgroundColor: theme.cardCream, border: `3px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 0 ${theme.border}`, zIndex: 100 }} ><Plus size={32} strokeWidth={3} color={theme.textDark} /></button>

      {/* RENDERIZADO DE MODALES */}
      {modalBaseAbierto && <ModalCapacidadBase base={capacidadBase} setBase={setCapacidadBase} onClose={() => setModalBaseAbierto(false)} />}
      {modalDiaAbierto && <ModalEdicionDia fecha={modalDiaAbierto} capacidadExtra={capacidadExtra} setCapacidadExtra={setCapacidadExtra} capacidadBase={capacidadBase} onClose={() => setModalDiaAbierto(null)} />}
      {modalCrearAbierto && <ModalCrearEvento onClose={() => setModalCrearAbierto(false)} defaultTab="tarea" />}
      {itemAEditar && <ModalCrearEvento onClose={() => setItemAEditar(null)} itemAEditar={itemAEditar} />} 
      
      {backlogAbierto && (
        <ModalBacklog 
          onClose={() => setBacklogAbierto(false)} 
          onPlanificar={(item) => { 
            setPlanificandoItem(item); 
            setBacklogAbierto(false); 
          }}
        />
      )}

      {planificandoItem && (
        <ModalAsignarHoras 
          item={planificandoItem} 
          getHorasLibresBloque={getHorasLibresBloque} 
          setPlanificacion={setPlanificacion} 
          onClose={() => setPlanificandoItem(null)} 
        />
      )}

      {editandoPlan && (
        <ModalEditarPlanificacion 
          item={editandoPlan} 
          getHorasLibresBloque={getHorasLibresBloque}
          setPlanificacion={setPlanificacion}
          onClose={() => setEditandoPlan(null)}
        />
      )}
    </div>
  );
}

// ==========================================
// MODAL DEL BACKLOG (INTELIGENTE)
// ==========================================
function ModalBacklog({ onClose, onPlanificar }) {
  const { tareas, examenes, entregas, planificacion } = useGlobalState();
  const btnStyle = { padding: '6px 10px', borderRadius: '12px', border: `2px solid ${theme.border}`, backgroundColor: theme.cardWhite, color: theme.textDark, fontWeight: '800', cursor: 'pointer', fontSize: '0.75rem', boxShadow: `0 2px 0 ${theme.border}` };

  const getHorasPlanificadas = (title) => {
    let total = 0;
    Object.values(planificacion).forEach(dia => {
      ['m', 't', 'n'].forEach(bloque => {
        (dia[bloque] || []).forEach(b => {
          if (b.title === title) {
            total += parseFloat(b.horas || 0);
          }
        });
      });
    });
    return total;
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{...modalBoxStyle, padding: '20px'}} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><ListTodo size={20} color={theme.cardCoral}/> Backlog</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: theme.textMuted, fontWeight: '600' }}>Tus pendientes sin planificar por completo.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {tareas.filter(t => !t.fecha).map(t => {
             const titleTarea = t.titulo;
             const horasTotal = parseFloat(t.horasEstimadas || 1);
             const horasPlan = getHorasPlanificadas(titleTarea);
             const bgColor = t.color || theme.cardYellow; // Usamos su color
             
             if (horasPlan >= horasTotal) return null; 
             
             return (
                 <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px solid ${theme.border}`, padding: '10px', borderRadius: '12px', backgroundColor: bgColor }}>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem', flex: 1, paddingRight: '10px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                        {t.titulo} {t.horasEstimadas ? `(${horasPlan}/${horasTotal}h)` : ''}
                    </div>
                    <button onClick={() => onPlanificar({ title: titleTarea, horasSug: horasTotal - horasPlan, color: bgColor })} style={btnStyle}>Plan</button>
                 </div>
             )
          })}

          {examenes.map(ex => {
             const exColor = ex.color || theme.cardCoral; // Color del examen

             return (
              <div key={ex.id}>
                  {ex.temas?.some(t => {
                      const hT = t.dificultad === 'custom' ? parseFloat(t.horasCustom||0) : parseFloat(t.dificultad||1);
                      const hE = parseFloat(t.horasEjercicios||1);
                      const faltaT = !t.completado && getHorasPlanificadas(`${ex.titulo}: ${t.nombre}`) < hT;
                      const faltaE = t.conEjercicios && !t.ejerciciosCompletados && getHorasPlanificadas(`Ejercicios: ${t.nombre}`) < hE;
                      return faltaT || faltaE;
                  }) && (
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: theme.textMuted }}>{ex.titulo}</h4>
                  )}

                  {ex.temas?.filter(t => !t.completado || (t.conEjercicios && !t.ejerciciosCompletados)).map(tema => {
                      const titleTema = `${ex.titulo}: ${tema.nombre}`;
                      const titleEj = `Ejercicios: ${tema.nombre}`;
                      
                      const horasTema = tema.dificultad === 'custom' ? parseFloat(tema.horasCustom || 0) : parseFloat(tema.dificultad || 1);
                      const horasEj = parseFloat(tema.horasEjercicios || 0);
                      
                      const planTema = getHorasPlanificadas(titleTema);
                      const planEj = getHorasPlanificadas(titleEj);
                      
                      const faltaTema = !tema.completado && planTema < horasTema;
                      const faltaEj = tema.conEjercicios && !tema.ejerciciosCompletados && planEj < horasEj;

                      if (!faltaTema && !faltaEj) return null; 

                      return (
                          <div key={tema.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>

                              {faltaTema && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px solid ${theme.border}`, padding: '10px', borderRadius: '12px', backgroundColor: exColor }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.85rem', flex: 1, paddingRight: '10px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                                        {ex.titulo}: {tema.nombre} <span style={{fontSize: '0.75rem', opacity: 0.8}}>({planTema}/{horasTema}h)</span>
                                    </div>
                                    <button onClick={() => onPlanificar({ title: titleTema, horasSug: horasTema - planTema, color: exColor })} style={btnStyle}>Plan</button>
                                </div>
                              )}
                              
                              {faltaEj && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px dashed ${theme.border}`, padding: '10px', borderRadius: '12px', backgroundColor: exColor, marginLeft: !tema.completado ? '15px' : '0px' }}>
                                      <div style={{ fontWeight: '700', fontSize: '0.85rem', flex: 1, paddingRight: '10px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                                          Ejercicios: {tema.nombre} <span style={{fontSize: '0.75rem', opacity: 0.8}}>({planEj}/{horasEj}h)</span>
                                      </div>
                                      <button onClick={() => onPlanificar({ title: titleEj, horasSug: horasEj - planEj, color: exColor })} style={btnStyle}>Plan</button>
                                  </div>
                              )}
                          </div>
                      )
                  })}
              </div>
            )
          })}

          {entregas.map(en => {
            const enColor = en.color || theme.cardBlue; // Color de la entrega

            return (
              <div key={en.id}>
                  {en.apartados?.some(ap => !ap.completado && getHorasPlanificadas(`${en.titulo}: ${ap.nombre}`) < parseFloat(ap.horas||0)) && (
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: theme.textMuted }}>{en.titulo}</h4>
                  )}
                  
                  {en.apartados?.filter(ap => !ap.completado).map(ap => {
                      const titleAp = `${en.titulo}: ${ap.nombre}`;
                      const horasTotal = parseFloat(ap.horas || 0);
                      const horasPlan = getHorasPlanificadas(titleAp);

                      if (horasPlan >= horasTotal) return null;

                      return (
                          <div key={ap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `2px solid ${theme.border}`, padding: '10px', borderRadius: '12px', backgroundColor: enColor, marginBottom: '6px' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', flex: 1, paddingRight: '10px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                              {ap.nombre} <span style={{fontSize: '0.75rem', opacity: 0.8}}>({horasPlan}/{horasTotal}h)</span>
                          </div>
                          <button onClick={() => onPlanificar({ title: titleAp, horasSug: horasTotal - horasPlan, color: enColor })} style={btnStyle}>Plan</button>
                          </div>
                      )
                  })}
              </div>
            )
          })}
        </div>
      </div>
    </Overlay>
  );
}

// ==========================================
// MODAL PARA ASIGNAR HORAS MANUALMENTE
// ==========================================
function ModalAsignarHoras({ item, getHorasLibresBloque, setPlanificacion, onClose }) {
  const [fecha, setFecha] = useState(getFechaString(new Date()));
  const [bloque, setBloque] = useState('m'); 
  const [horas, setHoras] = useState(item.horasSug || 1);

  const handleGuardar = () => {
    if(!fecha) return alert("Selecciona una fecha.");
    const aAsignar = parseFloat(horas);
    const libresEnBloque = getHorasLibresBloque(fecha, bloque);

    if (aAsignar <= 0) return alert('Debes asignar un tiempo mayor a 0.');
    if (aAsignar > libresEnBloque) return alert(`⚠️ No caben ${aAsignar}h. Solo te quedan ${libresEnBloque}h libres en esta franja.`);

    setPlanificacion(prev => {
        const planDia = prev[fecha] || {m:[], t:[], n:[]};
        return {
            ...prev,
            [fecha]: {
                ...planDia,
                [bloque]: [ ...(planDia[bloque]||[]), { id: Date.now(), title: item.title, horas: aAsignar, color: item.color } ]
            }
        };
    });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontWeight: '800' }}>Planificar</h3><button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button></div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMuted, fontWeight: '600' }}>Asignando horas a: <strong>{item.title}</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputNeoStyle} />
          <select value={bloque} onChange={e => setBloque(e.target.value)} style={inputNeoStyle}>
            <option value="m">Mañana (Libres: {getHorasLibresBloque(fecha, 'm')}h)</option>
            <option value="t">Tarde (Libres: {getHorasLibresBloque(fecha, 't')}h)</option>
            <option value="n">Noche (Libres: {getHorasLibresBloque(fecha, 'n')}h)</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontWeight: '700' }}>Horas a dedicar:</span><input type="number" min="0.1" step="0.5" value={horas} onChange={e => setHoras(e.target.value)} style={{...inputNeoStyle, width: '100px'}} /></div>
        </div>
        <button onClick={handleGuardar} style={{ padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.textDark, color: theme.cardWhite, fontWeight: '800', cursor: 'pointer', boxShadow: `0 4px 0 ${theme.border}` }}>Añadir al Calendario</button>
      </div>
    </Overlay>
  );
}

// ==========================================
// MODAL PARA EDITAR UNA ASIGNACIÓN EXISTENTE
// ==========================================
function ModalEditarPlanificacion({ item, getHorasLibresBloque, setPlanificacion, onClose }) {
  const [fecha, setFecha] = useState(item.fStr);
  const [bloque, setBloque] = useState(item.bq.toLowerCase());
  const [horas, setHoras] = useState(item.horas);

  const handleGuardar = () => {
    if(!fecha) return alert("Selecciona una fecha.");
    const aAsignar = parseFloat(horas);
    if (aAsignar <= 0) return alert('Debes asignar un tiempo mayor a 0.');

    let libresEnBloque = getHorasLibresBloque(fecha, bloque);
    if (fecha === item.fStr && bloque === item.bq.toLowerCase()) libresEnBloque += parseFloat(item.horas);

    if (aAsignar > libresEnBloque) return alert(`⚠️ No caben ${aAsignar}h. Solo te quedan ${libresEnBloque}h libres en esta franja.`);

    setPlanificacion(prev => {
        const newState = { ...prev };
        const oldPlanDia = newState[item.fStr] || {m:[], t:[], n:[]};
        const oldBqKey = item.bq.toLowerCase();
        newState[item.fStr] = { ...oldPlanDia, [oldBqKey]: oldPlanDia[oldBqKey].filter(b => b.id !== item.id) };

        const newPlanDia = newState[fecha] || {m:[], t:[], n:[]};
        newState[fecha] = { ...newPlanDia, [bloque]: [ ...(newPlanDia[bloque] || []), { id: item.id, title: item.title, horas: aAsignar, color: item.color } ] };

        return newState;
    });
    onClose();
  };

  const handleEliminar = () => {
    setPlanificacion(prev => {
        const planDia = prev[item.fStr] || {m:[], t:[], n:[]};
        const bqKey = item.bq.toLowerCase();
        return { ...prev, [item.fStr]: { ...planDia, [bqKey]: planDia[bqKey].filter(b => b.id !== item.id) } };
    });
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: '800' }}>Editar Asignación</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMuted, fontWeight: '600' }}>Editando: <strong>{item.title}</strong></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputNeoStyle} />
          <select value={bloque} onChange={e => setBloque(e.target.value)} style={inputNeoStyle}>
            <option value="m">Mañana (Libres: {getHorasLibresBloque(fecha, 'm')}h)</option>
            <option value="t">Tarde (Libres: {getHorasLibresBloque(fecha, 't')}h)</option>
            <option value="n">Noche (Libres: {getHorasLibresBloque(fecha, 'n')}h)</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontWeight: '700' }}>Horas:</span><input type="number" min="0.1" step="0.5" value={horas} onChange={e => setHoras(e.target.value)} style={{...inputNeoStyle, width: '100px'}} /></div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleEliminar} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: '#FFEBEE', color: '#D32F2F', fontWeight: '800', cursor: 'pointer', boxShadow: `0 3px 0 ${theme.border}` }}>Borrar</button>
            <button onClick={handleGuardar} style={{ flex: 2, padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.textDark, color: theme.cardWhite, fontWeight: '800', cursor: 'pointer', boxShadow: `0 3px 0 ${theme.border}` }}>Guardar</button>
        </div>
      </div>
    </Overlay>
  );
}

// =========================================================
// MODALES COMUNES Y FORMULARIO DE CREACIÓN/EDICIÓN
// =========================================================
export const Overlay = ({ children, onClose }) => (<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(65, 43, 46, 0.4)', backdropFilter: 'blur(3px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onMouseDown={onClose}>{children}</div>);
export const modalBoxStyle = { backgroundColor: theme.bg, border: `3px solid ${theme.border}`, borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: `0 8px 0 ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '20px' };
export const inputNeoStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '12px', border: `2px solid ${theme.border}`, outline: 'none', fontWeight: '700', fontFamily: theme.font, color: theme.textDark };

export function ModalCrearEvento({ onClose, defaultTab = 'tarea', itemAEditar = null }) {
  const { addTarea, updateTarea, addExamen, updateExamen, addEntrega, updateEntrega, examenes, entregas } = useGlobalState();
  
  const [tipo, setTipo] = useState(itemAEditar ? itemAEditar._type : defaultTab); 
  const [titulo, setTitulo] = useState(itemAEditar?.titulo || ''); 
  const [fecha, setFecha] = useState(itemAEditar?.fecha || ''); 
  
  // CAMBIO: Tareas usan 'bloque', Exámenes/Entregas usan 'hora'
  const [hora, setHora] = useState(itemAEditar?.hora || '');
  const [bloque, setBloque] = useState(itemAEditar?.bloque || ''); 

  const [horasTarea, setHorasTarea] = useState(itemAEditar?.horasEstimadas || ''); 
  const [vinculo, setVinculo] = useState(itemAEditar?.vinculo || '');
  const [temas, setTemas] = useState(itemAEditar?.temas || []); 
  const [apartados, setApartados] = useState(itemAEditar?.apartados || []);
  
  // COLOR
  const [color, setColor] = useState(itemAEditar?.color || (defaultTab === 'tarea' ? theme.cardYellow : defaultTab === 'examen' ? theme.cardCoral : theme.cardBlue));

  const addTema = () => setTemas([...temas, { 
    id: Date.now(), nombre: '', dificultad: '1', horasCustom: '', 
    conEjercicios: false, horasEjercicios: '', completado: false, ejerciciosCompletados: false 
  }]);
  const updateTema = (id, campo, valor) => setTemas(temas.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  const removeTema = (id) => setTemas(temas.filter(t => t.id !== id));
  
  const addApartado = () => setApartados([...apartados, { id: Date.now(), nombre: '', horas: '', completado: false }]);
  const updateApartado = (id, campo, valor) => setApartados(apartados.map(a => a.id === id ? { ...a, [campo]: valor } : a));
  const removeApartado = (id) => setApartados(apartados.filter(a => a.id !== id));

  const handleGuardar = () => {
    if (!titulo) return alert('El título es obligatorio.');
    if (tipo !== 'tarea' && !fecha) return alert('La fecha es obligatoria para exámenes y entregas.');

    if (tipo === 'tarea') {
      // CAMBIO: Guardamos 'bloque' en vez de 'hora' para tareas
      const data = { titulo, fecha: fecha || null, bloque: bloque || null, horasEstimadas: horasTarea ? Number(horasTarea) : null, vinculo, color };
      if (itemAEditar && updateTarea) updateTarea(itemAEditar.id, data); else addTarea(data);
    } else if (tipo === 'examen') {
      const data = { titulo, fecha, hora, temas, color };
      if (itemAEditar && updateExamen) updateExamen(itemAEditar.id, data); else addExamen(data);
    } else if (tipo === 'entrega') {
      const data = { titulo, fecha, hora, apartados, color };
      if (itemAEditar && updateEntrega) updateEntrega(itemAEditar.id, data); else addEntrega(data);
    }
    onClose();
  };

  const getTabStyle = (tabType, tabColor) => ({ 
    flex: 1, padding: '10px', textAlign: 'center', fontWeight: '800', 
    cursor: itemAEditar ? 'default' : 'pointer', 
    border: `2px solid ${theme.border}`, borderRadius: '12px', 
    backgroundColor: tipo === tabType ? color : theme.cardWhite,
    boxShadow: tipo === tabType ? `0 4px 0 ${theme.border}` : 'none',
    opacity: itemAEditar && tipo !== tabType ? 0.4 : 1 
  });

  return (
    <Overlay onClose={onClose}>
      <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: '800' }}>{itemAEditar ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div onClick={() => { if(!itemAEditar) { setTipo('tarea'); setColor(theme.cardYellow); } }} style={getTabStyle('tarea')}>Tarea</div>
          <div onClick={() => { if(!itemAEditar) { setTipo('examen'); setColor(theme.cardCoral); } }} style={getTabStyle('examen')}>Examen</div>
          <div onClick={() => { if(!itemAEditar) { setTipo('entrega'); setColor(theme.cardBlue); } }} style={getTabStyle('entrega')}>Entrega</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder={`Título...`} value={titulo} onChange={e => setTitulo(e.target.value)} style={inputNeoStyle} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: theme.cardWhite, borderRadius: '12px', border: `2px solid ${theme.border}` }}>
              <Palette size={18} color={theme.textMuted}/>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {subjectColors.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{ minWidth: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: color === c ? `3px solid ${theme.textDark}` : `2px solid ${theme.border}`, cursor: 'pointer', transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.1s' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ ...inputNeoStyle, flex: 2 }} />
                
                {/* CAMBIO: Mostrar bloque para tareas, hora para el resto */}
                {tipo === 'tarea' ? (
                    <select value={bloque} onChange={e => setBloque(e.target.value)} style={{ ...inputNeoStyle, flex: 1 }}>
                        <option value="">(Sin bloque)</option>
                        <option value="m">Mañana</option>
                        <option value="t">Tarde</option>
                        <option value="n">Noche</option>
                    </select>
                ) : (
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={{ ...inputNeoStyle, flex: 1 }} />
                )}
            </div>
        </div>
        
        {tipo === 'tarea' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '16px' }}>
                <div style={{ fontWeight: '700' }}>Estimación (Opcional):</div>
                <input type="number" min="0" step="0.5" placeholder="Ej: 1.5 horas" value={horasTarea} onChange={e => setHorasTarea(e.target.value)} style={inputNeoStyle} />
                <div style={{ fontWeight: '700' }}>Vincular a (Opcional):</div>
                <select value={vinculo} onChange={e => setVinculo(e.target.value)} style={inputNeoStyle}>
                    <option value="">Ninguno</option>
                    {examenes.length > 0 && <optgroup label="Exámenes">{examenes.map(e => <option key={`ex-${e.id}`} value={`ex-${e.id}`}>{e.titulo}</option>)}</optgroup>}
                    {entregas.length > 0 && <optgroup label="Entregas">{entregas.map(e => <option key={`en-${e.id}`} value={`en-${e.id}`}>{e.titulo}</option>)}</optgroup>}
                </select>
            </div>
        )}
        
        {tipo === 'examen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, fontWeight: '800' }}>Temario</h4>
                {temas.map((tema, i) => (
                    <div key={tema.id} style={{ padding: '15px', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}><input type="text" placeholder={`Tema ${i + 1}`} value={tema.nombre} onChange={e => updateTema(tema.id, 'nombre', e.target.value)} style={{ ...inputNeoStyle, flex: 1 }} /><button onClick={() => removeTema(tema.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={20} color={theme.textMuted}/></button></div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Estudio:</span><select value={tema.dificultad} onChange={e => updateTema(tema.id, 'dificultad', e.target.value)} style={{ ...inputNeoStyle, flex: 1 }}><option value="1">Baja (1h)</option><option value="2">Media (2h)</option><option value="3">Alta (3h)</option><option value="custom">Custom</option></select>{tema.dificultad === 'custom' && (<input type="number" placeholder="Horas" value={tema.horasCustom} onChange={e => updateTema(tema.id, 'horasCustom', e.target.value)} style={{ ...inputNeoStyle, width: '70px' }} />)}</div>
                        <div style={{ marginTop: '5px', padding: '10px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}><input type="checkbox" checked={tema.conEjercicios} onChange={e => updateTema(tema.id, 'conEjercicios', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: color }}/>Añadir ejercicios</label>{tema.conEjercicios && (<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Horas ejercicios:</span><input type="number" placeholder="Ej: 2" value={tema.horasEjercicios} onChange={e => updateTema(tema.id, 'horasEjercicios', e.target.value)} style={{ ...inputNeoStyle, width: '80px', padding: '5px' }} /></div>)}</div>
                    </div>
                ))}
                <button onClick={addTema} style={{ padding: '10px', borderRadius: '12px', border: `2px dashed ${theme.border}`, backgroundColor: 'transparent', fontWeight: '800', cursor: 'pointer' }}>+ Añadir Tema</button>
            </div>
        )}
        
        {tipo === 'entrega' && (<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}><h4 style={{ margin: '0', fontWeight: '800' }}>Apartados</h4>{apartados.map((ap, i) => (<div key={ap.id} style={{ display: 'flex', gap: '5px' }}><input type="text" placeholder={`Apt. ${i + 1}`} value={ap.nombre} onChange={e => updateApartado(ap.id, 'nombre', e.target.value)} style={{ ...inputNeoStyle, flex: 1 }} /><input type="number" placeholder="Horas" value={ap.horas} onChange={e => updateApartado(ap.id, 'horas', e.target.value)} style={{ ...inputNeoStyle, width: '80px' }} /><button onClick={() => removeApartado(ap.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={20} color={theme.textMuted}/></button></div>))}<button onClick={addApartado} style={{ padding: '10px', borderRadius: '12px', border: `2px dashed ${theme.border}`, backgroundColor: 'transparent', fontWeight: '800', cursor: 'pointer' }}>+ Añadir Apartado</button></div>)}
        
        <button onClick={handleGuardar} style={{ padding: '15px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.textDark, color: theme.cardWhite, fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 4px 0 ${theme.border}` }}>
          {itemAEditar ? 'Guardar Cambios' : 'Guardar Evento'}
        </button>
      </div>
    </Overlay>
  );
}

function ModalCapacidadBase({ base, setBase, onClose }) {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const idxMapa = [1, 2, 3, 4, 5, 6, 0];
  const guardarBase = (diaIdx, periodo, val) => setBase(prev => ({ ...prev, [diaIdx]: { ...prev[diaIdx], [periodo]: Number(val) } }));
  return (
    <Overlay onClose={onClose}>
      <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontWeight: '800' }}>Semana Base</h3><button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button></div>
        <div style={{ display: 'grid', gap: '10px' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontWeight: '800', fontSize: '0.8rem', textAlign: 'center', color: theme.textMuted, paddingBottom: '10px', borderBottom: `2px solid ${theme.border}` }}><span style={{ textAlign: 'left' }}>Día</span> <span>Mañ.</span> <span>Tar.</span> <span>Noc.</span></div>
          {dias.map((nombre, i) => { const dIdx = idxMapa[i]; return (<div key={dIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}><span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{nombre}</span><input type="number" min="0" value={base[dIdx].m} onChange={(e) => guardarBase(dIdx, 'm', e.target.value)} style={{...inputNeoStyle, textAlign: 'center', backgroundColor: theme.cardCream}} /><input type="number" min="0" value={base[dIdx].t} onChange={(e) => guardarBase(dIdx, 't', e.target.value)} style={{...inputNeoStyle, textAlign: 'center', backgroundColor: theme.cardYellow}} /><input type="number" min="0" value={base[dIdx].n} onChange={(e) => guardarBase(dIdx, 'n', e.target.value)} style={{...inputNeoStyle, textAlign: 'center', backgroundColor: theme.cardBlue}} /></div>); })}
        </div>
        <button onClick={onClose} style={{ padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.cardCoral, color: theme.cardWhite, fontWeight: '800', cursor: 'pointer', boxShadow: `0 4px 0 ${theme.border}` }}>Guardar</button>
      </div>
    </Overlay>
  );
}

function ModalEdicionDia({ fecha, capacidadExtra, setCapacidadExtra, capacidadBase, onClose }) {
  const horasActuales = capacidadExtra[fecha] || capacidadBase[new Date(fecha).getDay()] || { m: 0, t: 0, n: 0 };
  const [m, setM] = useState(horasActuales.m); const [t, setT] = useState(horasActuales.t); const [n, setN] = useState(horasActuales.n);
  const guardar = () => { setCapacidadExtra(prev => ({ ...prev, [fecha]: { m: Number(m), t: Number(t), n: Number(n) } })); onClose(); };
  const resetear = () => { const nx = { ...capacidadExtra }; delete nx[fecha]; setCapacidadExtra(nx); onClose(); };
  return (
    <Overlay onClose={onClose}>
      <div style={{...modalBoxStyle, maxWidth: '350px'}} onMouseDown={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: '0', fontWeight: '800' }}>Horas del {fecha}</h3><button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24}/></button></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: theme.cardWhite, padding: '15px', borderRadius: '16px', border: `2px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}><span>Mañana:</span> <input type="number" min="0" value={m} onChange={e => setM(e.target.value)} style={{...inputNeoStyle, width: '80px', textAlign: 'center', backgroundColor: theme.cardCream}} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}><span>Tarde:</span> <input type="number" min="0" value={t} onChange={e => setT(e.target.value)} style={{...inputNeoStyle, width: '80px', textAlign: 'center', backgroundColor: theme.cardYellow}} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' }}><span>Noche:</span> <input type="number" min="0" value={n} onChange={e => setN(e.target.value)} style={{...inputNeoStyle, width: '80px', textAlign: 'center', backgroundColor: theme.cardBlue}} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}><button onClick={resetear} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.bg, fontWeight: '800', cursor: 'pointer', boxShadow: `0 3px 0 ${theme.border}` }}>Usar Defecto</button><button onClick={guardar} style={{ flex: 1, padding: '12px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.cardCoral, color: theme.cardWhite, fontWeight: '800', cursor: 'pointer', boxShadow: `0 3px 0 ${theme.border}` }}>Guardar</button></div>
      </div>
    </Overlay>
  );
}