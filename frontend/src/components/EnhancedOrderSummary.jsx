// frontend/src/components/EnhancedOrderSummary.jsx
// COMPLETE ENHANCED ORDER SUMMARY WITH INTERACTIVE SELECTION

import React, { useState, useEffect } from 'react';
import { 
    FaPlus, FaMinus, FaTrash, FaCheckCircle, FaShoppingCart, 
    FaGem, FaClock, FaStar, FaRupeeSign, FaTimes 
} from 'react-icons/fa';
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
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [imageErrors, setImageErrors] = useState({});
    const merchantName = merchant;

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

    // Count restaurant names for grouping
    const getRestaurantCount = () => {
        const restaurants = new Set();
        cart.forEach(item => {
            if (item.restaurantName) restaurants.add(item.restaurantName);
        });
        return restaurants.size;
    };

    const hasMultipleRestaurants = getRestaurantCount() > 1;

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
                    <h3>{merchantName || 'Restaurant'}</h3>
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
                                    <img src={item.imageUrl || item.image || '/images/items/default.jpg'} alt={item.name} />
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
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="item-details">
                                            <img src={item.imageUrl || item.image || '/images/items/default.jpg'} alt={item.name} />
                                            <div>
                                                <h5>{item.name}</h5>
                                                {item.restaurantName && hasMultipleRestaurants && (
                                                    <div className="restaurant-name-info">
                                                        <span className="restaurant-icon">📍</span>
                                                        <span className="restaurant-name-text">{item.restaurantName}</span>
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
                                ))}
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
                            <button onClick={() => setShowScheduleModal(false)}>
                                <FaTimes />
                            </button>
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
        </div>
    );
};

export default EnhancedOrderSummary;