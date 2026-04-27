import React, { useState, useEffect, useRef } from 'react';

// ---- SONIDO DE NOTIFICACIÓN (sin dependencias externas) ----
const reproducirSonido = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Melodía corta: 3 tonos
        const tonos = [523, 659, 784]; // Do, Mi, Sol
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
    } catch (e) {
        console.warn('No se pudo reproducir sonido:', e);
    }
};

// ---- NOTIFICACIÓN DEL SISTEMA ----
const mostrarNotificacion = (nombreTarea) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification('⏱ ¡Tiempo completado!', {
            body: `Has terminado: ${nombreTarea}`,
            icon: '/icon.png',
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') {
                new Notification('⏱ ¡Tiempo completado!', {
                    body: `Has terminado: ${nombreTarea}`,
                    icon: '/icon.png',
                });
            }
        });
    }
};

// ---- GRÁFICO DONUT ----
const DonutChart = ({ tareas }) => {
    const total = tareas.reduce((s, t) => s + t.minutos, 0);
    if (!total) return null;

    const COLORES_PRIORIDAD = {
        3: ['#4ade80', '#22c55e', '#16a34a'],
        2: ['#86efac', '#4ade80', '#bbf7d0'],
        1: ['#d1d5db', '#9ca3af', '#6b7280'],
    };
    const colorUsado = {};
    let acumulado = 0;
    const radio = 60, cx = 80, cy = 80, grosor = 22;
    const circunferencia = 2 * Math.PI * radio;

    const segmentos = tareas.map((t, i) => {
        const porcentaje = t.minutos / total;
        const dashArray = porcentaje * circunferencia;
        const dashOffset = -acumulado * circunferencia;
        acumulado += porcentaje;
        colorUsado[t.prioridad] = (colorUsado[t.prioridad] || 0);
        const color = COLORES_PRIORIDAD[t.prioridad][colorUsado[t.prioridad] % 3];
        colorUsado[t.prioridad]++;
        return (
            <circle key={i} cx={cx} cy={cy} r={radio} fill="none"
                stroke={color} strokeWidth={grosor}
                strokeDasharray={`${dashArray} ${circunferencia}`}
                strokeDashoffset={dashOffset}
                style={{ transition: 'all 0.4s ease' }}
                transform={`rotate(-90 ${cx} ${cy})`}
            />
        );
    });

    return (
        <svg width="160" height="160" style={{ display: 'block', margin: '0 auto' }}>
            <circle cx={cx} cy={cy} r={radio} fill="none" stroke="#f0f0f0" strokeWidth={grosor} />
            {segmentos}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#555">
                {Math.floor(total / 60)}h {total % 60}m
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#888">total</text>
        </svg>
    );
};

// ---- ITEM DE TAREA ----
const TareaItem = ({ tarea, onEliminar, onToggleTimer }) => {
    const mins = Math.floor(tarea.segundosRestantes / 60);
    const segs = tarea.segundosRestantes % 60;
    const progreso = 1 - tarea.segundosRestantes / (tarea.minutos * 60);
    const colorPrioridad = { 3: '#4ade80', 2: '#86efac', 1: '#d1d5db' };
    const color = colorPrioridad[tarea.prioridad];
    const activa = tarea.corriendo;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: activa ? '#f0fdf4' : 'white',
            border: `1.5px solid ${activa ? '#4ade80' : '#e5e7eb'}`,
            borderRadius: '12px', padding: '10px 14px',
            transition: 'all 0.2s',
            opacity: tarea.segundosRestantes === 0 ? 0.5 : 1,
        }}>
            <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: color, flexShrink: 0,
                boxShadow: activa ? `0 0 6px ${color}` : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: activa ? 'bold' : 'normal',
                    fontSize: '13px', color: '#374151',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {tarea.nombre}
                </div>
                <div style={{ marginTop: '4px', height: '4px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: '2px', background: color,
                        width: `${progreso * 100}%`, transition: 'width 1s linear',
                    }} />
                </div>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace', flexShrink: 0, minWidth: '60px', textAlign: 'right' }}>
                {tarea.segundosRestantes === 0 ? '✅ Hecho' : `${mins}m ${segs}s`}
            </span>
            <button onClick={() => onToggleTimer(tarea.id)} disabled={tarea.segundosRestantes === 0}
                style={{
                    width: 30, height: 30, borderRadius: '8px', border: 'none',
                    background: tarea.segundosRestantes === 0 ? '#e5e7eb' : '#4ade80',
                    cursor: tarea.segundosRestantes === 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', flexShrink: 0, transition: 'background 0.2s',
                }}>
                {activa ? '⏸' : '▶'}
            </button>
            <button onClick={() => onEliminar(tarea.id)}
                style={{
                    width: 30, height: 30, borderRadius: '8px', border: 'none',
                    background: '#fecaca', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', flexShrink: 0,
                }}>
                ✕
            </button>
        </div>
    );
};

