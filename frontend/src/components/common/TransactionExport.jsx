// frontend/src/components/common/TransactionExport.jsx
import React, { useState } from 'react';
import { FaDownload, FaFileCsv, FaFilePdf, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import './TransactionExport.css';

const TransactionExport = ({ onExport }) => {
    const [format, setFormat] = useState('csv');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/features/transactions/export', {
                params: { format, startDate, endDate },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transactions_${Date.now()}.${format === 'csv' ? 'csv' : 'pdf'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`Transactions exported as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export transactions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="export-container">
            <div className="export-header">
                <h4>Export Transactions</h4>
            </div>
            <div className="export-options">
                <div className="export-format">
                    <button 
                        className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                        onClick={() => setFormat('csv')}
                    >
                        <FaFileCsv /> CSV
                    </button>
                    <button 
                        className={`format-btn ${format === 'pdf' ? 'active' : ''}`}
                        onClick={() => setFormat('pdf')}
                    >
                        <FaFilePdf /> PDF
                    </button>
                </div>
                <div className="export-dates">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date"
                    />
                </div>
                <button 
                    className="export-btn"
                    onClick={handleExport}
                    disabled={loading}
                >
                    {loading ? <FaSpinner className="spinner" /> : <FaDownload />}
                    Export
                </button>
            </div>
        </div>
    );
};

export default TransactionExport;