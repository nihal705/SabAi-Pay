const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'user-1' };
    next();
  },
}));

jest.mock('../controllers/agentPaymentController', () => ({
  sendMoney: jest.fn(),
}));

const agentPaymentController = require('../controllers/agentPaymentController');
const agentPaymentRoutes = require('../routes/agentPaymentRoutes');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/agent/payment', agentPaymentRoutes);
  return app;
};

describe('agent send-money preparation route', () => {
  beforeEach(() => {
    agentPaymentController.sendMoney.mockReset();
  });

  it('parses and forwards the send-money JSON body', async () => {
    const preparedPayment = {
      status: 'ready',
      requiresAction: 'confirm_payment',
      paymentData: { amount: 250 },
    };
    agentPaymentController.sendMoney.mockResolvedValue(preparedPayment);

    const response = await request(createApp())
      .post('/agent/payment/send-money')
      .send({
        recipient: 'friend@sabai',
        amount: 250,
        note: 'Lunch',
        bankAccountId: 'bank-1',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: preparedPayment });
    expect(agentPaymentController.sendMoney).toHaveBeenCalledWith(
      'user-1',
      'friend@sabai',
      250,
      'Lunch',
      'bank-1',
    );
  });

  it('rejects a missing body with a clear client error', async () => {
    const response = await request(createApp())
      .post('/agent/payment/send-money')
      .set('Content-Type', 'application/json')
      .send('');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'A recipient and a valid amount are required.',
    });
    expect(agentPaymentController.sendMoney).not.toHaveBeenCalled();
  });
});
