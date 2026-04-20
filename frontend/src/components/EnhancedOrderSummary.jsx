// frontend/src/components/EnhancedOrderSummary.jsx
// COMPLETE ENHANCED ORDER SUMMARY WITH INTERACTIVE SELECTION

/**
 * SabAI Pay - AI-Powered UPI Payments Assistant
 * Copyright (c) 2026 G Nihal. All Rights Reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries: support@sabai-pay.com
 */

import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaTrash, FaCheckCircle, FaShoppingCart, FaGem, FaClock, FaStar, FaRupeeSign } from 'react-icons/fa';
import './EnhancedOrderSummary.css';

const EnhancedOrderSummary = ({ 
    initialItems = [],
    suggestedItems = [],
    merchant,
    merchantLogo,
    onCartUpdate,
    onCheckout,
    onAddItems,
    onClearCart,
    onScheduleOrder,
    isInteractable = true,
    showSuggestions = true,
    reserveCheck = null,
    sabaiGems = 0
}) => {
    const [cart, setCart] = useState(initialItems);
    const [selectedSuggestions, setSelectedSuggestions] = useState({});
    const [view, setView] = useState('suggestions');
    const [loading, setLoading] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [imageErrors, setImageErrors] = useState({}); 
    const merchantName = merchant

    useEffect(() => {
        setCart(initialItems);
    }, [initialItems]);

    const addToCart = (item) => {
        const existingIndex = cart.findIndex(i => i.id === item.id);
        let newCart;
        
        if (existingIndex !== -1) {
            newCart = [...cart];
            newCart[existingIndex] = {
                ...newCart[existingIndex],
                quantity: newCart[existingIndex].quantity + 1,
                total: (newCart[existingIndex].quantity + 1) * newCart[existingIndex].price
            };
        } else {
            newCart = [...cart, {
                ...item,
                quantity: 1,
                total: item.price
            }];
        }
        
        setCart(newCart);
        onCartUpdate?.(newCart);
        
        // Visual feedback
        setSelectedSuggestions(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => {
            setSelectedSuggestions(prev => ({ ...prev, [item.id]: false }));
        }, 500);
    };

    const removeFromCart = (itemId) => {
        const newCart = cart.filter(item => item.id !== itemId);
        setCart(newCart);
        onCartUpdate?.(newCart);
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        const newCart = cart.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.price
                };
            }
            return item;
        });
        
        setCart(newCart);
        onCartUpdate?.(newCart);
    };

    const calculateTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
        const tax = Math.round(subtotal * 0.05);
        const cashback = Math.min(Math.floor(subtotal * 0.05), 100);
        return { subtotal, tax, total: subtotal + tax, cashback };
    };

    const { subtotal, tax, total, cashback } = calculateTotal();

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Your cart is empty. Please add items first.');
            return;
        }
        onCheckout?.(cart, total);
    };

    const handleScheduleOrder = () => {
        if (!scheduleDate || !scheduleTime) {
            alert('Please select both date and time');
            return;
        }
        
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime <= new Date()) {
            alert('Please select a future date and time');
            return;
        }
        
        onScheduleOrder?.(cart, total, scheduledDateTime.toISOString());
        setShowScheduleModal(false);
        setScheduleDate('');
        setScheduleTime('');
    };

    return (
        <div className="enhanced-order-summary">
            {/* Header with Merchant Info */}
            <div className="summary-header">
    {merchantLogo && !imageErrors.merchant && (
        <div className="merchant-logo-container">
            <img 
                src={merchantLogo} 
                alt={merchantName}
                className="merchant-logo-enhanced"
                onError={(e) => {
                    e.target.style.display = 'none';
                    setImageErrors(prev => ({ ...prev, merchant: true }));
                }}
            />
        </div>
    )}
    <div className="merchant-info">
        <h3>{merchantName || merchant}</h3>
        {reserveCheck && (
            <div className={`reserve-status ${reserveCheck.eligible ? 'eligible' : 'not-eligible'}`}>
                {reserveCheck.eligible ? '✅ Reserve Pay Available' : '❌ Reserve Pay Not Available'}
                {reserveCheck.remaining > 0 && reserveCheck.eligible && (
                    <span className="reserve-limit"> (₹{reserveCheck.remaining.toLocaleString()} left)</span>
                )}
            </div>
        )}
    </div>
</div>

            {/* Tab Navigation */}
            {showSuggestions && suggestedItems.length > 0 && (
                <div className="summary-tabs">
                    <button 
                        className={`tab ${view === 'suggestions' ? 'active' : ''}`}
                        onClick={() => setView('suggestions')}
                    >
                        🍽️ Suggested Items
                    </button>
                    <button 
                        className={`tab ${view === 'cart' ? 'active' : ''}`}
                        onClick={() => setView('cart')}
                    >
                        🛒 Your Cart ({cart.length})
                    </button>
                </div>
            )}

            {/* Suggested Items Grid */}
            {view === 'suggestions' && suggestedItems.length > 0 && (
                <div className="suggestions-grid">
                    <div className="grid-header">
                        <h4>Popular Items</h4>
                        <p>Click on any item to add to cart</p>
                    </div>
                    <div className="items-grid">
                        {suggestedItems.map(item => (
                            <div 
                                key={item.id}
                                className={`grid-item ${selectedSuggestions[item.id] ? 'added' : ''}`}
                                onClick={() => addToCart(item)}
                            >
                                <div className="item-image">
                                    <img src={item.imageUrl || item.image} alt={item.name} />
                                    {selectedSuggestions[item.id] && (
                                        <div className="added-overlay">
                                            <FaCheckCircle />
                                        </div>
                                    )}
                                    {item.isVeg && <span className="veg-badge">🌱</span>}
                                </div>
                                <div className="item-info">
                                    <h5>{item.name}</h5>
                                    <div className="item-price">
                                        <FaRupeeSign /> {item.price}
                                    </div>
                                    {item.rating && (
                                        <div className="item-rating">
                                            <FaStar /> {item.rating}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cart View */}
            {view === 'cart' && (
                <div className="cart-view">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <FaShoppingCart />
                            <p>Your cart is empty</p>
                            {showSuggestions && (
                                <button onClick={() => setView('suggestions')}>
                                    Browse Suggestions
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
    {cart.map(item => {
        // Group items by restaurant
        const restaurantName = item.restaurantName || 'Restaurant';
        
        return (
            <div key={item.id} className="cart-item">
                <div className="item-details">
                    <img src={item.imageUrl || item.image || '/images/items/default.jpg'} alt={item.name} />
                    <div>
                        <h5>{item.name}</h5>
                        {restaurantName && restaurantName !== 'Restaurant' && (
                            <div className="restaurant-name-info">
                                <span className="restaurant-icon">📍</span>
                                <span className="restaurant-name-text">{restaurantName}</span>
                            </div>
                        )}
                        <div className="item-price">
                            <FaRupeeSign /> {item.price} each
                        </div>
                    </div>
                </div>
                <div className="item-actions">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={loading}>
                        <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={loading}>
                        <FaPlus />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="remove-btn" disabled={loading}>
                        <FaTrash />
                    </button>
                </div>
                <div className="item-total">
                    <FaRupeeSign /> {item.total}
                </div>
            </div>
        );
    })}
</div>


                            <div className="cart-summary">
                                <div className="summary-row">
                                    <span>Subtotal:</span>
                                    <span><FaRupeeSign /> {subtotal}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax (5%):</span>
                                    <span><FaRupeeSign /> {tax}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Total:</span>
                                    <span><FaRupeeSign /> {total}</span>
                                </div>
                                <div className="summary-row gems">
                                    <span><FaGem /> SabAI Gems Earned:</span>
                                    <span>+{cashback} 🪙</span>
                                </div>
                            </div>

                            <div className="cart-actions">
                                {showSuggestions && (
                                    <button className="add-more-btn" onClick={() => setView('suggestions')}>
                                        ➕ Add More Items
                                    </button>
                                )}
                                <button className="schedule-btn" onClick={() => setShowScheduleModal(true)}>
                                    📅 Schedule Order
                                </button>
                                <button className="checkout-btn" onClick={handleCheckout}>
                                    💳 Proceed to Payment
                                </button>
                                <button className="clear-cart-btn" onClick={() => {
                                    if (window.confirm('Clear your entire cart?')) {
                                        setCart([]);
                                        onClearCart?.();
                                    }
                                }}>
                                    🗑️ Clear Cart
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Schedule Order Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="schedule-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Schedule Order</h3>
                            <button onClick={() => setShowScheduleModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Date</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="form-group">
                                <label>Select Time</label>
                                <input 
                                    type="time" 
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                />
                            </div>
                            <div className="order-preview">
                                <p><strong>Order Total:</strong> <FaRupeeSign /> {total}</p>
                                <p><strong>Items:</strong> {cart.length} item(s)</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowScheduleModal(false)}>Cancel</button>
                            <button onClick={handleScheduleOrder}>Schedule Order</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .enhanced-order-summary {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .summary-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                
                .merchant-logo {
                    width: 48px;
                    height: 48px;
                    object-fit: contain;
                }
                
                .reserve-status {
                    font-size: 12px;
                    padding: 2px 8px;
                    border-radius: 12px;
                }
                
                .reserve-status.eligible {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .reserve-status.not-eligible {
                    background: #fee2e2;
                    color: #991b1b;
                }
                
                .summary-tabs {
                    display: flex;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                
                .tab.active {
                    color: #4f46e5;
                    border-bottom: 2px solid #4f46e5;
                }
                
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 12px;
                    padding: 16px;
                }
                
                .grid-item {
                    cursor: pointer;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.2s;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                }
                
                .grid-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .grid-item.added {
                    background: #dcfce7;
                    border-color: #22c55e;
                }
                
                .item-image {
                    position: relative;
                    height: 120px;
                    overflow: hidden;
                }
                
                .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .veg-badge {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }
                
                .added-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(34,197,94,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2rem;
                }
                
                .item-info {
                    padding: 8px;
                }
                
                .item-info h5 {
                    margin: 0 0 4px;
                    font-size: 14px;
                }
                
                .item-price {
                    font-size: 14px;
                    font-weight: 600;
                    color: #4f46e5;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }
                
                .cart-items {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .cart-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .item-details {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex: 2;
                }
                
                .item-details img {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    object-fit: cover;
                }
                
                .item-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .item-actions button {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    background: white;
                    cursor: pointer;
                }
                
                .remove-btn {
                    color: #ef4444;
                    border-color: #ef4444 !important;
                }
                
                .item-total {
                    font-weight: 600;
                    min-width: 80px;
                    text-align: right;
                }
                
                .cart-summary {
                    padding: 16px;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .summary-row.total {
                    font-size: 18px;
                    font-weight: 700;
                    border-top: 1px solid #cbd5e1;
                    padding-top: 8px;
                    margin-top: 8px;
                }
                
                .summary-row.gems {
                    color: #eab308;
                }
                
                .cart-actions {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                }
                
                .checkout-btn {
                    flex: 1;
                    padding: 12px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                .schedule-btn {
                    padding: 12px 16px;
                    background: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
                
                .add-more-btn {
                    padding: 12px 16px;
                    background: #64748b;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
                
                .clear-cart-btn {
                    padding: 12px 16px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }
                
                .empty-cart {
                    text-align: center;
                    padding: 48px;
                }
                
                .empty-cart svg {
                    font-size: 48px;
                    color: #cbd5e1;
                    margin-bottom: 16px;
                }
                
                .schedule-modal {
                    background: white;
                    border-radius: 16px;
                    width: 400px;
                    max-width: 90%;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .modal-header button {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                }
                
                .modal-body {
                    padding: 16px;
                }
                
                .form-group {
                    margin-bottom: 16px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                }
                
                .order-preview {
                    background: #f8fafc;
                    padding: 12px;
                    border-radius: 8px;
                    margin-top: 16px;
                }
                
                .modal-footer {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    border-top: 1px solid #e2e8f0;
                }
                
                .modal-footer button {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    cursor: pointer;
                }
                
                .modal-footer button:first-child {
                    background: #e2e8f0;
                    border: none;
                }
                
                .modal-footer button:last-child {
                    background: #4f46e5;
                    color: white;
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default EnhancedOrderSummary;