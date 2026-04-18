// frontend/src/components/common/OrderComponents.jsx
// Complete order management components for SabAI Assistant

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingBag, 
  FaUtensils, 
  FaStore, 
  FaRupeeSign,
  FaStar,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaHome,
  FaBox,
  FaCreditCard,
  FaWallet,
  FaCoins,
  FaArrowRight,
  FaMinus,
  FaPlus,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import './orderComponents.css';

// ============================================
// RESTAURANT CARD COMPONENT
// ============================================
export const RestaurantCard = ({ restaurant, onSelect }) => {
  return (
    <motion.div 
      className="restaurant-card"
      whileHover={{ y: -4 }}
      onClick={() => onSelect(restaurant)}
    >
      <div className="restaurant-image">
        {restaurant.image || '🍽️'}
      </div>
      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p className="restaurant-cuisine">{restaurant.cuisine}</p>
        <div className="restaurant-meta">
          <span className="rating">
            <FaStar /> {restaurant.rating} ({restaurant.ratings?.toLocaleString() || '1k+'})
          </span>
          <span className="cost">₹{restaurant.costForTwo} for two</span>
          <span className="time">
            <FaClock /> {restaurant.deliveryTime}
          </span>
        </div>
        <p className="location">
          <FaMapMarkerAlt /> {restaurant.location}
        </p>
        <button className="view-menu-btn">
          View Menu <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// RESTAURANT LIST COMPONENT
// ============================================
export const RestaurantList = ({ restaurants, onSelectRestaurant }) => {
  const [filter, setFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'biryani', label: 'Biryani' },
    { id: 'pizza', label: 'Pizza' },
    { id: 'burger', label: 'Burgers' },
    { id: 'south', label: 'South Indian' },
    { id: 'chinese', label: 'Chinese' }
  ];

  const filteredRestaurants = filter === 'all' 
    ? restaurants 
    : restaurants.filter(r => r.cuisine?.toLowerCase().includes(filter));

  return (
    <div className="restaurant-list-container">
      <div className="restaurant-filters">
        {filters.map(f => (
          <button
            key={f.id}
            className={`filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      <div className="restaurant-grid">
        {filteredRestaurants.map((restaurant, index) => (
          <RestaurantCard
            key={restaurant.id || index}
            restaurant={restaurant}
            onSelect={onSelectRestaurant}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// MENU ITEM COMPONENT
// ============================================
export const MenuItem = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    onAddToCart({ ...item, quantity });
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <motion.div 
      className="menu-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
    >
      <div className="menu-item-info">
        <h4>{item.name}</h4>
        <p className="menu-item-desc">{item.description}</p>
        <div className="menu-item-meta">
          <span className="price">₹{item.price}</span>
          {item.popularity && (
            <span className="popularity">
              {item.popularity}% ordered
            </span>
          )}
          {item.category && (
            <span className="category">{item.category}</span>
          )}
        </div>
      </div>
      
      <div className="menu-item-actions">
        <div className="quantity-control">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <FaMinus />
          </button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)}>
            <FaPlus />
          </button>
        </div>
        
        <button 
          className={`add-to-cart-btn ${isAdding ? 'adding' : ''}`}
          onClick={handleAdd}
        >
          {isAdding ? 'Added!' : 'Add'}
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// RESTAURANT MENU COMPONENT
// ============================================
export const RestaurantMenu = ({ restaurant, menu, onAddToCart, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = ['all', ...new Set(menu.map(item => item.category))];
  
  const filteredItems = selectedCategory === 'all'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  return (
    <div className="restaurant-menu-container">
      <div className="menu-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to restaurants
        </button>
        <div className="restaurant-summary">
          <span className="restaurant-name">{restaurant.name}</span>
          <span className="restaurant-rating">
            <FaStar /> {restaurant.rating}
          </span>
        </div>
      </div>

      <div className="menu-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="menu-items">
        {filteredItems.map((item, index) => (
          <MenuItem
            key={item.id || index}
            item={item}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
export const ProductCard = ({ product, onSelect }) => {
  return (
    <motion.div 
      className="product-card"
      whileHover={{ y: -4 }}
      onClick={() => onSelect(product)}
    >
      <div className="product-image">
        {product.image || '📦'}
      </div>
      <div className="product-info">
        <h4>{product.name}</h4>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-meta">
          <span className="price">₹{product.price}</span>
          {product.unit && (
            <span className="unit">per {product.unit}</span>
          )}
          {product.rating && (
            <span className="rating">
              <FaStar /> {product.rating}
            </span>
          )}
        </div>
        {product.brand && (
          <span className="brand">{product.brand}</span>
        )}
      </div>
      <button className="select-product-btn">
        Select
      </button>
    </motion.div>
  );
};

// ============================================
// PRODUCT GRID COMPONENT
// ============================================
export const ProductGrid = ({ products, onSelectProduct }) => {
  return (
    <div className="product-grid-container">
      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id || index}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// CART ITEM COMPONENT
// ============================================
export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h4>{item.name}</h4>
        <p className="cart-item-price">₹{item.price} x {item.quantity}</p>
      </div>
      
      <div className="cart-item-total">
        <span>₹{item.total || (item.price * item.quantity)}</span>
      </div>
      
      <div className="cart-item-actions">
        <button 
          className="quantity-btn"
          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          disabled={item.quantity <= 1}
        >
          <FaMinus />
        </button>
        <span className="quantity">{item.quantity}</span>
        <button 
          className="quantity-btn"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        >
          <FaPlus />
        </button>
        <button 
          className="remove-btn"
          onClick={() => onRemove(item.id)}
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

// ============================================
// CART SUMMARY COMPONENT
// ============================================
export const CartSummary = ({ items, total, onCheckout }) => {
  const subtotal = total || items.reduce((sum, item) => 
    sum + (item.total || (item.price * item.quantity)), 0
  );
  const tax = subtotal * 0.05;
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const grandTotal = subtotal + tax + deliveryFee;

  return (
    <div className="cart-summary">
      <h3>Order Summary</h3>
      
      <div className="summary-items">
        {items.map(item => (
          <div key={item.id} className="summary-item">
            <span>{item.quantity}x {item.name}</span>
            <span>₹{item.total || (item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      
      <div className="summary-breakdown">
        <div className="breakdown-row">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="breakdown-row">
          <span>Tax (5%)</span>
          <span>₹{tax}</span>
        </div>
        <div className="breakdown-row">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
        </div>
        <div className="breakdown-row total">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <button className="checkout-btn" onClick={onCheckout}>
        Proceed to Checkout <FaArrowRight />
      </button>
    </div>
  );
};

// ============================================
// PAYMENT METHOD SELECTOR
// ============================================
export const PaymentMethodSelector = ({ onSelect, selected }) => {
  const methods = [
    { id: 'upi', name: 'UPI', icon: FaWallet, description: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: FaCreditCard, description: 'Visa, MasterCard, RuPay' },
    { id: 'reserve', name: 'Reserve Pay', icon: FaBox, description: 'PIN-less payments' },
    { id: 'coins', name: 'SabAI Gems', icon: FaCoins, description: 'Pay with reward points' }
  ];

  return (
    <div className="payment-methods">
      <h3>Select Payment Method</h3>
      <div className="methods-grid">
        {methods.map(method => (
          <button
            key={method.id}
            className={`method-card ${selected === method.id ? 'selected' : ''}`}
            onClick={() => onSelect(method.id)}
          >
            <method.icon className="method-icon" />
            <div className="method-info">
              <span className="method-name">{method.name}</span>
              <span className="method-desc">{method.description}</span>
            </div>
            {selected === method.id && (
              <FaCheckCircle className="selected-icon" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ORDER TRACKING COMPONENT
// ============================================
export const OrderTracking = ({ order, tracking }) => {
  const getStepIcon = (status) => {
    switch(status) {
      case 'confirmed': return <FaCheckCircle />;
      case 'preparing': return <FaUtensils />;
      case 'out_for_delivery': return <FaTruck />;
      case 'delivered': return <FaHome />;
      default: return <FaClock />;
    }
  };

  return (
    <div className="order-tracking">
      <div className="order-header">
        <h3>Order #{order.id}</h3>
        <span className="order-status">{order.status}</span>
      </div>

      <div className="tracking-steps">
        {tracking.map((step, index) => (
          <div key={index} className={`tracking-step ${step.completed ? 'completed' : ''}`}>
            <div className="step-icon">
              {getStepIcon(step.status)}
            </div>
            <div className="step-info">
              <p className="step-label">{step.label}</p>
              {step.time && <p className="step-time">{step.time}</p>}
            </div>
            {index < tracking.length - 1 && (
              <div className={`step-line ${step.completed ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="order-details">
        <p><strong>Restaurant:</strong> {order.merchantName}</p>
        <p><strong>Total:</strong> ₹{order.totalAmount}</p>
        <p><strong>Payment:</strong> {order.paymentMethod}</p>
        <p><strong>Estimated Delivery:</strong> {order.estimatedDelivery}</p>
      </div>

      <div className="order-items">
        <h4>Items</h4>
        {order.items?.map((item, index) => (
          <div key={index} className="order-item">
            <span>{item.quantity}x {item.name}</span>
            <span>₹{item.total || (item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ORDER CONFIRMATION MODAL
// ============================================
export const OrderConfirmationModal = ({ isOpen, onClose, order, onTrack }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="order-confirmation-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Order Confirmed! 🎉</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="confirmation-content">
            <div className="success-icon">
              <FaCheckCircle />
            </div>

            <p className="order-id">Order ID: {order.id}</p>
            
            <div className="order-summary">
              <p><strong>Total:</strong> ₹{order.totalAmount}</p>
              <p><strong>Coins Earned:</strong> +{order.coinsEarned} 🪙</p>
              <p><strong>Estimated Delivery:</strong> {order.estimatedDelivery}</p>
            </div>

            <div className="confirmation-actions">
              <button className="track-btn" onClick={() => onTrack(order.id)}>
                Track Order
              </button>
              <button className="done-btn" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// SEARCH BAR COMPONENT
// ============================================
export const SearchBar = ({ onSearch, placeholder }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Search for restaurants, dishes, or products..."}
      />
      <button type="submit">Search</button>
    </form>
  );
};