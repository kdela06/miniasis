// src/store/GlobalContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const GlobalContext = createContext();
export const useGlobalState = () => useContext(GlobalContext);

// --- SONIDO DE ALARMA (Sin dependencias) ---
export const playAlarm = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const tonos = [523, 659, 784]; 
        tonos.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.3);
            osc.start(ctx.currentTime + i * 0.2);
            osc.stop(ctx.currentTime + i * 0.2 + 0.3);
        });
    } catch (e) { console.warn('Audio falló:', e); }
};

// --- FUNCION DE FUSION DE DATOS DESDE QR (Evita duplicados y preserva datos locales) ---

const fusionarDatos = (datosEscaneados) => {
  try {
    setTareas(prev => {
      const idsActuales = new Set(prev.map(t => t.id));
      const tareasNuevas = (datosEscaneados.tareas || []).filter(t => !idsActuales.has(t.id));
      return [...prev, ...tareasNuevas];
    });

    setExamenes(prev => {
      const idsActuales = new Set(prev.map(e => e.id));
      const examenesNuevos = (datosEscaneados.examenes || []).filter(e => !idsActuales.has(e.id));
      return [...prev, ...examenesNuevos];
    });

    setEntregas(prev => {
      const idsActuales = new Set(prev.map(e => e.id));
      const entregasNuevas = (datosEscaneados.entregas || []).filter(e => !idsActuales.has(e.id));
      return [...prev, ...entregasNuevas];
    });

    setPlanificacion(prev => ({
      ...datosEscaneados.planificacion, 
      ...prev                           
    }));

    setCapacidadExtra(prev => ({
      ...datosEscaneados.capacidadExtra,
      ...prev
    }));

    alert("¡Datos fusionados correctamente!");
  } catch (error) {
    console.error("Error al fusionar datos:", error);
    alert("Hubo un error al interpretar los datos del código QR.");
  }
};

