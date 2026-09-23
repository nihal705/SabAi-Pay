# SabAI Pay — Architecture Reference

> Single source of truth. Update this file whenever you change an agent,
> tool, route, or policy rule.

## 1. The Separation Principle
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ AI LAYER │ │ POLICY LAYER │ │ PAYMENT LAYER │
│ │ │ │ │ │
│ Proposes │ ──► │ Authorizes │ ──► │ Executes │
│ Probabilistic │ │ Deterministic │ │ Transactional │
│ Non-binding │ │ Binding │ │ Atomic │
└──────────────────┘ └──────────────────┘ └──────────────────┘

text

- **AI Layer:** Gemini + orchestrator + 6 specialized agents
- **Policy Layer:** `agentSecurityService`, `reserve_limits`, `spend_reserve_limit` RPC
- **Payment Layer:** wallet engine, bank balances, transaction ledger
- **Audit Layer:** every intent, decision, and outcome recorded

**Rule:** The AI never writes to the database. It only proposes JSON.
The backend decides whether to act on it.

## 2. Tool Registry (agentToolRegistry.js)

Every tool the AI can call:

| Tool | Args | Routes to |
|---|---|---|
| `search_restaurants` | merchant, location?, cuisine?, **max_price?** | orderAgent.findRestaurants |
| `get_menu` | merchant, restaurantId | orderAgent.getMenu |
| `add_to_cart` | sessionId, items | orderAgent.addToCart |
| `checkout` | sessionId, paymentMethod | orderAgent.checkout |
| `send_money` | recipient, amount, note? | sendMoneyAgent.sendMoney |
| **`send_to_bank_account`** | accountNumber, ifsc, amount, recipientName?, note? | bankTransferService.prepareTransfer |
| `request_money` | recipient, amount, note? | sendMoneyAgent.requestMoney |
| `resolve_recipient` | text | sendMoneyAgent.resolveRecipient |
| `recharge_mobile` | mobileNumber, amount, plan?, operator? | rechargeAgent.recharge |
| `detect_operator` | mobileNumber | rechargeAgent.detectOperator |
| `get_recharge_plans` | operatorId | rechargeAgent.getPlans |
| `pay_bill` | billType, provider, customerId, amount | billAgent.payBill |
| `list_billers` | category? | billAgent.listBillers |
| `fetch_bill_amount` | billerId, customerId | billAgent.fetchBillAmount |
| `schedule_payment` | action, datetime, paymentMethod | schedulerAgent.schedulePayment |
| `setup_autopay` | action, schedule, paymentMethod | autoPayAgent.setupAutoPay |
| `cancel_autopay` | orderId | autoPayAgent.cancelAutoPay |
| `get_usual` | mealSlot, merchant?, paymentMethod?, sessionId? | preferencesAgent.getUsual |
| `save_usual` | mealSlot, items, merchant? | preferencesAgent.saveUsual |
| `multi_payment` | payments[] | agentPaymentController.multiPayment |

## 3. Policy Engine Rules (deterministic)

For every payment:

1. **Single-transaction limit** — `per_transaction_limit`
2. **Monthly merchant limit** — `monthly_limit - current_spent`
3. **Merchant active flag** — `is_active`
4. **New recipient / new biller / new bank account** → PIN required
5. **Amount exceeds user's Universal Reserve limit** → PIN required (fall back to bank)
6. **Insufficient balance** → deny

Enforced in: `agentSecurityService.decideSecurity()`, `spend_reserve_limit()` (Postgres RPC).

## 4. Database Tables

| Table | Purpose |
|---|---|
| `users` | Accounts |
| `bank_accounts` + `bank_balances` + `bank_upi_pins` | Linked banks |
| `transactions` | Ledger of every payment attempt |
| `sabai_coins` + `coin_transactions` | Reward points |
| `reserve_limits` | Per-merchant spending policy |
| `agent_conversations` + `agent_messages` | Chat history |
| `merchant_connections` | Which apps user has connected |
| `order_sessions` + `agent_orders` | Food/shopping orders |
| `bills` + `paid_bills` | Bill payments |
| `auto_pay_orders` + `scheduled_orders` | Recurring / future payments |
| `money_requests` + `split_requests` | P2P requests |
| `contacts` | Recipient address book |
| `notifications` | In-app alerts |

## 5. Routes

All require `Authorization: Bearer <jwt>` unless noted.

| Prefix | File |
|---|---|
| `/api/auth` | authRoutes (login, register, OTP) — public for login/register |
| `/api/bank` | bankRoutes |
| `/api/transactions` | transactionRoutes |
| `/api/reserve` | reserveRoutes |
| `/api/coins` | coinRoutes |
| `/api/bills` | billRoutes |
| `/api/recharge` | rechargeRoutes |
| `/api/contacts` | contactRoutes |
| `/api/money-requests` | moneyRequestRoutes |
| `/api/split-requests` | splitRequestRoutes |
| `/api/challenges` | challengeRoutes |
| `/api/auto-pay` | autoPayRoutes |
| `/api/agent` | agentRoutes (chat) |
| `/api/agent/order` | agentOrderRoutes |
| `/api/agent/payment` | agentPaymentRoutes |
| `/api/merchant` | merchantRoutes |
| `/api/notifications` | notificationRoutes |

## 6. Agent Invocation Flow
Frontend → POST /api/agent/chat
│
▼
verifyToken (JWT)
│
▼
orchestratorService.processMessage(userId, message, pendingIntent)
│
▼
geminiChatService.processMessage()
│
├── Gemini returns text → return to frontend
│
└── Gemini returns functionCall → orchestratorService.handleFunctionCall()
│
▼
switch (functionName)
├── "search_restaurants" → orderAgent.findRestaurants()
├── "send_to_bank_account" → bankTransferService.prepareTransfer()
└── ... etc
│
▼
Return structured response to Gemini
│
▼
Gemini composes final reply (or another tool call)
│
▼
Frontend renders

text

## 7. Prototype-Specific Notes

- `REACT_APP_PROTOTYPE_MODE=true` → disclaimer modal + banner on
- Default true if unset (safety)
- Welcome gems: 50 awarded in `databaseService.createUser()` and backfilled via `scripts/seedWelcomeGems.js`
- Gemini rate limit (HTTP 429) caught in `geminiChatService.processMessage()` → returns friendly message instead of crashing
- Localhost-only deployment by design — see `docs/AGENT_PAY_EXPLAINED.md`

## 8. Things explicitly NOT to touch

- `agentSecurityService.js` — policy engine is correct
- `databaseService.js` (except `createUser`) — used everywhere
- `middleware/auth.js` — JWT is correct
- Any SQL migration file — schema is stable
A.10 — docs/AGENT_PAY_EXPLAINED.md
Confidence: 99% — This is a narrative doc, no risk.

(Content is part of the full documentation in Section C — I'll write the story there and reference it here.)

For brevity in this file, add:

markdown
# Agent Pay — Explained Simply

See the complete story in `docs/SABAI_PAY_COMPLETE.md`.

Quick summary:

1. **What is Agent Pay?** An AI agent that can *transact on your behalf*,
   not just recommend.
2. **Why is it hard?** Consent, liability, auditability.
3. **How does SabAI Pay solve it?** AI proposes; deterministic policy
   authorizes; payment engine executes.
4. **What this prototype proves?** That separation is possible, and
   workable, in a student-scale project.