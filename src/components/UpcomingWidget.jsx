// src/components/UpcomingWidget.jsx
import React from 'react';

const getTimeLeft = (targetDate) => {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target - now;
  if (diffMs < 0) return "Hecho";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d`;
  const remainingMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h`;
};

export default function UpcomingWidget({ events = [], theme }) {
  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const top5Events = sortedEvents.slice(0, 3); 

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: theme.cardYellow, // Fondo azul pastel
      border: `2px solid ${theme.border}`, // Borde exterior MARRÓN
      borderRadius: '24px', 
      padding: '20px', 
      display: 'flex',
      flexDirection: 'column',
      color: theme.textDark,
      boxShadow: `0 4px 0 ${theme.border}` // Sombra de bloque duro
    }}>
      <h4 style={{ 
        margin: '0 0 15px 0', 
        fontWeight: '800',
        fontSize: '0.9rem',
        color: theme.textDark
      }}>
        Próximos eventos
      </h4>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {top5Events.length === 0 ? (
          <li style={{ fontSize: '0.8rem', color: theme.textDark, fontWeight: '600' }}>Todo libre ✨</li>
        ) : (
          top5Events.map((item) => (
            <li key={item.id} style={{ 
              backgroundColor: theme.cardWhite, // Fondo blanco para cada tarea
              border: `2px solid ${theme.border}`, // Borde para cada tarea individual
              borderRadius: '16px',
              padding: '12px 10px',
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: `0 2px 0 ${theme.border}` // Sombrita para que parezcan botones
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontWeight: '700', 
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '65%'
                }}>
                  {item.title}
                </span>
                <span style={{ 
                  backgroundColor: theme.cardYellow, // Píldora amarilla
                  border: `2px solid ${theme.border}`, // Borde en la píldora
                  color: theme.textDark,
                  padding: '4px 8px', 
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.65rem'
                }}>
                  {getTimeLeft(item.date)}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}