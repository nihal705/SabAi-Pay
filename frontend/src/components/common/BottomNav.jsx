// frontend/src/components/common/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    FaHome, FaWallet, FaQrcode, FaUser, FaHistory,
    FaComment, FaBell, FaShoppingBag
} from 'react-icons/fa';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'home', label: 'Home', icon: FaHome, path: '/dashboard' },
        { id: 'chat', label: 'Agent', icon: FaComment, path: '/agent-chat' },
        { id: 'qr', label: 'QR', icon: FaQrcode, path: '/qr-code' },
        { id: 'pay', label: 'Pay', icon: FaWallet, path: '/send-money' },
        { id: 'history', label: 'History', icon: FaHistory, path: '/transactions' }
    ];

    return (
        <div className="bottom-nav">
            {navItems.map(item => {
                const isActive = location.pathname === item.path || 
                               location.pathname.startsWith(item.path + '/');
                return (
                    <button
                        key={item.id}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <item.icon className="nav-icon" />
                        <span className="nav-label">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;