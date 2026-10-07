jest.mock('../services/databaseService', () => ({
  getScheduledOrders: jest.fn(),
  transitionScheduledOrder: jest.fn(),
  getTransactionById: jest.fn(),
  createTransaction: jest.fn(),
}));
jest.mock('../services/paymentService', () => ({
  razorpay: {},
  createOrder: jest.fn(),
  verifyPayment: jest.fn(),
  getPaymentDetails: jest.fn(),
}));
jest.mock('../services/orderService', () => ({}));
jest.mock('../services/scheduledOrderService', () => ({
  cancelScheduledOrder: jest.fn(),
}));
jest.mock('../services/merchantDataService', () => ({}));
jest.mock('../services/merchantConnectionService', () => ({}));
jest.mock('../services/agentSecurityService', () => ({}));

const dbService = require('../services/databaseService');
const paymentService = require('../services/paymentService');
const controller = require('../controllers/agentOrderController');
const originalRazorpayKeyId = process.env.RAZORPAY_KEY_ID;

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const createScheduledOrder = () => ({
  id: 'schedule-123',
  user_id: 'user-123',
  order_data: {
    merchant: 'demo-merchant',
    total: 199.99,
    cart: [{ name: 'Meal', quantity: 1, total: 199.99 }],
  },
  scheduled_time: new Date(Date.now() - 60_000).toISOString(),
  status: 'awaiting_authorization',
  payment_breakdown: {},
  result: {},
});

const makeRequest = (body = {}) => ({
  params: { orderId: 'schedule-123' },
  user: { id: 'user-123' },
  body,
});

describe('scheduled-order Razorpay approval', () => {
  let scheduledOrder;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
    scheduledOrder = createScheduledOrder();
    dbService.getScheduledOrders.mockImplementation(async () => [scheduledOrder]);
    dbService.transitionScheduledOrder.mockImplementation(async (id, userId, expectedStatus, updates) => {
      if (scheduledOrder.status !== expectedStatus) return null;
      scheduledOrder = { ...scheduledOrder, ...updates };
      return scheduledOrder;
    });
    dbService.getTransactionById.mockResolvedValue(null);
    dbService.createTransaction.mockResolvedValue('transaction-row');
    paymentService.createOrder.mockResolvedValue({
      success: true,
      order: { id: 'order_provider_123' },
    });
    paymentService.verifyPayment.mockReturnValue(true);
    paymentService.getPaymentDetails.mockResolvedValue({
      success: true,
      payment: {
        status: 'captured',
        amount: 19999,
        currency: 'INR',
        order_id: 'order_provider_123',
      },
    });
  });

  afterAll(() => {
    if (originalRazorpayKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = originalRazorpayKeyId;
  });

  it('creates a due checkout using the stored amount, not a client-supplied amount', async () => {
    const response = makeResponse();

    await controller.createScheduledOrderCheckout(makeRequest({ amount: 1 }), response);

    expect(paymentService.createOrder).toHaveBeenCalledWith(
      199.99,
      'INR',
      'sch_schedule123',
      { user_id: 'user-123', scheduled_order_id: 'schedule-123' },
    );
    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: {
        checkout: {
          key: 'rzp_test_key',
          orderId: 'order_provider_123',
          amount: 19999,
          currency: 'INR',
          description: 'Scheduled SabAI Pay order',
        },
      },
    });
    expect(scheduledOrder.status).toBe('checkout_pending');
  });

  it('rejects checkout before the schedule is due', async () => {
    scheduledOrder.scheduled_time = new Date(Date.now() + 60_000).toISOString();
    const response = makeResponse();

    await controller.createScheduledOrderCheckout(makeRequest(), response);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(paymentService.createOrder).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature without recording a transaction', async () => {
    scheduledOrder.status = 'checkout_pending';
    scheduledOrder.result = {
      checkout_state: 'ready',
      razorpay_order_id: 'order_provider_123',
      amount_in_paise: 19999,
    };
    paymentService.verifyPayment.mockReturnValue(false);
    const response = makeResponse();

    await controller.verifyScheduledOrderPayment(makeRequest({
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
      razorpay_signature: 'bad-signature',
    }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(dbService.createTransaction).not.toHaveBeenCalled();
    expect(scheduledOrder.status).toBe('checkout_pending');
  });

  it('rejects a captured payment with the wrong amount', async () => {
    scheduledOrder.status = 'checkout_pending';
    scheduledOrder.result = {
      checkout_state: 'ready',
      razorpay_order_id: 'order_provider_123',
      amount_in_paise: 19999,
    };
    paymentService.getPaymentDetails.mockResolvedValue({
      success: true,
      payment: {
        status: 'captured',
        amount: 100,
        currency: 'INR',
        order_id: 'order_provider_123',
      },
    });
    const response = makeResponse();

    await controller.verifyScheduledOrderPayment(makeRequest({
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
      razorpay_signature: 'valid-signature',
    }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(dbService.createTransaction).not.toHaveBeenCalled();
    expect(scheduledOrder.status).toBe('checkout_pending');
  });

  it('records a verified captured payment exactly once and marks the schedule paid', async () => {
    scheduledOrder.status = 'checkout_pending';
    scheduledOrder.result = {
      checkout_state: 'ready',
      razorpay_order_id: 'order_provider_123',
      amount_in_paise: 19999,
    };
    const response = makeResponse();

    await controller.verifyScheduledOrderPayment(makeRequest({
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
      razorpay_signature: 'valid-signature',
    }), response);

    expect(paymentService.verifyPayment).toHaveBeenCalledWith(
      'order_provider_123',
      'payment-123',
      'valid-signature',
    );
    expect(dbService.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      transaction_id: 'RZP-payment-123',
      amount: 199.99,
      status: 'success',
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
    }));
    expect(scheduledOrder.status).toBe('paid');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        status: 'paid',
        fulfillmentStatus: 'awaiting_merchant_confirmation',
      }),
    }));
  });

  it('returns success for a duplicate verification of the same settled payment', async () => {
    scheduledOrder.status = 'paid';
    scheduledOrder.result = {
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
      order_id: 'SCHEDULED-schedule-123',
    };
    const response = makeResponse();

    await controller.verifyScheduledOrderPayment(makeRequest({
      razorpay_order_id: 'order_provider_123',
      razorpay_payment_id: 'payment-123',
    }), response);

    expect(response.json).toHaveBeenCalledWith({
      success: true,
      data: {
        status: 'paid',
        orderId: 'SCHEDULED-schedule-123',
        alreadyProcessed: true,
      },
    });
    expect(paymentService.getPaymentDetails).not.toHaveBeenCalled();
    expect(dbService.createTransaction).not.toHaveBeenCalled();
  });

  it('resumes reconciliation without another checkout after the payment callback was interrupted', async () => {
    scheduledOrder.status = 'payment_verification_pending';
    scheduledOrder.result = {
      checkout_state: 'ready',
      razorpay_order_id: 'order_provider_123',
      amount_in_paise: 19999,
      razorpay_payment_id: 'payment-123',
    };
    const response = makeResponse();

    await controller.verifyScheduledOrderPayment(makeRequest({
      razorpay_order_id: 'order_provider_123',
    }), response);

    expect(paymentService.verifyPayment).not.toHaveBeenCalled();
    expect(paymentService.getPaymentDetails).toHaveBeenCalledWith('payment-123');
    expect(scheduledOrder.status).toBe('paid');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ status: 'paid' }),
    }));
  });
});
