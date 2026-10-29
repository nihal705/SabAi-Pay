// frontend/src/components/RestaurantOrderComponent.jsx

import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaTrash, FaCheckCircle, FaShoppingCart, FaRupeeSign, FaClock, FaStar, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomPaymentModal from './CustomPaymentModal'; 

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
    onScheduleSuccess,  
    initialCart = [],
    reserveCheck = null
}) => {
    // Cart state
    const [cart, setCart] = useState(initialCart && initialCart.length > 0 ? initialCart : []);
    const [selectedItems, setSelectedItems] = useState({});
    const [activeTab, setActiveTab] = useState(initialCart && initialCart.length > 0 ? 'cart' : 'menu');

    useEffect(() => {
        if (initialCart && initialCart.length > 0) {
            setCart(initialCart);
            setActiveTab('cart');
        }
    }, [initialCart]);
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
        const existingIdx = cart.findIndex(c => c.id === item.id || (c.name && item.name && c.name.toLowerCase() === item.name.toLowerCase()));
        let updatedCart;
        if (existingIdx >= 0) {
            updatedCart = cart.map((c, idx) => idx === existingIdx ? { ...c, quantity: (c.quantity || 1) + quantity } : c);
        } else {
            updatedCart = [...cart, {
                id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                name: item.name,
                price: Number(item.price) || 0,
                quantity: quantity,
                imageUrl: item.imageUrl || item.image,
                category: item.category,
                isVeg: item.isVeg
            }];
        }
        setCart(updatedCart);
        onCartUpdate?.(updatedCart);
        setSelectedItems(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => setSelectedItems(prev => ({ ...prev, [item.id]: false })), 500);
        toast.success(`${item.name} added to cart!`);

        if (sessionId) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
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
            } catch (error) {
                console.warn('Backend select-items sync note:', error.message);
            }
        }
    };

    // Remove from cart (resilient local-first update)
    const removeFromCart = async (itemId, itemName) => {
        const updatedCart = cart.filter(item => item.id !== itemId && item.name !== itemName);
        setCart(updatedCart);
        onCartUpdate?.(updatedCart);
        toast.success(`${itemName || 'Item'} removed from cart`);

        if (sessionId) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    'http://localhost:5000/api/agent/order/remove-from-cart',
                    { sessionId: sessionId, itemId: itemId },
                    { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
                );
            } catch (error) {
                console.warn('Backend remove sync note:', error.message);
            }
        }
    };

    // Update quantity
    const updateQuantity = async (itemId, itemName, currentQuantity, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId, itemName);
            return;
        }
        const updatedCart = cart.map(item => (item.id === itemId || item.name === itemName) ? { ...item, quantity: newQuantity } : item);
        setCart(updatedCart);
        onCartUpdate?.(updatedCart);

        if (sessionId) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    'http://localhost:5000/api/agent/order/update-cart-quantity',
                    { sessionId: sessionId, itemId: itemId, quantity: newQuantity },
                    { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
                );
            } catch (error) {
                console.warn('Backend update quantity sync note:', error.message);
            }
        }
    };

    // Add selected items (multi-select)
    const addSelectedToCart = async () => {
        const selected = menuItems.filter(item => selectedItems[item.id]);
        if (selected.length === 0) {
            toast.info('Please select items first');
            return;
        }
        let updatedCart = [...cart];
        for (const item of selected) {
            const idx = updatedCart.findIndex(c => c.id === item.id || (c.name && item.name && c.name.toLowerCase() === item.name.toLowerCase()));
            if (idx >= 0) {
                updatedCart[idx] = { ...updatedCart[idx], quantity: (updatedCart[idx].quantity || 1) + 1 };
            } else {
                updatedCart.push({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price) || 0,
                    quantity: 1,
                    imageUrl: item.imageUrl || item.image,
                    category: item.category,
                    isVeg: item.isVeg
                });
            }
        }
        setCart(updatedCart);
        setSelectedItems({});
        onCartUpdate?.(updatedCart);
        toast.success(`Added ${selected.length} items to cart!`);
        setActiveTab('cart');

        if (sessionId) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    'http://localhost:5000/api/agent/order/select-items',
                    {
                        sessionId: sessionId,
                        selectedItems: selected.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            imageUrl: item.imageUrl || item.image,
                            category: item.category,
                            isVeg: item.isVeg
                        }))
                    },
                    { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
                );
            } catch (error) {
                console.warn('Backend addSelectedToCart sync note:', error.message);
            }
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
        if (onProceedToPayment) {
            onProceedToPayment(cart, total);
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
                    {/* Sticky Bottom Cart Bar on Menu */}
                    {cart.length > 0 && (
                        <div className="menu-bottom-cart-bar" style={{
                            position: 'sticky',
                            top: '0',
                            margin: '0 0 16px 0',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)',
                            zIndex: 50
                        }}>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '15px' }}>🛒 {cart.length} item{cart.length > 1 ? 's' : ''} • ₹{total}</div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>✅ Swiggy Reserve Pay Eligible (PIN-less)</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setActiveTab('cart')}
                                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                                >
                                    View Cart
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleProceedToPayment}
                                    style={{ background: '#ffffff', border: 'none', color: '#059669', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    Proceed to Payment →
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="menu-items-grid">
                        {menuItems.map(item => (
                            <div key={item.id} className={`menu-item-card ${selectedItems[item.id] ? 'selected' : ''}`} onClick={() => toggleItemSelection(item.id)}>
                                <div className="menu-item-image">
                                    <img 
                                        src={item.imageUrl || '/images/items/default.png'} 
                                        alt={item.name} 
                                        style={{ width: '48px', height: '48px', minWidth: '48px', objectFit: 'cover', borderRadius: '8px' }}
                                        onError={(event) => { event.currentTarget.src = '/images/items/default.png'; }} 
                                    />
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
                                            <img 
                                                src={item.image || item.imageUrl || '/images/items/default.png'} 
                                                alt={item.name} 
                                                style={{ width: '44px', height: '44px', minWidth: '44px', objectFit: 'cover', borderRadius: '8px' }}
                                                onError={(event) => { event.currentTarget.src = '/images/items/default.png'; }} 
                                            />
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
                            <div className="cart-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                                {reserveCheck && reserveCheck.eligible && (
                                    <button 
                                        type="button"
                                        className="reserve-pay-instant-btn" 
                                        onClick={handleProceedToPayment}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '12px 16px',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                                        }}
                                    >
                                        ⚡ 1-Tap Reserve Pay (₹{total} PIN-less)
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <button 
                                        type="button"
                                        className="add-more-btn" 
                                        onClick={() => setActiveTab('menu')}
                                        style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                    >
                                        ➕ Add Items
                                    </button>
                                    <button 
                                        type="button"
                                        className="schedule-btn" 
                                        onClick={handleScheduleOrder}
                                        style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        <FaCalendarAlt /> Schedule
                                    </button>
                                    <button 
                                        type="button"
                                        className="checkout-btn" 
                                        onClick={handleProceedToPayment}
                                        style={{ flex: 1.2, padding: '10px 8px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    >
                                        <FaCreditCard /> Pay →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Date/Time Modal */}
            {showDateTimeModal && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '16px'
                    }} 
                    onClick={() => setShowDateTimeModal(false)}
                >
                    <div 
                        style={{
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '420px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                            color: '#1f2937'
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>📅 Schedule Your Order</h3>
                            <button 
                                onClick={() => setShowDateTimeModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Select Delivery Date</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate} 
                                    onChange={(e) => setScheduleDate(e.target.value)} 
                                    min={new Date().toISOString().split('T')[0]} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Select Delivery Time</label>
                                <input 
                                    type="time" 
                                    value={scheduleTime} 
                                    onChange={(e) => setScheduleTime(e.target.value)} 
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '12px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: '#4b5563' }}>Items in Order:</span>
                                    <span style={{ fontWeight: '600' }}>{cart.length} item(s)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#4b5563' }}>Total to Charge:</span>
                                    <span style={{ fontWeight: '700', color: '#059669' }}>₹{total}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowDateTimeModal(false)}
                                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDateTimeConfirm}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Next: Select Payment →
                            </button>
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
