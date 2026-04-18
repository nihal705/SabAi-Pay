# SabAI Pay - AI-Powered UPI Payment Assistant with Agent Pay and Reserve Pay

## 🚀 Overview

SabAI Pay is an intelligent AI-powered payment assistant that helps users with UPI payments, bill payments, mobile recharges, food ordering, shopping, and managing Reserve Pay limits. The system features an interactive chatbot interface, multiple payment methods (Bank Account, SabAI Gems, Reserve Pay), real-time order tracking, and scheduled payments with auto-pay.

## ✨ Features

### 🤖 AI Assistant
- **Intent Classification** - ML-powered understanding of user requests
- **Entity Extraction** - Automatically detects items, quantities, restaurants
- **Context-Aware Responses** - Maintains conversation context
- **Hybrid Intent Handling** - Understands situations and converts to orders

### 🛒 Order Management
- Restaurant menu browsing with interactive grid
- Cart management (add, remove, update quantities)
- Multiple payment methods (UPI, Bank, SabAI Gems, Reserve Pay)
- Real-time order tracking with status updates
- Scheduled orders with auto-pay

### 💳 Payment Methods
|     Method   |     Description     | Cashback |
|--------------|---------------------|----------|
| SabAI Gems   | Use earned gems     |    0%    |
| Reserve Pay  | Monthly limit based |    5%    |
| Bank Account | Direct debit        |    5%    |
| UPI          | Instant payment     |    5%    |

### 📅 Auto-Pay & Scheduling
- Schedule orders for future delivery
- Set up recurring auto-pay
- Payment method selection for auto-pay
- Execution history and notifications

### 🔄 Real-Time Tracking
- Order confirmed → Preparing → Out for delivery → Delivered
- Estimated delivery time
- Live status updates every 10 seconds

## 📋 Prerequisites

- **Node.js** 18+ 
- **Python** 3.11+ (for ML service)
- **MySQL** 8.0+
- **Redis** 7.0+
- **Docker** (optional, for containerized deployment)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nihalmohammad705-debug/SabAi-Pay.git
cd sabai-pay

#Backend run guide
cd backend
npm install
node backend.js

#Frontend run guide
cd frontend
npm install
npm start

#ML Service run guide
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py