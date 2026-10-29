// frontend/src/components/chat/DirectOrderConfirmationCard.jsx
// Minimal, clean direct order confirmation card for the SabAI Pay agent chat

import React from 'react';

const DirectOrderConfirmationCard = ({ data, onConfirm, onCancel }) => {
  const {
    items = [],
    merchant,
    merchantName,
    paymentMethod,
    reserveCheck,
    total,
    subtotal,
    restaurantName,
  } = data;

  const itemSubtotal = subtotal || total || 0;
  const tax = Math.round(itemSubtotal * 0.05);
  const finalTotal = itemSubtotal + tax;
  const gems = Math.floor(finalTotal * 0.05);
  const isReservePay =
    reserveCheck?.eligible ||
    (paymentMethod || '').toLowerCase().includes('reserve');

  // Determine platform badge color
  const platformColors = {
    swiggy: '#FC8019',
    zomato: '#E23744',
    zepto: '#7B2FF7',
    blinkit: '#F8D000',
    dmart: '#007DC6',
    bigbasket: '#84C225',
  };
  const merchantKey = (merchant || 'swiggy').toLowerCase();
  const badgeBg = platformColors[merchantKey] || '#FC8019';
  const badgeText = merchantKey === 'blinkit' ? '#1a1a1a' : '#fff';

  return (
    <div className="direct-order-card">
      {/* Header */}
      <div className="doc-header">
        <span
          className="doc-platform-badge"
          style={{ background: badgeBg, color: badgeText }}
        >
          {(merchantName || merchant || 'SWIGGY').toUpperCase()}
        </span>
        {isReservePay && (
          <span className="doc-reserve-badge">⚡ Reserve Pay</span>
        )}
      </div>

      {/* Items */}
      <div className="doc-items">
        {items.length === 0 ? (
          <div className="doc-empty">No items found.</div>
        ) : (
          items.map((item, idx) => (
            <div className="doc-item-row" key={idx}>
              <img
                src={item.imageUrl || item.image || '/images/items/default.png'}
                alt={item.name}
                className="doc-item-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/items/default.png';
                }}
              />
              <div className="doc-item-info">
                <div className="doc-item-name">{item.name}</div>
                <div className="doc-item-meta">Qty: {item.quantity || 1}</div>
              </div>
              <div className="doc-item-price">
                ₹{item.price * (item.quantity || 1)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Restaurant name */}
      {restaurantName && (
        <div className="doc-restaurant">🏪 {restaurantName}</div>
      )}

      {/* Totals */}
      <div className="doc-totals">
        <div className="doc-total-row">
          <span>Subtotal</span>
          <span>₹{itemSubtotal}</span>
        </div>
        <div className="doc-total-row">
          <span>Tax (5%)</span>
          <span>₹{tax}</span>
        </div>
        <div className="doc-total-row doc-total-final">
          <span>Total</span>
          <span>₹{finalTotal}</span>
        </div>
        <div className="doc-total-row" style={{ fontSize: '13px', color: '#4b5563', borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '6px' }}>
          <span>💳 Payment Method</span>
          <span style={{ fontWeight: 600, color: isReservePay ? '#10b981' : '#2563eb' }}>
            {isReservePay
              ? `⚡ ${(merchantName || merchant || 'Swiggy').toUpperCase()} Reserve Pay (PIN-less)`
              : `🏦 ${paymentMethod || 'Canara Bank UPI'}`}
          </span>
        </div>
        <div className="doc-gems-row">🪙 SabAI Gems Earned: +{gems}</div>
      </div>

      {/* Reserve Pay info */}
      {isReservePay && (
        <div className="doc-reserve-info">
          🛡️ PIN-less · {reserveCheck?.message || 'Reserve Pay active'}
        </div>
      )}

      {/* Action buttons */}
      <div className="doc-actions">
        <button className="doc-confirm-btn" onClick={onConfirm}>
          ✅ Confirm &amp; Order
        </button>
        <button className="doc-cancel-btn" onClick={onCancel}>
          ✗ Cancel
        </button>
      </div>
    </div>
  );
};

export default DirectOrderConfirmationCard;
