// frontend/src/components/RestaurantMenuGrid.jsx

import React, { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const RestaurantMenuGrid = ({ products, merchant, sessionId, onAddToCart }) => {
    const [selectedItems, setSelectedItems] = useState({});
    
    const toggleItem = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };
    
    const addSelectedToCart = () => {
        const selectedProducts = products.filter(item => selectedItems[item.id]);
        if (selectedProducts.length > 0) {
            onAddToCart(selectedProducts);
            setSelectedItems({});
            toast.success(`${selectedProducts.length} items added to cart!`);
        } else {
            toast.info('Please select items first');
        }
    };
    
    const addSingleToCart = (item) => {
        onAddToCart([item]);
        // Visual feedback
        setSelectedItems(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => {
            setSelectedItems(prev => ({ ...prev, [item.id]: false }));
        }, 1000);
        toast.success(`${item.name} added to cart!`);
    };
    
    const selectedCount = Object.values(selectedItems).filter(v => v).length;
    const restaurantName = products[0]?.restaurantName || '';
    const restaurantRating = products[0]?.restaurantRating;
    const deliveryTime = products[0]?.deliveryTime;
    
    return (
        <div className="restaurant-menu-container">
            <div className="restaurant-header-enhanced">
                <h3>{restaurantName || `${merchant?.toUpperCase()} Menu`}</h3>
                {restaurantRating && (
                    <div className="restaurant-meta">
                        <span>⭐ {restaurantRating}</span>
                        <span>⏱️ {deliveryTime || '30-40 min'}</span>
                    </div>
                )}
                <p className="menu-instruction">Click on items to select, then click "Add Selected"</p>
            </div>
            
            {selectedCount > 0 && (
                <div className="selection-bar">
                    <span>{selectedCount} item(s) selected</span>
                    <button className="add-selected-btn" onClick={addSelectedToCart}>
                        + Add Selected ({selectedCount})
                    </button>
                </div>
            )}
            
            <div className="menu-items-grid-enhanced">
                {products.map(item => (
                    <div 
                        key={item.id} 
                        className={`menu-item-card-enhanced ${selectedItems[item.id] ? 'selected' : ''}`}
                        onClick={() => toggleItem(item.id)}
                    >
                        <div className="menu-item-image">
                            <img 
                                src={item.imageUrl || '/images/items/default.png'} 
                                alt={item.name}
                                onError={(e) => { e.target.src = '/images/items/default.png'; }}
                            />
                            {item.isVeg && <span className="veg-badge">🌱</span>}
                            {selectedItems[item.id] && (
                                <div className="selected-overlay">
                                    <FaCheckCircle />
                                </div>
                            )}
                        </div>
                        <div className="menu-item-info-enhanced">
                            <h4>{item.name}</h4>
                            <div className="menu-item-price">₹{item.price}</div>
                            <div className="menu-item-category">{item.category}</div>
                        </div>
                        <button 
                            className={`add-to-cart-btn ${selectedItems[item.id] ? 'selected' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                addSingleToCart(item);
                            }}
                        >
                            {selectedItems[item.id] ? '✓ Added' : '+ Add'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantMenuGrid;