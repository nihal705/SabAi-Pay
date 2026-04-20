// frontend/src/components/RestaurantOrderComponent.jsx

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
import { FaPlus, FaMinus, FaTrash, FaCheckCircle, FaShoppingCart, FaRupeeSign, FaClock, FaStar, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomPaymentModal from './CustomPaymentModal'; // assuming it's in the same folder

const RestaurantOrderComponent = ({ 
    restaurant, 
    menuItems, 
    merchant, 
    sessionId, 
    onCartUpdate,
    onPaymentComplete,
    onClose,
    onProceedToPayment,
    handlePaymentFailure,
    onScheduleSuccess,   // <-- renamed from onScheduleOrder
    initialCart = [],
    reserveCheck = null
}) => {
    // Cart state
    const [cart, setCart] = useState(initialCart || []);
    const [selectedItems, setSelectedItems] = useState({});
    const [activeTab, setActiveTab] = useState('menu');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [orderForPayment, setOrderForPayment] = useState(null);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);
    const [tempScheduleDateTime, setTempScheduleDateTime] = useState(null);
    const [scheduleCompleted, setScheduleCompleted] = useState(false);

    // Refresh cart from backend
    const refreshCart = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/agent/order/session/${sessionId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.data.success) {
                const freshCart = res.data.data.cart || [];
                setCart(freshCart);
                onCartUpdate?.(freshCart);
            }
        } catch (err) {
            console.error('Refresh cart failed', err);
        }
    };

    // Add to cart
    const addToCart = async (item, quantity = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/agent/order/select-items',
                {
                    sessionId: sessionId,
                    selectedItems: [{
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: quantity,
                        imageUrl: item.imageUrl,
                        category: item.category,
                        isVeg: item.isVeg
                    }]
                },
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );
            if (response.data.success) {
                const updatedCart = response.data.data.cart || [];
                setCart(updatedCart);
                onCartUpdate?.(updatedCart);
                setSelectedItems(prev => ({ ...prev, [item.id]: true }));
                setTimeout(() => setSelectedItems(prev => ({ ...prev, [item.id]: false })), 500);
                toast.success(`${item.name} added to cart!`);
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            toast.error('Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    // Remove from cart
    const removeFromCart = async (itemId, itemName) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/agent/order/remove-from-cart',
                { sessionId: sessionId, itemId: itemId },
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );
            if (response.data?.success) {
                const updatedCart = response.data.data.cart || [];
                setCart(updatedCart);
                onCartUpdate?.(updatedCart);
                toast.success(`${itemName} removed from cart`);
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
            toast.error('Failed to remove item');
        } finally {
            setLoading(false);
        }
    };

    // Update quantity
    const updateQuantity = async (itemId, itemName, currentQuantity, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId, itemName);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/agent/order/update-cart-quantity',
                { sessionId: sessionId, itemId: itemId, quantity: newQuantity },
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );
            if (response.data?.success) {
                const updatedCart = response.data.data.cart || [];
                setCart(updatedCart);
                onCartUpdate?.(updatedCart);
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
            toast.error('Failed to update quantity');
        } finally {
            setLoading(false);
        }
    };

    // Add selected items (multi‑select)
    const addSelectedToCart = async () => {
        const selected = menuItems.filter(item => selectedItems[item.id]);
        if (selected.length === 0) {
            toast.info('Please select items first');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const itemsToAdd = selected.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                imageUrl: item.imageUrl,
                category: item.category,
                isVeg: item.isVeg
            }));
            const response = await axios.post(
                'http://localhost:5000/api/agent/order/select-items',
                { sessionId: sessionId, selectedItems: itemsToAdd },
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );
            if (response.data.success) {
                const updatedCart = response.data.data.cart || [];
                setCart(updatedCart);
                onCartUpdate?.(updatedCart);
                setSelectedItems({});
                toast.success(`${selected.length} items added to cart!`);
            }
        } catch (error) {
            console.error('Failed to add selected items:', error);
            toast.error('Failed to add items');
        } finally {
            setLoading(false);
        }
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal + tax;
        const cashback = Math.min(Math.floor(subtotal * 0.05), 100);
        return { subtotal, tax, total, cashback };
    };
    const { subtotal, tax, total, cashback } = calculateTotals();
    const selectedCount = Object.values(selectedItems).filter(v => v).length;

    // Schedule order flow
    const handleScheduleOrder = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        setShowDateTimeModal(true);
    };

    const handleDateTimeConfirm = () => {
        if (!scheduleDate || !scheduleTime) {
            toast.error('Select date and time');
            return;
        }
        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime <= new Date()) {
            toast.error('Future date/time required');
            return;
        }
        setTempScheduleDateTime(scheduledDateTime.toISOString());
        setShowDateTimeModal(false);
        // Open payment modal for schedule
        const orderData = {
            sessionId: sessionId,
            merchant: merchant,
            merchantName: merchant,  // platform name (Swiggy, Zepto)
            restaurantName: restaurant?.name,
            items: cart,
            total: total,
            subtotal: subtotal,
            tax: tax,
            scheduledTime: scheduledDateTime.toISOString(),
            mode: 'schedule'
        };
        setOrderForPayment(orderData);
        setShowPaymentModal(true);
    };

    const handleProceedToPayment = () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        const orderData = {
            sessionId: sessionId,
            merchant: merchant,
            merchantName: restaurant?.name || merchant,
            items: cart,
            total: total,
            subtotal: subtotal,
            tax: tax
        };
        setOrderForPayment(orderData);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = (transactionData) => {
        setShowPaymentModal(false);
        setOrderForPayment(null);
        setCart([]);
        onCartUpdate?.([]);
        setOrderCompleted(true);
        // Create order object and save locally (existing logic)
        const order = {
            id: transactionData.orderId || `ORD${Date.now()}`,
            merchant: merchant,
            merchantName: restaurant?.name || merchant,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            })),
            totalAmount: transactionData.amount,
            status: 'confirmed',
            paymentMethod: transactionData.payment_method_display,
            sabaiGems: transactionData.cashback,
            createdAt: new Date().toISOString(),
            tracking: [
                { status: 'confirmed', label: 'Order Confirmed', completed: true, time: new Date().toLocaleTimeString() },
                { status: 'preparing', label: 'Preparing', completed: false },
                { status: 'out_for_delivery', label: 'Out for Delivery', completed: false },
                { status: 'delivered', label: 'Delivered', completed: false }
            ]
        };
        const userId = localStorage.getItem('currentUserId') || '5';
        const existingOrders = JSON.parse(localStorage.getItem(`agentOrders_${userId}`) || '[]');
        existingOrders.unshift(order);
        localStorage.setItem(`agentOrders_${userId}`, JSON.stringify(existingOrders));
        if (onPaymentComplete) {
            onPaymentComplete({
                success: true,
                transactionData: { ...transactionData, orderId: order.id, items: order.items }
            });
        }
        setTimeout(() => onClose?.(), 2000);
        toast.success(`Payment successful! ${transactionData.cashback > 0 ? `+${transactionData.cashback} 🪙 earned!` : ''}`);
    };

    if (orderCompleted || scheduleCompleted) {
    return (
        <div className="order-completed-message">
            <div className="success-icon">✅</div>
            <h3>{orderCompleted ? 'Order Placed Successfully!' : 'Order Scheduled!'}</h3>
            <p>{orderCompleted ? 'Your order has been confirmed and will be delivered soon.' : 'Your order has been scheduled successfully.'}</p>
            <button onClick={onClose}>Close</button>
        </div>
    );
}

    const handleScheduleSuccess = (scheduledTime) => {
    // Do NOT close the modal here – the modal's own "Done" button will close it
    setScheduleCompleted(true);
    if (onScheduleSuccess) onScheduleSuccess(cart, total, scheduledTime);
    // Remove the setTimeout that calls onClose; let the modal close itself
};

    return (
        <div className="restaurant-order-component">
            {/* Restaurant Header */}
            <div className="restaurant-header-enhanced">
                <h3>{restaurant?.name || `${merchant?.toUpperCase()} Menu`}</h3>
                {restaurant?.rating && (
                    <div className="restaurant-meta">
                        <span><FaStar /> {restaurant.rating}</span>
                        <span><FaClock /> {restaurant.deliveryTime || '30-40 min'}</span>
                        {reserveCheck && (
                            <span className={`reserve-status ${reserveCheck.eligible ? 'eligible' : 'not-eligible'}`}>
                                {reserveCheck.eligible ? '✅ Reserve Pay Available' : '❌ Reserve Pay Not Available'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="order-tabs">
                <button className={`tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>🍽️ Menu</button>
                <button className={`tab ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>🛒 Cart ({cart.length})</button>
            </div>

            {/* Menu Tab */}
            {activeTab === 'menu' && (
                <div className="menu-tab">
                    {selectedCount > 0 && (
                        <div className="selection-bar">
                            <span>{selectedCount} item(s) selected</span>
                            <button className="add-selected-btn" onClick={addSelectedToCart} disabled={loading}>
                                {loading ? 'Adding...' : `Add Selected (${selectedCount})`}
                            </button>
                        </div>
                    )}
                    <div className="menu-items-grid">
                        {menuItems.map(item => (
                            <div key={item.id} className={`menu-item-card ${selectedItems[item.id] ? 'selected' : ''}`} onClick={() => toggleItemSelection(item.id)}>
                                <div className="menu-item-image">
                                    <img src={item.imageUrl || '/images/items/default.png'} alt={item.name} />
                                    {item.isVeg && <span className="veg-badge">🌱</span>}
                                    {selectedItems[item.id] && <div className="selected-overlay"><FaCheckCircle /></div>}
                                </div>
                                <div className="menu-item-info">
                                    <h4>{item.name}</h4>
                                    <div className="menu-item-price"><FaRupeeSign /> {item.price}</div>
                                    <div className="menu-item-category">{item.category}</div>
                                </div>
                                <button className="add-btn" disabled={loading} onClick={(e) => { e.stopPropagation(); addToCart(item, 1); }}>
                                    {loading ? 'Adding...' : '+ Add'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cart Tab */}
            {activeTab === 'cart' && (
                <div className="cart-tab">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <FaShoppingCart />
                            <p>Your cart is empty</p>
                            <button onClick={() => setActiveTab('menu')}>Browse Menu</button>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items-list">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-info">
                                            <img src={item.image || item.imageUrl || '/images/items/default.png'} alt={item.name} />
                                            <div>
                                                <h4>{item.name}</h4>
                                                <div className="item-price"><FaRupeeSign /> {item.price}</div>
                                                {item.isVeg && <span className="veg-badge-small">🌱 Veg</span>}
                                            </div>
                                        </div>
                                        <div className="cart-item-actions">
                                            <button onClick={() => updateQuantity(item.id, item.name, item.quantity, item.quantity - 1)} disabled={loading}><FaMinus /></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.name, item.quantity, item.quantity + 1)} disabled={loading}><FaPlus /></button>
                                            <button onClick={() => removeFromCart(item.id, item.name)} className="remove-btn" disabled={loading}><FaTrash /></button>
                                        </div>
                                        <div className="cart-item-total"><FaRupeeSign /> {item.price * item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-summary">
                                <div className="summary-row"><span>Subtotal:</span><span><FaRupeeSign /> {subtotal}</span></div>
                                <div className="summary-row"><span>Tax (5%):</span><span><FaRupeeSign /> {tax}</span></div>
                                <div className="summary-row total"><span>Total:</span><span><FaRupeeSign /> {total}</span></div>
                                <div className="summary-row cashback"><span>SabAI Gems Earned:</span><span>+{cashback} 🪙</span></div>
                            </div>
                            <div className="cart-actions">
                                <button className="add-more-btn" onClick={() => setActiveTab('menu')}>➕ Add More Items</button>
                                <button className="schedule-btn" onClick={handleScheduleOrder}><FaCalendarAlt /> Schedule</button>
                                <button className="checkout-btn" onClick={handleProceedToPayment}><FaCreditCard /> Proceed to Payment</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Date/Time Modal */}
            {showDateTimeModal && (
                <div className="modal-overlay" onClick={() => setShowDateTimeModal(false)}>
                    <div className="schedule-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Schedule Order</h3>
                            <button onClick={() => setShowDateTimeModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Date</label>
                                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="form-group">
                                <label>Select Time</label>
                                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                            </div>
                            <div className="order-preview">
                                <p><strong>Items:</strong> {cart.length}</p>
                                <p><strong>Total:</strong> ₹{total}</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowDateTimeModal(false)}>Cancel</button>
                            <button onClick={handleDateTimeConfirm}>Next: Select Payment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal (unified for both pay and schedule) */}
            {showPaymentModal && orderForPayment && (
                <CustomPaymentModal
                    orderData={orderForPayment}
                    mode={orderForPayment.mode === 'schedule' ? 'schedule' : 'pay'}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setOrderForPayment(null);
                    }}
                    onPaymentSuccess={orderForPayment.mode === 'schedule' ? undefined : handlePaymentSuccess}
                    onPaymentFailed={(error) => {
                        setShowPaymentModal(false);
                        toast.error(`Payment failed: ${error.failure_reason}`);
                    }}
                    onScheduleSuccess={handleScheduleSuccess} 
                />
            )}
        </div>
    );
};

export default RestaurantOrderComponent;