// src/components/TamagotchiWidget.jsx
import React from 'react';

import imgSad from '../assets/tamagotchi_sad.png';
import imgNeutral from '../assets/tamagotchi_neutral.png';
import imgHappy from '../assets/tamagotchi_happy.png';
import imgBored from '../assets/tamagotchi_bored.png';

export default function TamagotchiWidget({ datosDeHoy, theme }) {
  const { totalTareas, tareasCompletadas } = datosDeHoy;

  const getTamagotchiState = () => {
    if (totalTareas === 0) return { image: imgBored, name: 'Aburrida' };
    if (tareasCompletadas < totalTareas * 0.5) return { image: imgSad, name: 'Triste' };
    if (tareasCompletadas >= totalTareas * 0.8) return { image: imgHappy, name: '¡Feliz!' };
    return { image: imgNeutral, name: 'Normal' };
  };

  const tamoState = getTamagotchiState();

  return (
    <div style={{
      flex: 1,
      backgroundColor: theme.cardFrog, // Verde pastel ultra suave
      border: `2px solid ${theme.border}`, 
      borderRadius: '24px', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.textDark, 
      textAlign: 'center',
      boxShadow: `0 4px 0 ${theme.border}` 
    }}>
      
      <div style={{
        width: '100px', // Un pelín más grande para que luzca
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
      }}>
        <img 
          src={tamoState.image} 
          alt={tamoState.name}
          style={{
            maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated', 
          }} 
        />
      </div>

      {/* Hemos quitado el nombre y dejado solo el nivel/exp para que sea más minimalista */}
      <p style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.9, margin: 0 }}>
        lv. 1 ({tareasCompletadas}/{totalTareas} exp)
      </p>
    </div>
  );
}