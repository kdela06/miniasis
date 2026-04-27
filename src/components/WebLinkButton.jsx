import React from 'react';

export default function WebLinkButton({ name, url, imageUrl, theme }) {
  const handleClick = () => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      style={{
        backgroundColor: theme.cardWhite, 
        color: theme.textDark, 
        border: `2px solid ${theme.border}`, // Borde acorde al tamaño
        borderRadius: '14px', // Redondeo adaptado al tamaño mini
        padding: '6px', // ✅ Padding muy pequeño para que quepa todo
        textDecoration: 'none',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        boxShadow: `0 3px 0 ${theme.border}`, // Sombra proporcionada
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.1s ease',
      }}
    >
      <img 
        src={imageUrl} 
        alt={`Icono`} 
        style={{ width: '22px', height: '22px', objectFit: 'contain', marginBottom: '4px', borderRadius: '4px' }} 
      />
      <span style={{ 
        fontSize: '0.6rem', // ✅ Letra súper pequeñita
        fontWeight: '800', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        width: '100%' 
      }}>
        {name}
      </span>
    </div>
  );
}