export const GlobalProvider = ({ children }) => {
  const [tareas, setTareas] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [capacidadBase, setCapacidadBase] = useState({
    1: { m: 2, t: 2, n: 0 }, 2: { m: 2, t: 2, n: 0 }, 3: { m: 2, t: 2, n: 0 },
    4: { m: 2, t: 2, n: 0 }, 5: { m: 2, t: 2, n: 0 }, 6: { m: 4, t: 4, n: 0 }, 0: { m: 2, t: 2, n: 0 },
  });
  const [capacidadExtra, setCapacidadExtra] = useState({});
  const [planificacion, setPlanificacion] = useState({});

  const [pomodoro, setPomodoro] = useState({
    settings: { focus: 25, short: 5, long: 15, cycles: 4 },
    mode: 'focus', timeLeft: 25 * 60, isActive: false, endsAt: null,
    cyclesCompleted: 0, activeTask: null, needsCompletionHandle: false
  });
  
  const [planiConfig, setPlaniConfig] = useState({ horasConfirmadas: null, sonidoActivo: true });
  const [planiTareas, setPlaniTareas] = useState([]);

  const fusionarDatos = (datosEscaneados) => {
    try {
      setTareas(prev => {
        const idsActuales = new Set(prev.map(t => t.id));
        const tareasNuevas = (datosEscaneados.tareas || []).filter(t => !idsActuales.has(t.id));
        return [...prev, ...tareasNuevas];
      });

      setExamenes(prev => {
        const idsActuales = new Set(prev.map(e => e.id));
        const examenesNuevos = (datosEscaneados.examenes || []).filter(e => !idsActuales.has(e.id));
        return [...prev, ...examenesNuevos];
      });

      setEntregas(prev => {
        const idsActuales = new Set(prev.map(e => e.id));
        const entregasNuevas = (datosEscaneados.entregas || []).filter(e => !idsActuales.has(e.id));
        return [...prev, ...entregasNuevos];
      });

      setPlanificacion(prev => ({
        ...datosEscaneados.planificacion, 
        ...prev                           
      }));

      setCapacidadExtra(prev => ({
        ...datosEscaneados.capacidadExtra,
        ...prev
      }));

      alert("¡Datos fusionados correctamente!");
    } catch (error) {
      console.error("Error al fusionar datos:", error);
      alert("Hubo un error al interpretar el archivo.");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('brokenMimi_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.tareas) setTareas(parsed.tareas);
      if (parsed.examenes) setExamenes(parsed.examenes);
      if (parsed.entregas) setEntregas(parsed.entregas);
      if (parsed.capacidadBase) setCapacidadBase(parsed.capacidadBase);
      if (parsed.capacidadExtra) setCapacidadExtra(parsed.capacidadExtra);
      if (parsed.planificacion) setPlanificacion(parsed.planificacion);
      if (parsed.planiConfig) setPlaniConfig(parsed.planiConfig);
      
      if (parsed.pomodoro) {
          let p = parsed.pomodoro;
          if (p.isActive && p.endsAt) {
              const left = Math.round((p.endsAt - Date.now()) / 1000);
              if (left <= 0) p = { ...p, timeLeft: 0, isActive: false, endsAt: null, needsCompletionHandle: true };
              else p = { ...p, timeLeft: left };
          }
          setPomodoro(p);
      }
      
      if (parsed.planiTareas) {
          const pt = parsed.planiTareas.map(t => {
              if (t.corriendo && t.endsAt) {
                  const left = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
                  if (left <= 0) return { ...t, segundosRestantes: 0, corriendo: false, endsAt: null, notificada: true };
                  return { ...t, segundosRestantes: left };
              }
              return t;
          });
          setPlaniTareas(pt);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('brokenMimi_data', JSON.stringify({
      tareas, examenes, entregas, capacidadBase, capacidadExtra, planificacion, pomodoro, planiConfig, planiTareas
    }));
  }, [tareas, examenes, entregas, capacidadBase, capacidadExtra, planificacion, pomodoro, planiConfig, planiTareas]);

  // --- MOTOR DE TIEMPO GLOBAL ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setPomodoro(prev => {
        if (!prev.isActive || !prev.endsAt) return prev;
        const left = Math.max(0, Math.round((prev.endsAt - now) / 1000));
        if (left <= 0) {
          if (planiConfig.sonidoActivo) playAlarm();
          if ('Notification' in window && Notification.permission === 'granted') new Notification('Sesión finalizada!');
          return { ...prev, timeLeft: 0, isActive: false, endsAt: null, needsCompletionHandle: true };
        }
        return { ...prev, timeLeft: left };
      });

      setPlaniTareas(prev => {
        let changed = false;
        const next = prev.map(t => {
          if (t.corriendo && t.endsAt) {
            const left = Math.max(0, Math.round((t.endsAt - now) / 1000));
            if (left <= 0 && !t.notificada) {
              if (planiConfig.sonidoActivo) playAlarm();
              if ('Notification' in window && Notification.permission === 'granted') new Notification(`Tiempo para ${t.nombre}!`);
              changed = true;
              return { ...t, segundosRestantes: 0, corriendo: false, endsAt: null, notificada: true };
            }
            if (left !== t.segundosRestantes && left > 0) {
              changed = true;
              return { ...t, segundosRestantes: left };
            }
          }
          return t;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [planiConfig.sonidoActivo]);

  // --- CONTROL DE PANTALLA ENCENDIDA (WAKE LOCK) ---
  const isTimerActive = pomodoro.isActive || planiTareas.some(t => t.corriendo);

  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock API no soportada o bloqueada:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock !== null) {
        await wakeLock.release();
        wakeLock = null;
      }
    };

    if (isTimerActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Si el usuario cambia de app y vuelve, el sistema operativo suele soltar el bloqueo.
    // Esto asegura que lo volvemos a pedir al regresar si el reloj sigue activo.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTimerActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTimerActive]); // Solo se ejecuta cuando pasas de "Pausado" a "Corriendo" y viceversa

  const addTarea = (t) => setTareas([...tareas, { ...t, id: Date.now(), completada: false }]);
  const toggleTarea = (id) => setTareas(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  const deleteTarea = (id) => setTareas(tareas.filter(t => t.id !== id));
  const updateTarea = (id, data) => setTareas(tareas.map(t => t.id === id ? { ...t, ...data } : t));

  const addExamen = (e) => setExamenes([...examenes, { ...e, id: Date.now() }]);
  const deleteExamen = (id) => setExamenes(examenes.filter(e => e.id !== id));
  const updateExamen = (id, data) => setExamenes(examenes.map(e => e.id === id ? { ...e, ...data } : e));

  const addEntrega = (e) => setEntregas([...entregas, { ...e, id: Date.now() }]);
  const deleteEntrega = (id) => setEntregas(entregas.filter(e => e.id !== id));
  const updateEntrega = (id, data) => setEntregas(entregas.map(e => e.id === id ? { ...e, ...data } : e));

  const getCuentaAtras = (fechaStr, horaStr) => {
    if (!fechaStr) return "";
    const target = new Date(`${fechaStr}T${horaStr || '00:00'}`);
    const now = new Date();
    const diffMs = target - now;
    if (diffMs <= 0) return "Finalizado";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) return `${diffDays} días`;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <GlobalContext.Provider value={{
      tareas, addTarea, toggleTarea, deleteTarea, updateTarea,
      examenes, addExamen, deleteExamen, updateExamen,
      entregas, addEntrega, deleteEntrega, updateEntrega,
      capacidadBase, setCapacidadBase, capacidadExtra, setCapacidadExtra,
      planificacion, setPlanificacion, getCuentaAtras,
      pomodoro, setPomodoro, planiConfig, setPlaniConfig, planiTareas, setPlaniTareas, fusionarDatos
    }}>
      {children}
    </GlobalContext.Provider>
  );
};