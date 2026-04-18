// frontend/src/components/SituationSuggestionsCard.jsx
// DISPLAYS SITUATION-BASED SUGGESTIONS

import React, { useState } from 'react';
import { FaRupeeSign, FaCheckCircle, FaShoppingCart, FaLightbulb, FaBoxes } from 'react-icons/fa';

const SituationSuggestionsCard = ({ 
    situation,
    explanation,
    essentialItems = [],
    otherItems = [],
    allItems = [],
    categories = [],
    merchant,
    onItemSelect,
    onOrderEssentials,
    onSelectItems,
    onCustomize,
    totalEstimatedCost = 0
}) => {
    const [selectedItems, setSelectedItems] = useState({});
    const [view, setView] = useState('essentials');

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const getSelectedCount = () => Object.values(selectedItems).filter(v => v).length;
    const getSelectedTotal = () => {
        return allItems.reduce((sum, item) => {
            if (selectedItems[item.id]) {
                return sum + (item.price * (item.suggestedQuantity || 1));
            }
            return sum;
        }, 0);
    };

    const handleOrderSelected = () => {
        const selectedItemsList = allItems.filter(item => selectedItems[item.id]);
        onSelectItems?.(selectedItemsList);
    };

    const getSituationIcon = () => {
        const icons = {
            'pg_hostel': '🏠',
            'sick_flu': '🤒',
            'hungry_quick': '🍔',
            'cooking_at_home': '🍳',
            'party_hosting': '🎉',
            'study_exam': '📚'
        };
        return icons[situation] || '💡';
    };

    return (
        <div className="situation-suggestions-card">
            {/* Header */}
            <div className="situation-header">
                <div className="situation-icon">{getSituationIcon()}</div>
                <div className="situation-info">
                    <h3>Smart Suggestions for You</h3>
                    <p>{explanation}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="situation-tabs">
                <button 
                    className={`tab ${view === 'essentials' ? 'active' : ''}`}
                    onClick={() => setView('essentials')}
                >
                    <FaBoxes /> Essentials ({essentialItems.length})
                </button>
                <button 
                    className={`tab ${view === 'all' ? 'active' : ''}`}
                    onClick={() => setView('all')}
                >
                    <FaLightbulb /> All Suggestions ({allItems.length})
                </button>
                <button 
                    className={`tab ${view === 'selected' ? 'active' : ''}`}
                    onClick={() => setView('selected')}
                >
                    <FaShoppingCart /> Selected ({getSelectedCount()})
                </button>
            </div>

            {/* Essential Items View */}
            {view === 'essentials' && (
                <div className="items-list">
                    <div className="list-header">
                        <h4>Must-Have Items for You</h4>
                        <p>These are the most important items based on your situation</p>
                    </div>
                    {essentialItems.map(item => (
                        <div key={item.id} className="suggestion-item">
                            <div className="item-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems[item.id] || false}
                                    onChange={() => toggleItemSelection(item.id)}
                                />
                            </div>
                            <div className="item-image">
                                <img src={item.imageUrl} alt={item.name} />
                            </div>
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <div className="item-meta">
                                    <span className="category">{item.category}</span>
                                    {item.isVeg && <span className="veg-badge">🌱 Veg</span>}
                                </div>
                            </div>
                            <div className="item-price">
                                <FaRupeeSign /> {item.price}
                                {item.suggestedQuantity > 1 && (
                                    <span className="quantity"> x{item.suggestedQuantity}</span>
                                )}
                            </div>
                            <button 
                                className="add-btn"
                                onClick={() => onItemSelect?.(item)}
                            >
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* All Items View */}
            {view === 'all' && (
                <div className="items-list">
                    <div className="list-header">
                        <h4>Complete List of Suggestions</h4>
                        <p>Select items you want to order</p>
                    </div>
                    {allItems.map(item => (
                        <div key={item.id} className="suggestion-item">
                            <div className="item-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems[item.id] || false}
                                    onChange={() => toggleItemSelection(item.id)}
                                />
                            </div>
                            <div className="item-image">
                                <img src={item.imageUrl} alt={item.name} />
                            </div>
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <div className="item-meta">
                                    <span className="category">{item.category}</span>
                                    {item.essential && <span className="essential-badge">Essential</span>}
                                </div>
                            </div>
                            <div className="item-price">
                                <FaRupeeSign /> {item.price}
                            </div>
                            <button 
                                className="add-btn"
                                onClick={() => onItemSelect?.(item)}
                            >
                                Add
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Items View */}
            {view === 'selected' && (
                <div className="selected-view">
                    {getSelectedCount() === 0 ? (
                        <div className="empty-selected">
                            <p>No items selected yet</p>
                            <p>Check items from the suggestions list</p>
                        </div>
                    ) : (
                        <>
                            <div className="selected-items-list">
                                {allItems.filter(item => selectedItems[item.id]).map(item => (
                                    <div key={item.id} className="selected-item">
                                        <div className="item-info">
                                            <img src={item.imageUrl} alt={item.name} />
                                            <div>
                                                <h4>{item.name}</h4>
                                                <div className="item-price">
                                                    <FaRupeeSign /> {item.price}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            className="remove-selected"
                                            onClick={() => toggleItemSelection(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="selected-summary">
                                <div className="summary-row">
                                    <span>Items Selected:</span>
                                    <strong>{getSelectedCount()}</strong>
                                </div>
                                <div className="summary-row">
                                    <span>Estimated Total:</span>
                                    <strong><FaRupeeSign /> {getSelectedTotal()}</strong>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button 
                    className="btn-essentials"
                    onClick={() => onOrderEssentials?.(essentialItems)}
                >
                    🛒 Order Essentials ({essentialItems.length} items)
                </button>
                <button 
                    className="btn-selected"
                    onClick={handleOrderSelected}
                    disabled={getSelectedCount() === 0}
                >
                    📦 Order Selected ({getSelectedCount()} items)
                </button>
                <button 
                    className="btn-customize"
                    onClick={() => onCustomize?.()}
                >
                    ✏️ Customize List
                </button>
            </div>

            <style jsx>{`
                .situation-suggestions-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .situation-header {
                    display: flex;
                    gap: 16px;
                    padding: 20px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                }
                
                .situation-icon {
                    font-size: 48px;
                }
                
                .situation-info h3 {
                    margin: 0 0 8px;
                }
                
                .situation-info p {
                    margin: 0;
                    opacity: 0.9;
                }
                
                .situation-tabs {
                    display: flex;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                
                .tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                
                .tab.active {
                    color: #4f46e5;
                    border-bottom: 2px solid #4f46e5;
                    background: white;
                }
                
                .items-list {
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .list-header {
                    padding: 16px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .list-header h4 {
                    margin: 0 0 4px;
                }
                
                .list-header p {
                    margin: 0;
                    font-size: 12px;
                    color: #64748b;
                }
                
                .suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-bottom: 1px solid #e2e8f0;
                    transition: background 0.2s;
                }
                
                .suggestion-item:hover {
                    background: #f8fafc;
                }
                
                .item-checkbox input {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }
                
                .item-image {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .item-details {
                    flex: 1;
                }
                
                .item-details h4 {
                    margin: 0 0 4px;
                    font-size: 14px;
                }
                
                .item-meta {
                    display: flex;
                    gap: 8px;
                    font-size: 11px;
                }
                
                .category {
                    color: #64748b;
                }
                
                .essential-badge {
                    background: #dcfce7;
                    color: #166534;
                    padding: 2px 6px;
                    border-radius: 12px;
                }
                
                .item-price {
                    font-weight: 600;
                    color: #4f46e5;
                    min-width: 80px;
                }
                
                .add-btn {
                    padding: 6px 16px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .selected-view {
                    padding: 16px;
                    min-height: 300px;
                }
                
                .empty-selected {
                    text-align: center;
                    padding: 48px;
                    color: #64748b;
                }
                
                .selected-items-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .selected-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .selected-item .item-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .selected-item .item-info img {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    object-fit: cover;
                }
                
                .remove-selected {
                    padding: 4px 12px;
                    background: #fee2e2;
                    color: #ef4444;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .selected-summary {
                    margin-top: 16px;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .action-buttons {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    border-top: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                
                .btn-essentials {
                    flex: 1;
                    padding: 10px;
                    background: #10b981;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .btn-selected {
                    flex: 1;
                    padding: 10px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .btn-selected:disabled {
                    background: #cbd5e1;
                    cursor: not-allowed;
                }
                
                .btn-customize {
                    padding: 10px 16px;
                    background: white;
                    color: #4f46e5;
                    border: 1px solid #4f46e5;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default SituationSuggestionsCard;