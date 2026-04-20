# SabAI Pay - AI-Powered UPI Payments Assistant with Agent Pay and Reserve Pay

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

## 🏗️ Architecture
```text
┌─────────────────────────────────────────────────────────────────┐
│ React Frontend (Port 3000)                                      │
│         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│         │AgentChatPage│ │BillPayments │ │ReservePay │ │         |
│         └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Node.js Backend (Port 5000)                                     │
│ ┌─────────────────────────────────────────────────────────┐     │
│ │ AgentOrderController                                    │     │
│ │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │     │
│ │   │Intent    │ │Payment   │ │Scheduled │ │Order     │   │     │
│ │   │Classifier│ │Service   │ │Service   │ │Service   │   │     │
│ │   └──────────┘ └──────────┘ └──────────┘ └──────────┘   │     │
│ └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ MySQL DB        │ │ Redis Cache     │ │ ML Service      │
│ (Port 3306)     │ │ (Port 6379)     │ │ (Port 5001)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

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

## Backend run guide
cd backend
npm install
node backend.js

## Frontend run guide
cd frontend
npm install
npm start

## ML Service run guide
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

## Create Database
CREATE DATABASE sabai_pay;
USE sabai_pay;
-- Run the schema.sql file

## 🐳 Docker Deployment
```bash
# Build and run all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Project Structure (NOTE : This is not complete structure, follow codes to see complete structure)
```text
sabai-pay/
├── backend/
│   ├── controllers/
│   │   ├── agentOrderController.js
│   │   └── paymentController.js
│   ├── services/
│   │   ├── databaseService.js
│   │   ├── merchantDataService.js
│   │   ├── scheduledOrderService.js
│   │   └── mlService.js
│   ├── routes/
│   │   └── agentOrderRoutes.js
│   └── data/merchants/
│       ├── swiggy/
│       ├── zomato/
│       └── zepto/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AgentChatPage.jsx
│   │   │   ├── BillPaymentsPage.jsx
│   │   │   └── ReservePayPage.jsx
│   │   ├── components/
│   │   │   ├── CustomPaymentModal.jsx
│   │   │   ├── EnhancedOrderSummary.jsx
│   │   │   └── RestaurantOrderComponent.jsx
│   │   └── services/
│   │       └── storageService.js
│   └── public/
├── ml_service/
│   ├── models/
│   ├── training/
│   └── app.py
├── docker-compose.yml
└── README.md
```

🎯 Key Features in Detail
```text
Agent Chat Page
Real-time conversation with AI assistant

Restaurant menu display with interactive cards

Cart management with quantity controls

Multiple payment method selection

Order confirmation and tracking

Payment Modal
SabAI Gems: Use earned gems for payment (no cashback)

Reserve Pay: Monthly limit based payment (5% cashback)

Bank Account: Direct debit with UPI PIN (5% cashback)

Combined Payments: Gems + Reserve Pay, Gems + Bank

Scheduled Orders
Pick date and time for future delivery

Select payment method for auto-pay

View scheduled orders in Auto Pay section

Cancel or modify scheduled orders

Bill Payments
Add bills for electricity, water, mobile, broadband

Schedule auto-pay with bank or Reserve Pay

Real-time payment processing

Transaction history
```

## API Endpoints
```text
Method	Endpoint	Description
POST	/api/agent/order/process	Process user message
POST	/api/agent/order/select-items	Add items to cart
POST	/api/agent/order/process-reserve	Process Reserve Pay payment
POST	/api/agent/order/schedule-order	Schedule order for future
GET	/api/agent/order/orders	Get user orders
POST	/api/agent/order/check-reserve	Check Reserve Pay eligibility
```

## Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# ML service tests
cd ml_service
pytest
```

## Environment Variables
```text
Backend (.env)
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=sabai_pay
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
REDIS_HOST=localhost
ML_API_URL=http://localhost:5001

Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_API_URL=http://localhost:5001
```

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👥 Authors

SabAI Pay - G Nihal

🙏 Acknowledgments

Gemini API for general chat capabilities

Razorpay for payment integration

Open source community

📞 Support
For support, email support@sabai-pay.com or create an issue in the repository.