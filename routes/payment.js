const express = require('express');
const axios = require('axios');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const MERCADO_PAGO_API = 'https://api.mercadopago.com/v1';

// Criar preferência de pagamento para promoção
router.post('/create-preference', authMiddleware, async (req, res) => {
  try {
    const { company_id, amount, duration_days = 30 } = req.body;

    if (!company_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Verificar se a empresa pertence ao usuário
    const [companies] = await connection.execute(
      'SELECT id, company_name FROM companies WHERE id = ? AND user_id = ?',
      [company_id, req.user.id]
    );

    if (companies.length === 0) {
      connection.release();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const company = companies[0];

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: `Promoção - ${company.company_name}`,
          description: `Impulsionar seu perfil por ${duration_days} dias`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(amount)
        }
      ],
      payer: {
        email: req.user.email
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment-success`,
        failure: `${process.env.FRONTEND_URL}/payment-failure`,
        pending: `${process.env.FRONTEND_URL}/payment-pending`
      },
      auto_return: 'approved',
      external_reference: `promotion_${company_id}_${Date.now()}`,
      metadata: {
        company_id: company_id,
        duration_days: duration_days
      }
    };

    const response = await axios.post(
      `${MERCADO_PAGO_API}/checkout/preferences`,
      preference,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Salvar promoção pendente
    const [promotionResult] = await connection.execute(
      `INSERT INTO promotions (company_id, amount, payment_status, payment_id)
       VALUES (?, ?, 'pending', ?)`,
      [company_id, amount, response.data.id]
    );

    connection.release();

    res.json({
      preference_id: response.data.id,
      init_point: response.data.init_point,
      promotion_id: promotionResult.insertId
    });
  } catch (error) {
    console.error('Payment preference error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// Webhook para notificações do Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    const { data, type } = req.body;

    if (type !== 'payment') {
      return res.json({ received: true });
    }

    // Verificar status do pagamento
    const paymentResponse = await axios.get(
      `${MERCADO_PAGO_API}/payments/${data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      }
    );

    const payment = paymentResponse.data;
    const externalReference = payment.external_reference;

    if (payment.status === 'approved') {
      const connection = await pool.getConnection();

      // Atualizar promoção
      const [promotions] = await connection.execute(
        'SELECT id, company_id FROM promotions WHERE payment_id = ?',
        [payment.id.toString()]
      );

      if (promotions.length > 0) {
        const promotion = promotions[0];

        // Calcular datas
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

        await connection.execute(
          `UPDATE promotions 
           SET payment_status = 'approved', is_active = true, start_date = ?, end_date = ?
           WHERE id = ?`,
          [startDate, endDate, promotion.id]
        );

        // Atualizar empresa como verificada
        await connection.execute(
          'UPDATE companies SET is_verified = true WHERE id = ?',
          [promotion.company_id]
        );
      }

      connection.release();
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Obter status do pagamento
router.get('/status/:promotion_id', authMiddleware, async (req, res) => {
  try {
    const { promotion_id } = req.params;

    const connection = await pool.getConnection();

    const [promotions] = await connection.execute(
      `SELECT p.*, c.user_id
       FROM promotions p
       JOIN companies c ON p.company_id = c.id
       WHERE p.id = ?`,
      [promotion_id]
    );

    if (promotions.length === 0 || promotions[0].user_id !== req.user.id) {
      connection.release();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    connection.release();

    res.json({
      promotion: promotions[0]
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

module.exports = router;