// ---- COMPONENTE PRINCIPAL ----
const PlanificadorWidget = () => {
    const [horas, setHoras] = useState('');
    const [horasConfirmadas, setHorasConfirmadas] = useState(null);
    const [nombreTarea, setNombreTarea] = useState('');
    const [prioridad, setPrioridad] = useState(2);
    const [tareas, setTareas] = useState([]);
    const [sonidoActivo, setSonidoActivo] = useState(true); // ✅ nuevo estado
    const intervalRef = useRef(null);

    // Pedir permiso de notificaciones al montar
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // ---- PERSISTENCIA ----
    useEffect(() => {
        const guardado = localStorage.getItem('planificador_v1');
        if (guardado) {
            const datos = JSON.parse(guardado);
            setHorasConfirmadas(datos.horasConfirmadas);
            setHoras(datos.horasConfirmadas?.toString() || '');
            setTareas((datos.tareas || []).map(t => {
                const restante = Math.max(0, Math.round(((t.endsAt || 0) - Date.now()) / 1000));
                const terminado = restante === 0;
                return {
                    ...t,
                    segundosRestantes: restante,
                    corriendo: false,              // no arrancamos auto
                    endsAt: terminado ? null : t.endsAt,
                    notificada: terminado ? true : (t.notificada || false),
                };
            }));
            if (datos.sonidoActivo !== undefined) setSonidoActivo(datos.sonidoActivo);
        }
    }, []);

    useEffect(() => {
        if (horasConfirmadas !== null) {
            localStorage.setItem('planificador_v1', JSON.stringify({ horasConfirmadas, tareas, sonidoActivo }));
        }
    }, [tareas, horasConfirmadas, sonidoActivo]);

    // ---- TIMER GLOBAL ----
    useEffect(() => {
        clearInterval(intervalRef.current);
        const hayActiva = tareas.some(t => t.corriendo);
        if (!hayActiva) return;

        intervalRef.current = setInterval(() => {
            setTareas(prev => prev.map(t => {
                if (!t.corriendo || !t.endsAt) return t;
                const restante = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
                if (restante <= 0 && !t.notificada) {
                    mostrarNotificacion(t.nombre);
                    if (sonidoActivo) reproducirSonido();
                    return { ...t, segundosRestantes: 0, corriendo: false, endsAt: null, notificada: true };
                }
                return { ...t, segundosRestantes: restante };
            }));
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [tareas.map(t => t.corriendo).join(','), sonidoActivo]);

    const distribuirHoras = (tareasList, totalMinutos) => {
        if (!tareasList.length) return tareasList;
        const pesos = { 1: 1, 2: 2, 3: 3.5 };
        const pesoTotal = tareasList.reduce((s, t) => s + pesos[t.prioridad], 0);
        return tareasList.map(t => {
            const base = (pesos[t.prioridad] / pesoTotal) * totalMinutos;
            const variacion = base * (0.85 + Math.random() * 0.3);
            const minutos = Math.max(5, Math.round(variacion));
            const segundosRestantes = minutos * 60;
            const corriendo = t.corriendo || false;
            const endsAt = corriendo ? Date.now() + segundosRestantes * 1000 : null;
            return { ...t, minutos, segundosRestantes, endsAt, notificada: false };
        });
    };

    const confirmarHoras = () => {
        const h = parseFloat(horas);
        if (!h || h <= 0) return;
        setHorasConfirmadas(h);
        if (tareas.length) setTareas(prev => distribuirHoras(prev, Math.round(h * 60)));
    };

    const añadirTarea = () => {
        if (!nombreTarea.trim() || !horasConfirmadas) return;
        const nueva = {
            id: Date.now(), nombre: nombreTarea.trim(),
            prioridad: parseInt(prioridad), minutos: 0,
            segundosRestantes: 0, corriendo: false,
            endsAt: null, notificada: false,
        };
        setTareas(distribuirHoras([...tareas, nueva], Math.round(horasConfirmadas * 60)));
        setNombreTarea('');
    };

    const eliminarTarea = (id) => {
        setTareas(distribuirHoras(tareas.filter(t => t.id !== id), Math.round(horasConfirmadas * 60)));
    };

    const toggleTimer = (id) => {
        setTareas(prev => prev.map(t => {
            if (t.id === id) {
                if (t.corriendo) {
                    return { ...t, corriendo: false, endsAt: null };
                } else {
                    const endsAt = Date.now() + t.segundosRestantes * 1000;
                    return { ...t, corriendo: true, endsAt, notificada: false };
                }
            }
            return { ...t, corriendo: false, endsAt: null };
        }));
    };

    const tareaCorriendoNombre = tareas.find(t => t.corriendo)?.nombre;

    const inputStyle = {
        width: '100%', padding: '8px 12px', borderRadius: '10px',
        border: '1.5px solid #e5e7eb', fontFamily: "'Mali', cursive",
        fontSize: '13px', outline: 'none', boxSizing: 'border-box', background: 'white',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Mali', cursive" }}>

            {/* --- Panel horas + donut --- */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '16px', flex: '1', minWidth: '160px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    
                    {/* ✅ Toggle de sonido */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button
                            onClick={() => setSonidoActivo(s => !s)}
                            title={sonidoActivo ? 'Silenciar notificaciones' : 'Activar sonido'}
                            style={{
                                border: 'none', background: sonidoActivo ? '#dcfce7' : '#f3f4f6',
                                borderRadius: '8px', padding: '4px 10px',
                                cursor: 'pointer', fontSize: '14px',
                                color: sonidoActivo ? '#16a34a' : '#9ca3af',
                                transition: 'all 0.2s',
                            }}>
                            {sonidoActivo ? '🔔 Sonido ON' : '🔕 Sonido OFF'}
                        </button>
                    </div>

                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', lineHeight: 1.5 }}>
                        ¿Cuántas horas quieres dedicar a tus tareas hoy?
                    </div>
                    <input
                        type="number" min="0.5" max="24" step="0.5"
                        value={horas}
                        onChange={e => setHoras(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmarHoras()}
                        placeholder="Ej: 8"
                        style={{ ...inputStyle, marginBottom: '8px' }}
                    />
                    <button onClick={confirmarHoras} style={{
                        width: '100%', padding: '7px', borderRadius: '10px',
                        border: 'none', background: 'var(--c2)', color: 'white',
                        fontFamily: "'Mali', cursive", fontSize: '12px',
                        cursor: 'pointer', fontWeight: 'bold',
                    }}>
                        {horasConfirmadas ? '🔄 Redistribuir' : 'Confirmar'}
                    </button>
                </div>

                {tareas.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '16px', flex: '1', minWidth: '160px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DonutChart tareas={tareas} />
                    </div>
                )}
            </div>

            {/* --- Tarea activa --- */}
            <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center', minHeight: '16px' }}>
                {tareaCorriendoNombre ? `⏱ Trabajando en: ${tareaCorriendoNombre}` : 'Ahora no hay ninguna tarea activa'}
            </div>

            {/* --- Añadir tarea --- */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="text" value={nombreTarea} onChange={e => setNombreTarea(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && añadirTarea()}
                    placeholder="Nombre de la tarea"
                    style={{ ...inputStyle, flex: 2, minWidth: '120px' }}
                    disabled={!horasConfirmadas}
                />
                <select value={prioridad} onChange={e => setPrioridad(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: '130px' }}
                    disabled={!horasConfirmadas}>
                    <option value={3}>Prioridad 3 (Alta)</option>
                    <option value={2}>Prioridad 2 (Media)</option>
                    <option value={1}>Prioridad 1 (Baja)</option>
                </select>
                <button onClick={añadirTarea} disabled={!horasConfirmadas || !nombreTarea.trim()}
                    style={{
                        padding: '8px 14px', borderRadius: '10px', border: 'none',
                        background: horasConfirmadas && nombreTarea.trim() ? '#c4b5fd' : '#e5e7eb',
                        color: horasConfirmadas && nombreTarea.trim() ? '#4c1d95' : '#9ca3af',
                        fontFamily: "'Mali', cursive", fontSize: '12px',
                        fontWeight: 'bold', cursor: horasConfirmadas ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                    }}>
                    Añadir tarea
                </button>
            </div>

            {/* --- Lista de tareas --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tareas.length === 0 && horasConfirmadas && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '20px' }}>
                        Añade tu primera tarea ✨
                    </div>
                )}
                {!horasConfirmadas && (
                    <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '20px' }}>
                        Primero indica cuántas horas tienes hoy 👆
                    </div>
                )}
                {[...tareas].sort((a, b) => b.prioridad - a.prioridad).map(t => (
                    <TareaItem key={t.id} tarea={t} onEliminar={eliminarTarea} onToggleTimer={toggleTimer} />
                ))}
            </div>

            {/* --- Botón limpiar todo --- */}
            {tareas.length > 0 && (
                <button onClick={() => { setTareas([]); setHorasConfirmadas(null); setHoras(''); }}
                    style={{
                        padding: '6px', borderRadius: '8px',
                        border: '1px solid #fecaca', background: 'white',
                        color: '#ef4444', fontFamily: "'Mali', cursive",
                        fontSize: '11px', cursor: 'pointer',
                    }}>
                    🗑️ Limpiar planificador
                </button>
            )}
        </div>
    );
};

export default PlanificadorWidget;