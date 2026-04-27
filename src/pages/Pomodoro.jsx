// src/pages/Pomodoro.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobalState } from '../store/GlobalContext';
import { ModalCrearEvento, theme, inputNeoStyle, modalBoxStyle, Overlay } from './Calendario';
import { Play, Pause, SkipForward, Settings, Check, ArrowLeft, ListTodo, ChevronLeft, Bell, BellOff, Plus, Maximize2, Minimize2 } from 'lucide-react'; // Añadidos iconos Maximize/Minimize
import { useNavigate } from 'react-router-dom';

// REDUCIDO: Bordes más finos (2px en lugar de 3px/4px) y sombras más suaves
const btnStyle = { padding: '10px 16px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: theme.cardWhite, color: theme.textDark, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 2px 0 ${theme.border}`, transition: 'transform 0.1s' };

export default function Pomodoro() {
  const navigate = useNavigate();
  const { tareas, examenes, entregas, updateTarea, updateExamen, updateEntrega, pomodoro, setPomodoro, planiConfig, setPlaniConfig, planiTareas, setPlaniTareas } = useGlobalState();
  
  const [tab, setTab] = useState('pomodoro'); // 'pomodoro' | 'planificador'
  const [showSettings, setShowSettings] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [showCompletion, setShowCompletion] = useState(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // NUEVO ESTADO PARA PANTALLA COMPLETA

  // 1. LA IP SIEMPRE FUERA Y ARRIBA DEL TODO (justo debajo de los useState)
  const ESP32_IP = localStorage.getItem('esp32_ip') || "192.168.0.44";
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSyncTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. COMUNICACIÓN TOTAL CON EL ESP32
  useEffect(() => {
    const minutos = Math.floor(pomodoro.timeLeft / 60).toString().padStart(2, '0');
    const segundos = (pomodoro.timeLeft % 60).toString().padStart(2, '0');
    const timeString = `${minutos}:${segundos}`;
    
    let modeString = "Enfoque";
    if (pomodoro.mode === 'shortBreak') modeString = "Descanso Corto";
    if (pomodoro.mode === 'longBreak') modeString = "Descanso Largo";
    
    const planiPayload = planiTareas.slice(0, 3).map(p => ({
        n: p.nombre,
        t: `${Math.floor(p.segundosRestantes/60)}:${(p.segundosRestantes%60).toString().padStart(2,'0')}`,
        c: p.corriendo
    }));

    fetch(`http://${ESP32_IP}/update`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, 
      body: JSON.stringify({
        time: timeString,
        mode: modeString,
        isActive: pomodoro.isActive,
        plani: planiPayload, 
        tareas: tareas.filter(t => !t.completada).map(t => t.titulo).slice(0, 15),
        examenes: examenes.map(e => e.titulo).slice(0, 15),
        entregas: entregas.map(e => e.titulo).slice(0, 15)
      })
    })
    .then(res => res.json())
    .then(data => {
      // AQUÍ ESTÁ LA LECTURA DE LOS BOTONES DE LA PLACA
      if (data.command === "TOGGLE") {
          toggleTimer();
      } 
      else if (data.command.startsWith("PLANI_")) {
          const idx = parseInt(data.command.split("_")[1]);
          if (planiTareas[idx]) {
              const tareaId = planiTareas[idx].id;
              setPlaniTareas(prev => prev.map(t => {
                if (t.id === tareaId) return t.corriendo ? { ...t, corriendo: false, endsAt: null } : { ...t, corriendo: true, endsAt: Date.now() + t.segundosRestantes * 1000, notificada: false };
                return { ...t, corriendo: false, endsAt: null }; 
              }));
          }
      }
    })
    .catch(() => {}); 
  }, [pomodoro.timeLeft, pomodoro.isActive, pomodoro.mode, tareas, examenes, entregas, planiTareas, syncTick]); // <-- syncTick ES LA MAGIA AQUÍ
  
  


  // 3. CAMBIO DE PANTALLA (Se ejecuta solo al entrar y salir del Pomodoro)
  useEffect(() => {
    // Al entrar a la página: Forzar vista Pomodoro
    fetch(`http://${ESP32_IP}/setScreen?screen=POMODORO`).catch(() => {});
    
    // Al salir de la página (return): Volver al Menú
    return () => {
      fetch(`http://${ESP32_IP}/setScreen?screen=MENU`).catch(() => {});
    };
  }, []);


  // 4. PERMISOS DE NOTIFICACIONES (Se ejecuta al arrancar)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);


  // --- REDUCIR TIEMPO A TAREAS GLOBALES ---
  const deductTime = (taskRef, minutes) => {
    const hrs = minutes / 60;
    let newHrsLeft = 1;
    if (taskRef.type === 'tarea') {
      const t = tareas.find(x => x.id === taskRef.id);
      if (t) { newHrsLeft = Math.max(0, parseFloat(t.horasEstimadas || 0) - hrs); updateTarea(t.id, { horasEstimadas: newHrsLeft.toFixed(1) }); }
    } else if (taskRef.type === 'examen') {
      const ex = examenes.find(x => x.id === taskRef.id);
      if (ex) {
        const newTemas = ex.temas.map(tema => tema.id === taskRef.subId ? { ...tema, dificultad: 'custom', horasCustom: Math.max(0, parseFloat(tema.horasCustom||tema.dificultad) - hrs).toFixed(1) } : tema);
        updateExamen(ex.id, { temas: newTemas });
        newHrsLeft = parseFloat(newTemas.find(x => x.id === taskRef.subId).horasCustom);
      }
    } else if (taskRef.type === 'entrega') {
      const en = entregas.find(x => x.id === taskRef.id);
      if (en) {
        const newAps = en.apartados.map(ap => ap.id === taskRef.subId ? { ...ap, horas: Math.max(0, parseFloat(ap.horas||0) - hrs).toFixed(1) } : ap);
        updateEntrega(en.id, { apartados: newAps });
        newHrsLeft = parseFloat(newAps.find(x => x.id === taskRef.subId).horas);
      }
    }
    return newHrsLeft;
  };

  // --- LOGICA DE FINALIZACIÓN POMODORO ---
  useEffect(() => {
    if (pomodoro.needsCompletionHandle) {
      let hoursLeft = 1;
      if (pomodoro.mode === 'focus' && pomodoro.activeTask) hoursLeft = deductTime(pomodoro.activeTask, pomodoro.settings.focus);

      let nextMode = pomodoro.mode;
      let nextTime = 0;
      let newCycles = pomodoro.cyclesCompleted;

      if (pomodoro.mode === 'focus') {
        newCycles += 1;
        if (newCycles % pomodoro.settings.cycles === 0) { nextMode = 'longBreak'; nextTime = pomodoro.settings.long * 60; }
        else { nextMode = 'shortBreak'; nextTime = pomodoro.settings.short * 60; }
      } else { nextMode = 'focus'; nextTime = pomodoro.settings.focus * 60; }

      setPomodoro(prev => ({ ...prev, mode: nextMode, timeLeft: nextTime, cyclesCompleted: newCycles, needsCompletionHandle: false, isActive: prev.mode === 'focus', endsAt: prev.mode === 'focus' ? Date.now() + nextTime * 1000 : null }));
      if (pomodoro.mode === 'focus' && pomodoro.activeTask && hoursLeft <= 0) {
        setPomodoro(prev => ({...prev, isActive: false, endsAt: null}));
        setShowCompletion(pomodoro.activeTask);
        setIsFullScreen(false); // Salir de pantalla completa si termina
      }
    }
  }, [pomodoro.needsCompletionHandle]);

  // --- RECOPILAR TODO EL BACKLOG ---
  const pendingWork = useMemo(() => {
    const work = [];

    // 1. Tareas normales
    tareas.filter(t => !t.completada).forEach(t => {
      work.push({ 
        type: 'tarea', 
        id: t.id, 
        title: t.titulo, 
        hours: parseFloat(t.horasEstimadas || 0), 
        color: t.color || theme.cardYellow 
      });
    });

    // 2. Exámenes (Temas y Ejercicios)
    examenes.forEach(ex => ex.temas?.forEach(tema => {
      if (!tema.completado) {
        let hrs = tema.dificultad === 'custom' ? parseFloat(tema.horasCustom || 0) : parseFloat(tema.dificultad || 1);
        if (hrs > 0) {
          work.push({ 
            type: 'examen', 
            id: ex.id, 
            subId: tema.id, 
            title: `${ex.titulo}: ${tema.nombre}`, 
            hours: hrs, 
            color: ex.color || theme.cardCoral 
          });
        }
      }
      if (tema.conEjercicios && !tema.ejerciciosCompletados) {
        work.push({ 
          type: 'examen', 
          id: ex.id, 
          subId: tema.id, 
          isEjercicios: true,
          title: `Ejercicios: ${tema.nombre} (${ex.titulo})`, 
          hours: parseFloat(tema.horasEjercicios || 0), // ¡Número 0!
          color: '#FAD4C0' 
        });
      }
    }));

    // 3. Entregas (Apartados)
    entregas.forEach(en => en.apartados?.forEach(ap => {
      if (!ap.completado && parseFloat(ap.horas || 0) > 0) { // ¡Número 0!
        work.push({ 
          type: 'entrega', 
          id: en.id, 
          subId: ap.id, 
          title: `${en.titulo}: ${ap.nombre}`, 
          hours: parseFloat(ap.horas || 0), // ¡Número 0!
          color: en.color || theme.cardBlue 
        });
      }
    }));

    return work;
  }, [tareas, examenes, entregas]);

  // --- CONTROLES POMODORO ---
  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const getModeColor = () => pomodoro.mode === 'focus' ? theme.cardCoral : pomodoro.mode === 'shortBreak' ? theme.cardBlue : theme.cardYellow;
  const toggleTimer = () => setPomodoro(prev => prev.isActive ? { ...prev, isActive: false, endsAt: null } : { ...prev, isActive: true, endsAt: Date.now() + prev.timeLeft * 1000 });
  const skipSession = () => setPomodoro(prev => ({ ...prev, isActive: false, endsAt: null, needsCompletionHandle: true }));

  // ================= VISTA PANTALLA COMPLETA =================
  if (isFullScreen) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: getModeColor(), // Fondo del color del modo actual
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, color: '#FFF', fontFamily: theme.font
      }}>
        
        {/* Botón para salir */}
        <button onClick={() => setIsFullScreen(false)} style={{
          position: 'absolute', top: '30px', left: '20px',
          background: 'none', border: 'none', color: '#FFF', cursor: 'pointer',
          padding: '10px'
        }}>
          <Minimize2 size={32} />
        </button>

        {/* Info Tarea (opcional, muy sutil) */}
        {pomodoro.activeTask && (
          <div style={{ position: 'absolute', top: '40px', fontWeight: 700, opacity: 0.8, fontSize: '1.2rem', textAlign: 'center', padding: '0 20px' }}>
            {pomodoro.activeTask.title}
          </div>
        )}

        {/* Temporizador Gigante y limpio (ARREGLADO) */}
        <div style={{ 
          fontSize: '8rem', 
          fontWeight: 900, 
          letterSpacing: '-4px', 
          textShadow: '0 4px 10px rgba(0,0,0,0.1)',
          lineHeight: '1', // Evita que se monte el texto
          margin: '20px 0'   // Le da espacio arriba y abajo
        }}>
          {formatTime(pomodoro.timeLeft)}
        </div>

        <div style={{ fontWeight: 800, fontSize: '1.2rem', opacity: 0.9 }}>
          {pomodoro.mode === 'focus' ? `Ciclo ${pomodoro.cyclesCompleted % pomodoro.settings.cycles + 1} de ${pomodoro.settings.cycles}` : pomodoro.mode === 'shortBreak' ? '' : 'Descanso Largo'}
        </div>

        {/* Controles limpios */}
        <div style={{ display: 'flex', gap: '30px', marginTop: '50px' }}>
          <button onClick={toggleTimer} style={{
            width: '90px', height: '90px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(5px)'
          }}>
            {pomodoro.isActive ? <Pause size={45} color="#FFF" fill="#FFF" /> : <Play size={45} color="#FFF" fill="#FFF" style={{ marginLeft: '6px' }} />}
          </button>
          
          <button onClick={skipSession} style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            alignSelf: 'center'
          }}>
            <SkipForward size={28} color="#FFF" />
          </button>
        </div>
      </div>
    );
  }

  // ================= RENDERIZADO NORMAL =================
  return (
    <div style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))', paddingRight: '20px', paddingBottom: '24px', paddingLeft: '20px', minHeight: '100vh', backgroundColor: theme.bg, color: theme.textDark, fontFamily: theme.font, display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER & TABS */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}><ArrowLeft size={28} /></button>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textDark }}><Settings size={28} /></button>
      </header>

      {/* REDUCIDO: Bordes más finos en el selector de tabs */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: theme.cardWhite, padding: '8px', borderRadius: '24px', border: `2px solid ${theme.border}`, marginBottom: '25px', boxShadow: `0 2px 0 ${theme.border}` }}>
         <button onClick={() => setTab('pomodoro')} style={{ flex: 1, padding: '10px', borderRadius: '16px', backgroundColor: tab === 'pomodoro' ? theme.cardCoral : 'transparent', color: tab === 'pomodoro' ? '#FFF' : theme.textMuted, border: 'none', fontWeight: 900, transition: 'all 0.2s', fontSize: '0.9rem' }}>Pomodoro</button>
         <button onClick={() => setTab('planificador')} style={{ flex: 1, padding: '10px', borderRadius: '16px', backgroundColor: tab === 'planificador' ? theme.cardBlue : 'transparent', color: tab === 'planificador' ? '#FFF' : theme.textMuted, border: 'none', fontWeight: 900, transition: 'all 0.2s', fontSize: '0.9rem' }}>Planificador</button>
      </div>

      {/* --- VISTA 1: POMODORO CLÁSICO --- */}
      {tab === 'pomodoro' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', position: 'relative' }}>
          
          {/* Botón Maximizar */}
          <button 
            onClick={() => setIsFullScreen(true)}
            style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}
            title="Pantalla Completa"
          >
            <Maximize2 size={24} />
          </button>

          {/* REDUCIDO: Bordes en los selectores de modo */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: theme.cardWhite, padding: '8px', borderRadius: '30px', border: `2px solid ${theme.border}`, boxShadow: `0 2px 0 ${theme.border}` }}>
            <button onClick={() => setPomodoro(p => ({...p, mode: 'focus', isActive: false, endsAt: null, timeLeft: p.settings.focus*60}))} style={{ ...btnStyle, flex: 1, padding: '8px 16px', fontSize: '0.8rem', borderRadius: '20px', backgroundColor: pomodoro.mode === 'focus' ? theme.cardCoral : 'transparent', border: 'none', boxShadow: 'none', color: pomodoro.mode === 'focus' ? '#FFF' : theme.textDark }}>Enfoque</button>
            <button onClick={() => setPomodoro(p => ({...p, mode: 'shortBreak', isActive: false, endsAt: null, timeLeft: p.settings.short*60}))} style={{ ...btnStyle, flex: 1, padding: '8px 16px', fontSize: '0.8rem', borderRadius: '20px', backgroundColor: pomodoro.mode === 'shortBreak' ? theme.cardBlue : 'transparent', border: 'none', boxShadow: 'none', color: pomodoro.mode === 'shortBreak' ? '#FFF' : theme.textDark }}>Corto</button>
            <button onClick={() => setPomodoro(p => ({...p, mode: 'longBreak', isActive: false, endsAt: null, timeLeft: p.settings.long*60}))} style={{ ...btnStyle, flex: 1, padding: '8px 16px', fontSize: '0.8rem', borderRadius: '20px', backgroundColor: pomodoro.mode === 'longBreak' ? theme.cardYellow : 'transparent', border: 'none', boxShadow: 'none', color: pomodoro.mode === 'longBreak' ? '#FFF' : theme.textDark }}>Largo</button>
          </div>

          {/* CUADRADO REDONDEADO GIGANTE (SQUIRCLE) - REDUCIDO BORDES */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '260px', height: '260px', borderRadius: '48px', backgroundColor: getModeColor(), border: `4px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 0 ${theme.border}`, transition: 'all 0.3s ease', zIndex: 5 }}>
              <span style={{ fontSize: '5.5rem', fontWeight: 900, color: '#FFF', letterSpacing: '-2px', textShadow: `0 3px 0 ${theme.border}` }}>
                {formatTime(pomodoro.timeLeft)}
              </span>
            </div>
            {/* CAJA DE CICLOS SEPARADA - REDUCIDO BORDES */}
            <div style={{ backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, padding: '8px 24px', borderRadius: '16px', fontWeight: 900, marginTop: '-20px', zIndex: 10, color: theme.textDark, boxShadow: `0 2px 0 ${theme.border}`, fontSize: '0.9rem' }}>
              {pomodoro.mode === 'focus' ? `Ciclo ${pomodoro.cyclesCompleted % pomodoro.settings.cycles + 1} de ${pomodoro.settings.cycles}` : pomodoro.mode === 'shortBreak' ? 'Descanso Corto' : 'Descanso Largo'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <button onClick={toggleTimer} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: pomodoro.isActive ? theme.cardYellow : theme.textDark, border: `3px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 0 ${theme.border}` }}>
              {pomodoro.isActive ? <Pause size={40} color={theme.textDark} fill={theme.textDark} /> : <Play size={40} color={theme.cardWhite} fill={theme.cardWhite} style={{ marginLeft: '6px' }} />}
            </button>
            <button onClick={skipSession} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 2px 0 ${theme.border}`, alignSelf: 'center' }}>
              <SkipForward size={24} color={theme.textDark} />
            </button>
          </div>

          {/* Selector Tarea Inferior - REDUCIDO BORDES */}
          <div style={{ width: '100%', backgroundColor: theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '24px', padding: '20px', boxShadow: `0 4px 0 ${theme.border}`, marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }} onClick={() => setShowSelector(true)} >
                  {pomodoro.activeTask ? (<><div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: pomodoro.activeTask.color || theme.cardCoral }} /><span style={{ fontWeight: 800, fontSize: '1rem' }}>{pomodoro.activeTask.title}</span></>) : (<><ListTodo size={20} color={theme.textMuted}/><span style={{ fontWeight: 700, fontSize: '0.9rem', color: theme.textMuted }}>Escoge una Tarea</span></>)}
              </div>
              {pomodoro.activeTask && ( <div style={{ fontWeight: 800, fontSize: '1rem', color: theme.cardCoral }}>{pomodoro.activeTask.hours}h</div> )}
            </div>
            {pomodoro.activeTask ? (
                <button onClick={() => setShowSelector(true)} style={{ ...btnStyle, width: '100%', padding: '10px', fontSize: '0.85rem' }}>Cambiar de Tarea</button>
            ) : (
                <button onClick={() => setShowSelector(true)} style={{ ...btnStyle, width: '100%', backgroundColor: theme.bg, borderStyle: 'dashed' }}>Abrir Backlog</button>
            )}
          </div>
        </div>
      )}

      {/* --- VISTA 2: PLANIFICADOR MAGICO --- */}
      {tab === 'planificador' && (
        <PlanificadorView pendingWork={pendingWork} planiConfig={planiConfig} setPlaniConfig={setPlaniConfig} planiTareas={planiTareas} setPlaniTareas={setPlaniTareas} deductTime={deductTime} />
      )}

      {/* BOTÓN FLOTANTE PARA AÑADIR TAREAS GLOBALES */}
      {!isFullScreen && (
        <button onClick={() => setModalCrearAbierto(true)} style={{ position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '20px', backgroundColor: theme.cardFrog, border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 0 ${theme.border}`, cursor: 'pointer', zIndex: 100 }}>
            <Plus size={35} strokeWidth={3} color={theme.textDark} />
        </button>
      )}

      {/* MODALES */}
      {modalCrearAbierto && <ModalCrearEvento onClose={() => setModalCrearAbierto(false)} defaultTab="tarea" />}
      
      {/* ... (Modal Settings y Modal Selector se mantienen igual, usando btnStyle actualizado) */}
      {showSettings && (
        <Overlay onClose={() => setShowSettings(false)}>
          <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><ChevronLeft size={24} color={theme.textMuted}/> <h3 style={{ margin: 0, fontWeight: 900 }}>Ajustes</h3> <div onClick={() => setShowSettings(false)} style={{cursor: 'pointer', fontWeight: 'bold'}}>✕</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
              <div><label style={{ fontWeight: 800, fontSize: '0.75rem', color: theme.textMuted, display: 'block', textAlign: 'center' }}>Foco</label><input type="number" step="5" value={pomodoro.settings.focus} onChange={e => setPomodoro(p => ({...p, settings: {...p.settings, focus: Number(e.target.value)}}))} style={inputNeoStyle} /></div>
              <div><label style={{ fontWeight: 800, fontSize: '0.75rem', color: theme.textMuted, display: 'block', textAlign: 'center' }}>Corto</label><input type="number" step="1" value={pomodoro.settings.short} onChange={e => setPomodoro(p => ({...p, settings: {...p.settings, short: Number(e.target.value)}}))} style={inputNeoStyle} /></div>
              <div><label style={{ fontWeight: 800, fontSize: '0.75rem', color: theme.textMuted, display: 'block', textAlign: 'center' }}>Largo</label><input type="number" step="5" value={pomodoro.settings.long} onChange={e => setPomodoro(p => ({...p, settings: {...p.settings, long: Number(e.target.value)}}))} style={inputNeoStyle} /></div>
            </div>
            <div><label style={{ fontWeight: 800, fontSize: '0.8rem', color: theme.textMuted, display: 'block', textAlign: 'center', marginBottom: '8px' }}>Ciclos para Largo</label><input type="number" value={pomodoro.settings.cycles} onChange={e => setPomodoro(p => ({...p, settings: {...p.settings, cycles: Number(e.target.value)}}))} style={inputNeoStyle} /></div>
            <button onClick={() => setShowSettings(false)} style={{ ...btnStyle, backgroundColor: theme.textDark, color: theme.cardWhite, padding: '15px' }}>Guardar</button>
          </div>
        </Overlay>
      )}

      {showSelector && (
        <Overlay onClose={() => setShowSelector(false)}>
          <div style={{...modalBoxStyle, maxWidth: '450px'}} onMouseDown={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontWeight: 900, textAlign: 'center' }}>Selecciona del Backlog</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
              {pendingWork.map((item, idx) => (
                <div key={idx} onClick={() => { setPomodoro(p => ({...p, activeTask: item})); setShowSelector(false); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '16px', border: `2px solid ${theme.border}`, backgroundColor: item.color, cursor: 'pointer', boxShadow: `0 2px 0 ${theme.border}` }}>
                  <span style={{ flex: 1, paddingRight: '15px', fontWeight: 800, fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.2' }}>{item.title}</span>
                  <span style={{ backgroundColor: theme.cardWhite, padding: '5px 10px', borderRadius: '10px', border: `1px solid ${theme.border}`, fontWeight: 800, fontSize: '0.85rem' }}>{item.hours}h</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSelector(false)} style={btnStyle}>Cerrar</button>
          </div>
        </Overlay>
      )}

      {showCompletion && (
        <Overlay onClose={() => setShowCompletion(null)}>
          <div style={modalBoxStyle} onMouseDown={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: theme.cardYellow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: `2px solid ${theme.border}`, boxShadow: `0 3px 0 ${theme.border}` }}><Check size={35} strokeWidth={4} /></div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>¡Has llegado a 0 horas!</h3>
              <p style={{ fontWeight: 700, color: theme.textMuted }}>En tu tarea:<br/> <strong style={{ color: theme.textDark }}>{showCompletion.title}</strong></p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => {
                if(showCompletion.type === 'tarea') updateTarea(showCompletion.id, { completada: true });
                else deductTime(showCompletion, showCompletion.hours * 60); // Deja a 0
                if(pomodoro.activeTask?.id === showCompletion.id) setPomodoro(p => ({...p, activeTask: null}));
                setShowCompletion(null);
              }} style={{ ...btnStyle, backgroundColor: theme.textDark, color: theme.cardWhite, padding: '15px' }}>Marcar como Completada</button>
              <button onClick={() => {
                let current = showCompletion.hours;
                if(showCompletion.type === 'tarea') updateTarea(showCompletion.id, { horasEstimadas: (current + 1).toFixed(1) });
                alert('Añadida 1 hora extra. Puedes editarla en detalle desde su ficha.');
                setShowCompletion(null);
              }} style={{ ...btnStyle, backgroundColor: theme.cardWhite, padding: '15px' }}><Plus size={18}/> Necesito más tiempo</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// =======================================================
// SUB-COMPONENTE: PLANIFICADOR (Adaptado a Globales)
// =======================================================
function PlanificadorView({ pendingWork, planiConfig, setPlaniConfig, planiTareas, setPlaniTareas, deductTime }) {
  const [horasInput, setHorasInput] = useState(planiConfig.horasConfirmadas?.toString() || '');
  const [prioridad, setPrioridad] = useState(2);
  const [selectedIdx, setSelectedIdx] = useState("");

  const distribuir = (lista, totalMinutos) => {
    if (!lista.length) return lista;
    const pesos = { 1: 1, 2: 2, 3: 3.5 };
    const pesoTotal = lista.reduce((s, t) => s + pesos[t.prioridad], 0);
    return lista.map(t => {
      const base = (pesos[t.prioridad] / pesoTotal) * totalMinutos;
      const variacion = base * (0.85 + Math.random() * 0.3);
      const minutos = Math.max(5, Math.round(variacion));
      return { ...t, minutos, segundosRestantes: minutos * 60, corriendo: false, endsAt: null, notificada: false };
    });
  };

  const confirmarHoras = () => {
    const h = parseFloat(horasInput);
    if (h > 0) {
      setPlaniConfig(prev => ({...prev, horasConfirmadas: h}));
      if (planiTareas.length) setPlaniTareas(distribuir(planiTareas, Math.round(h * 60)));
    }
  };

  const añadirTarea = () => {
    if (selectedIdx === "" || !planiConfig.horasConfirmadas) return;
    const work = pendingWork[selectedIdx];
    const nueva = { id: Date.now(), nombre: work.title, globalRef: work, prioridad: parseInt(prioridad), color: work.color };
    setPlaniTareas(distribuir([...planiTareas, nueva], Math.round(planiConfig.horasConfirmadas * 60)));
    setSelectedIdx("");
  };

  const togglePlaniTimer = (id) => {
    setPlaniTareas(prev => prev.map(t => {
      if (t.id === id) return t.corriendo ? { ...t, corriendo: false, endsAt: null } : { ...t, corriendo: true, endsAt: Date.now() + t.segundosRestantes * 1000, notificada: false };
      return { ...t, corriendo: false, endsAt: null }; // Pausa los demás
    }));
  };

  const marcarHecho = (t) => {
    deductTime(t.globalRef, t.minutos); // Descuenta las horas asignadas del global
    setPlaniTareas(distribuir(planiTareas.filter(x => x.id !== t.id), Math.round(planiConfig.horasConfirmadas * 60)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* PANEL SUPERIOR: HORAS Y DONUT */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', backgroundColor: theme.cardWhite, padding: '20px', borderRadius: '24px', border: `2px solid ${theme.border}`, boxShadow: `0 3px 0 ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setPlaniConfig(p => ({...p, sonidoActivo: !p.sonidoActivo}))} style={{ background: planiConfig.sonidoActivo ? theme.cardFrog : theme.bg, border: `2px solid ${theme.border}`, padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {planiConfig.sonidoActivo ? <><Bell size={14}/> ON</> : <><BellOff size={14} color={theme.textMuted}/> OFF</>}
            </button>
          </div>
          <label style={{ fontWeight: 900, fontSize: '1rem' }}>Horas libres hoy:</label>
          <input type="number" step="0.5" placeholder="Ej: 4" value={horasInput} onChange={e => setHorasInput(e.target.value)} style={{...inputNeoStyle, fontSize: '1.2rem', textAlign: 'center'}} />
          <button onClick={confirmarHoras} style={{ ...btnStyle, backgroundColor: theme.cardBlue, color: '#FFF' }}>{planiConfig.horasConfirmadas ? 'Redistribuir' : 'Confirmar'}</button>
        </div>

        {planiTareas.length > 0 && (
          <div style={{ flex: 1, minWidth: '150px', backgroundColor: theme.cardWhite, padding: '20px', borderRadius: '24px', border: `2px solid ${theme.border}`, boxShadow: `0 3px 0 ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart tareas={planiTareas} />
          </div>
        )}
      </div>

      {/* AÑADIR AL PLANIFICADOR DESDE EL BACKLOG */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select value={selectedIdx} onChange={e => setSelectedIdx(e.target.value)} style={{...inputNeoStyle, flex: 2, minWidth: '150px'}} disabled={!planiConfig.horasConfirmadas}>
          <option value="">Añadir del Backlog...</option>
          {pendingWork.map((pw, i) => ( <option key={i} value={i}>{pw.title} ({pw.hours}h)</option> ))}
        </select>
        <select value={prioridad} onChange={e => setPrioridad(e.target.value)} style={{...inputNeoStyle, flex: 1, minWidth: '110px'}} disabled={!planiConfig.horasConfirmadas}>
          <option value={3}>3 - Alta</option><option value={2}>2 - Media</option><option value={1}>1 - Baja</option>
        </select>
        <button onClick={añadirTarea} disabled={!planiConfig.horasConfirmadas || selectedIdx === ""} style={{ ...btnStyle, backgroundColor: theme.cardYellow }}>Añadir</button>
      </div>

      {/* LISTA DE TAREAS CORRIENDO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {planiTareas.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: t.corriendo ? '#f0fdf4' : theme.cardWhite, border: `2px solid ${theme.border}`, borderRadius: '16px', padding: '12px', boxShadow: `0 2px 0 ${theme.border}`, opacity: t.segundosRestantes === 0 ? 0.6 : 1 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
              <div style={{ marginTop: '6px', height: '6px', borderRadius: '3px', background: theme.bg, border: `1px solid ${theme.border}` }}>
                <div style={{ height: '100%', borderRadius: '2px', background: t.color, width: `${(1 - t.segundosRestantes / (t.minutos * 60)) * 100}%`, transition: 'width 1s linear' }} />
              </div>
            </div>
            
            <div style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1rem', width: '55px', textAlign: 'right' }}>
              {t.segundosRestantes === 0 ? 'Hecho' : `${Math.floor(t.segundosRestantes/60)}:${(t.segundosRestantes%60).toString().padStart(2,'0')}`}
            </div>
            
            {t.segundosRestantes === 0 ? (
               <button onClick={() => marcarHecho(t)} style={{ ...btnStyle, padding: '8px', backgroundColor: theme.cardFrog }}><Check size={18}/></button>
            ) : (
               <button onClick={() => togglePlaniTimer(t.id)} style={{ ...btnStyle, padding: '8px', backgroundColor: t.corriendo ? theme.cardYellow : theme.textDark }} >
                 {t.corriendo ? <Pause size={18}/> : <Play size={18} color="#FFF" fill="#FFF"/>}
               </button>
            )}
          </div>
        ))}
      </div>

      {planiTareas.length > 0 && (
        <button onClick={() => { setPlaniTareas([]); setPlaniConfig(p => ({...p, horasConfirmadas: null})); setHorasInput(''); }} style={{ ...btnStyle, marginTop: '20px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderColor: '#D32F2F', boxShadow: '0 2px 0 #D32F2F' }}>
          Limpiar Planificador (Reset)
        </button>
      )}
    </div>
  );
}

// --- GRÁFICO DONUT ---
const DonutChart = ({ tareas }) => {
  const total = tareas.reduce((s, t) => s + t.minutos, 0);
  if (!total) return null;
  let acumulado = 0; const radio = 50, cx = 70, cy = 70, grosor = 18;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <svg width="140" height="140" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={radio} fill="none" stroke={theme.bg} strokeWidth={grosor} />
      {tareas.map((t, i) => {
        const porcentaje = t.minutos / total;
        const dashArray = porcentaje * circunferencia;
        const dashOffset = -acumulado * circunferencia;
        acumulado += porcentaje;
        return <circle key={i} cx={cx} cy={cy} r={radio} fill="none" stroke={t.color} strokeWidth={grosor} strokeDasharray={`${dashArray} ${circunferencia}`} strokeDashoffset={dashOffset} transform={`rotate(-90 ${cx} ${cy})`} />
      })}
      <text x={cx} y={cy} textAnchor="middle" fontSize="16" fontWeight="900" fill={theme.textDark} dominantBaseline="central">
        {Math.floor(total / 60)}h {total % 60 > 0 ? `${total%60}m` : ''}
      </text>
    </svg>
  );
};