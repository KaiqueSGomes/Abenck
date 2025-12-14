const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Obter analytics da empresa
router.get('/company/:company_id', authMiddleware, async (req, res) => {
  try {
    const { company_id } = req.params;

    const connection = await pool.getConnection();

    // Verificar se a empresa pertence ao usuário
    const [companies] = await connection.execute(
      'SELECT user_id FROM companies WHERE id = ?',
      [company_id]
    );

    if (companies.length === 0 || companies[0].user_id !== req.user.id) {
      connection.release();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Obter dados dos últimos 30 dias
    const [analytics] = await connection.execute(
      `SELECT date, profile_views, whatsapp_clicks
       FROM company_analytics
       WHERE company_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY date ASC`,
      [company_id]
    );

    // Calcular totais
    const totalViews = analytics.reduce((sum, item) => sum + item.profile_views, 0);
    const totalClicks = analytics.reduce((sum, item) => sum + item.whatsapp_clicks, 0);

    // Dados para gráfico
    const chartData = analytics.map(item => ({
      date: item.date,
      views: item.profile_views,
      clicks: item.whatsapp_clicks
    }));

    connection.release();

    res.json({
      totalViews,
      totalClicks,
      chartData,
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Obter resumo de analytics (últimos 7 dias)
router.get('/company/:company_id/summary', authMiddleware, async (req, res) => {
  try {
    const { company_id } = req.params;

    const connection = await pool.getConnection();

    // Verificar se a empresa pertence ao usuário
    const [companies] = await connection.execute(
      'SELECT user_id FROM companies WHERE id = ?',
      [company_id]
    );

    if (companies.length === 0 || companies[0].user_id !== req.user.id) {
      connection.release();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Obter dados dos últimos 7 dias
    const [analytics] = await connection.execute(
      `SELECT 
        SUM(profile_views) as total_views,
        SUM(whatsapp_clicks) as total_clicks,
        COUNT(DISTINCT date) as days_with_data
       FROM company_analytics
       WHERE company_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [company_id]
    );

    connection.release();

    res.json({
      period: 'last_7_days',
      totalViews: analytics[0].total_views || 0,
      totalClicks: analytics[0].total_clicks || 0,
      daysWithData: analytics[0].days_with_data || 0
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
