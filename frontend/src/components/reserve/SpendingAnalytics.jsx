import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaCalendarAlt,
  FaDownload,
  FaRupeeSign,
  FaArrowUp,
  FaArrowDown,
  FaShoppingBag,
  FaUtensils,
  FaFilm,
  FaGasPump,
  FaPlane,
  FaMedkit,
  FaGraduationCap,
  FaPaw,
  FaGift,
  FaCoffee,
  FaFire,
  FaInfoCircle
} from 'react-icons/fa';
import { MdLocalGroceryStore } from 'react-icons/md';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Button from '../common/Button';
import axios from 'axios';
import toast from 'react-hot-toast';
import './ReserveStyles.css';

const SpendingAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('month');
  const [chartType, setChartType] = useState('line');
  const [analytics, setAnalytics] = useState({
    summary: {},
    byCategory: [],
    byMerchant: [],
    trends: [],
    insights: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/reserve/spending-by-merchant?period=${timeframe}`
      );
      
      if (response.data.success) {
        processAnalytics(response.data.data);
      }

      // Fetch category breakdown
      const categoryResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions/stats?period=${timeframe}`
      );
      
      if (categoryResponse.data.success) {
        setAnalytics(prev => ({
          ...prev,
          byCategory: categoryResponse.data.data.by_category || []
        }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (data) => {
    // Process merchant spending
    const merchantData = data.spending || [];
    
    // Generate trends (mock data for demo)
    const trends = generateTrends(timeframe);
    
    // Generate insights
    const insights = generateInsights(merchantData, trends);

    setAnalytics(prev => ({
      ...prev,
      byMerchant: merchantData,
      trends: trends,
      insights: insights,
      summary: calculateSummary(merchantData)
    }));
  };

  const generateTrends = (period) => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const trends = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      
      trends.push({
        date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        amount: Math.floor(Math.random() * 2000) + 500,
        transactions: Math.floor(Math.random() * 10) + 1
      });
    }
    
    return trends;
  };

  const generateInsights = (merchants, trends) => {
    const insights = [];
    
    // Calculate totals
    const totalSpent = merchants.reduce((sum, m) => sum + m.total_spent, 0);
    const avgTransaction = merchants.reduce((sum, m) => sum + m.avg_amount, 0) / (merchants.length || 1);
    
    // Find top merchant
    const topMerchant = merchants.sort((a, b) => b.total_spent - a.total_spent)[0];
    
    if (topMerchant) {
      insights.push({
        type: 'top',
        message: `Your highest spending is on ${topMerchant.merchant} (₹${topMerchant.total_spent.toLocaleString()})`,
        icon: FaFire,
        color: '#ef4444'
      });
    }

    // Check spending trend
    if (trends.length > 1) {
      const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
      const secondHalf = trends.slice(Math.floor(trends.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;
      
      const trend = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      insights.push({
        type: trend > 0 ? 'up' : 'down',
        message: `Spending is ${trend > 0 ? 'up' : 'down'} ${Math.abs(trend).toFixed(1)}% compared to last period`,
        icon: trend > 0 ? FaArrowUp : FaArrowDown,
        color: trend > 0 ? '#ef4444' : '#10b981'
      });
    }

    // Add saving opportunity
    if (totalSpent > 5000) {
      insights.push({
        type: 'save',
        message: 'You could save ₹500/month by setting stricter limits',
        icon: FaInfoCircle,
        color: '#f59e0b'
      });
    }

    return insights;
  };

  const calculateSummary = (merchants) => {
    const totalSpent = merchants.reduce((sum, m) => sum + m.total_spent, 0);
    const totalTransactions = merchants.reduce((sum, m) => sum + m.transaction_count, 0);
    const uniqueMerchants = merchants.length;
    const avgPerMerchant = totalSpent / (uniqueMerchants || 1);

    return {
      totalSpent,
      totalTransactions,
      uniqueMerchants,
      avgPerMerchant
    };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: FaUtensils,
      shopping: FaShoppingBag,
      groceries: MdLocalGroceryStore,
      entertainment: FaFilm,
      travel: FaPlane,
      fuel: FaGasPump,
      healthcare: FaMedkit,
      education: FaGraduationCap,
      pets: FaPaw,
      gifts: FaGift,
      coffee: FaCoffee
    };
    return icons[category] || FaShoppingBag;
  };

  const getCategoryColor = (category) => {
    const colors = {
      food: '#f59e0b',
      shopping: '#8b5cf6',
      groceries: '#10b981',
      entertainment: '#ec4899',
      travel: '#3b82f6',
      fuel: '#ef4444',
      healthcare: '#14b8a6',
      education: '#f97316',
      pets: '#a855f7',
      gifts: '#d946ef',
      coffee: '#b45309'
    };
    return colors[category] || '#6b7280';
  };

  const COLORS = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  const timeframeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'Last 3 Months' }
  ];

  const chartOptions = [
    { value: 'line', label: 'Trend', icon: FaChartLine },
    { value: 'bar', label: 'Comparison', icon: FaChartBar },
    { value: 'pie', label: 'Categories', icon: FaChartPie }
  ];

  const handleExport = () => {
    const data = {
      summary: analytics.summary,
      byMerchant: analytics.byMerchant,
      byCategory: analytics.byCategory,
      timeframe
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spending-analytics-${timeframe}.json`;
    a.click();
    
    toast.success('Analytics exported successfully!');
  };

  return (
    <div className="spending-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-title">
          <FaChartLine className="header-icon" />
          <h2>Spending Analytics</h2>
        </div>

        <div className="header-controls">
          <div className="timeframe-selector">
            {timeframeOptions.map(option => (
              <button
                key={option.value}
                className={`timeframe-btn ${timeframe === option.value ? 'active' : ''}`}
                onClick={() => setTimeframe(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="chart-type-selector">
            {chartOptions.map(option => (
              <button
                key={option.value}
                className={`chart-type-btn ${chartType === option.value ? 'active' : ''}`}
                onClick={() => setChartType(option.value)}
                title={option.label}
              >
                <option.icon />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="small"
            onClick={handleExport}
            icon={FaDownload}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon spent">
            <FaRupeeSign />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Spent</span>
            <span className="summary-value">₹{analytics.summary.totalSpent?.toLocaleString() || '0'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon transactions">
            <FaChartLine />
          </div>
          <div className="summary-info">
            <span className="summary-label">Transactions</span>
            <span className="summary-value">{analytics.summary.totalTransactions || '0'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon merchants">
            <FaShoppingBag />
          </div>
          <div className="summary-info">
            <span className="summary-label">Merchants</span>
            <span className="summary-value">{analytics.summary.uniqueMerchants || '0'}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon average">
            <FaChartBar />
          </div>
          <div className="summary-info">
            <span className="summary-label">Avg/Merchant</span>
            <span className="summary-value">₹{Math.round(analytics.summary.avgPerMerchant || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' && (
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#667eea"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Spending (₹)"
              />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke="#10b981"
                strokeWidth={2}
                name="Transactions"
              />
            </LineChart>
          )}

          {chartType === 'bar' && (
            <BarChart data={analytics.byMerchant.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
              <XAxis dataKey="merchant" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_spent" fill="#667eea" name="Total Spent" />
              <Bar dataKey="transaction_count" fill="#10b981" name="Transactions" />
            </BarChart>
          )}

          {chartType === 'pie' && (
            <PieChart>
              <Pie
                data={analytics.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="total_amount"
                nameKey="category"
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Insights & Recommendations</h3>
        <div className="insights-grid">
          {analytics.insights.map((insight, index) => (
            <motion.div
              key={index}
              className="insight-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{ borderColor: insight.color }}
            >
              <div className="insight-icon" style={{ color: insight.color }}>
                <insight.icon />
              </div>
              <p className="insight-message">{insight.message}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Merchant Breakdown */}
      <div className="merchant-breakdown">
        <h3>Merchant Breakdown</h3>
        <div className="merchant-table">
          <table>
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Transactions</th>
                <th>Total Spent</th>
                <th>Average</th>
                <th>Last Transaction</th>
              </tr>
            </thead>
            <tbody>
              {analytics.byMerchant.map((merchant, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td>
                    <div className="merchant-cell">
                      <span
                        className="merchant-dot"
                        style={{ backgroundColor: getCategoryColor(merchant.category) }}
                      />
                      {merchant.merchant}
                    </div>
                  </td>
                  <td>{merchant.transaction_count}</td>
                  <td>₹{merchant.total_spent?.toLocaleString()}</td>
                  <td>₹{Math.round(merchant.avg_amount || 0).toLocaleString()}</td>
                  <td>{new Date(merchant.last_transaction).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalytics;