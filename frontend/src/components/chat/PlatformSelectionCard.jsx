// frontend/src/components/chat/PlatformSelectionCard.jsx
import React from 'react';

const PlatformSelectionCard = ({ data, onSelectPlatform }) => {
  const { query, category = 'food', platforms = [] } = data;

  const defaultPlatforms = category === 'grocery' 
    ? [
        { id: 'zepto', name: 'Zepto', badge: '10 Mins Delivery', color: '#7B2FF7', icon: '⚡' },
        { id: 'blinkit', name: 'Blinkit', badge: '12 Mins Delivery', color: '#F8D000', textColor: '#111', icon: '🛒' },
        { id: 'swiggy', name: 'Swiggy Instamart', badge: '15 Mins Delivery', color: '#FC8019', icon: '🛵' },
        { id: 'dmart', name: 'DMart Ready', badge: 'Max Discounts', color: '#007DC6', icon: '🏬' },
      ]
    : [
        { id: 'swiggy', name: 'Swiggy', badge: 'Top Offers & Fast Delivery', color: '#FC8019', icon: '🛵' },
        { id: 'zomato', name: 'Zomato', badge: 'Great Dining & Delivery', color: '#E23744', icon: '🍽️' },
        { id: 'zepto', name: 'Zepto Cafe', badge: '10 Mins Quick Bites', color: '#7B2FF7', icon: '⚡' },
      ];

  const displayList = platforms.length > 0 ? platforms : defaultPlatforms;

  return (
    <div className="platform-selection-card" style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
      maxWidth: '380px',
      fontFamily: 'inherit',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#111827', fontWeight: 600 }}>
          {query ? `Order "${query}"` : 'Choose Ordering Platform'}
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
          Select which delivery platform you would like to order from:
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayList.map((p) => {
          const bg = p.color || '#FC8019';
          const txtColor = p.textColor || '#fff';
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlatform(p.id, p.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = bg;
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: bg,
                  color: txtColor,
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}>
                  {p.icon || p.name.charAt(0)}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{p.badge}</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>Select →</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformSelectionCard;
