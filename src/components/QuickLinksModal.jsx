// src/components/QuickLinksModal.jsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function QuickLinksModal({ isOpen, onClose, onSaveLink, theme }) {
  
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const defaultIcon = "https://cdn-icons-png.flaticon.com/512/1006/1006771.png";
  const [previewIcon, setPreviewIcon] = useState(defaultIcon);

  useEffect(() => {
    try {
      if (newLinkUrl.length > 4) {
        const urlToParse = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
        const domain = new URL(urlToParse).hostname;
        setPreviewIcon(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } else {
        setPreviewIcon(defaultIcon);
      }
    } catch (e) {
      setPreviewIcon(defaultIcon);
    }
  }, [newLinkUrl]);

  // Estilo común para inputs minimalistas
  const inputStyle = {
    padding: '12px 15px',
    borderRadius: '12px', // Redondeado
    border: `1px solid ${theme.border}`,
    backgroundColor: '#FDFDFD',
    color: theme.text,
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit'

  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newLinkName || !newLinkUrl) {
      alert("Faltan datos");
      return;
    }
    const finalUrl = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`;
    onSaveLink({ id: uuidv4(), name: newLinkName, url: finalUrl, imageUrl: previewIcon });
    setNewLinkName(''); setNewLinkUrl(''); setPreviewIcon(defaultIcon); onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(93, 64, 55, 0.3)', // Oscuro marrón suave transparente
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
      backdropFilter: 'blur(3px)' // Efecto desenfoque fondo (muy pro)
    }}>
      <div style={{
        backgroundColor: theme.card, // Blanco
        borderRadius: '30px', // Muy redondeado
        padding: '25px', width: '100%', maxWidth: '380px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', gap: '18px',
        border: `1px solid ${theme.border}`
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: '1.1rem' }}>Nuevo Enlace</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#675d5a' }}>✖</button>
        </div>

        {/* Vista previa icono minimalista */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '20px', border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, overflow: 'hidden'
          }}>
            <img src={previewIcon} alt="Icono" style={{ width: '55%', height: '55%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Inputs Estilizados */}
        <input type="text" placeholder="Nombre (ej. Notion)" value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)} style={inputStyle} />
        <input type="url" placeholder="URL (notion.so)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} style={inputStyle} />
        
        {/* Botón Guardar Suave */}
        <button onClick={handleSave} style={{
          backgroundColor: theme.textDark, // Terracota suave
          color: 'white', border: 'none', 
          padding: '14px', borderRadius: '15px', fontWeight: 'bold', 
          marginTop: '10px', cursor: 'pointer', fontSize: '0.9rem',
          boxShadow: '0 4px 10px rgba(161, 136, 127, 0.3)'
        }}>
          Crear acceso rápido
        </button>

      </div>
    </div>
  );s
}