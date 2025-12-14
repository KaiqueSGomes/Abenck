const express = require('express');
const axios = require('axios');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Buscar empresas por região (com localização do usuário)
router.post('/search-by-region', async (req, res) => {
  try {
    const { latitude, longitude, category, radius = 50 } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const connection = await pool.getConnection();

    let query = `
      SELECT c.*, u.email, u.phone,
        (6371 * acos(GREATEST(-1, LEAST(1, cos(radians(?)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(?)) + sin(radians(?)) * sin(radians(c.latitude)))))) AS distance
      FROM companies c
      JOIN users u ON c.user_id = u.id
      WHERE c.is_active = 1 AND c.is_verified = 1
    `;

    const params = [latitude, longitude, latitude];

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY distance ASC`;

    const [companies] = await connection.execute(query, params);
    connection.release();

    // Filtrar por raio no JavaScript
    const filtered = companies.filter(c => c.distance <= radius);

    res.json({ companies: filtered });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});



// Buscar empresas patrocinadas (carrossel)
router.post('/sponsored', async (req, res) => {
  try {
    const { latitude, longitude, region } = req.body;

    const connection = await pool.getConnection();

    let query = `
      SELECT c.*, u.email, u.phone, p.is_active as is_sponsored
      FROM companies c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN promotions p ON c.id = p.company_id AND p.is_active = true
      WHERE c.is_active = true AND c.is_verified = true AND p.is_active = true
    `;

    const params = [];

    if (region) {
      query += ' AND c.region = ?';
      params.push(region);
    }

    query += ' ORDER BY RAND() LIMIT 10';

    const [companies] = await connection.execute(query, params);
    connection.release();

    res.json({ companies });
  } catch (error) {
    console.error('Sponsored search error:', error);
    res.status(500).json({ error: 'Failed to fetch sponsored companies' });
  }
});

// Buscar empresa por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    const [companies] = await connection.execute(
      `SELECT c.*, u.email, u.phone
       FROM companies c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (companies.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Company not found' });
    }

    // Registrar visualização
    const [analytics] = await connection.execute(
      'SELECT id FROM company_analytics WHERE company_id = ? AND date = CURDATE()',
      [id]
    );

    if (analytics.length > 0) {
      await connection.execute(
        'UPDATE company_analytics SET profile_views = profile_views + 1 WHERE id = ?',
        [analytics[0].id]
      );
    } else {
      await connection.execute(
        'INSERT INTO company_analytics (company_id, profile_views, date) VALUES (?, 1, CURDATE())',
        [id]
      );
    }

    connection.release();

    res.json({ company: companies[0] });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Registrar clique no WhatsApp
router.post('/:id/whatsapp-click', async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    const [analytics] = await connection.execute(
      'SELECT id FROM company_analytics WHERE company_id = ? AND date = CURDATE()',
      [id]
    );

    if (analytics.length > 0) {
      await connection.execute(
        'UPDATE company_analytics SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = ?',
        [analytics[0].id]
      );
    } else {
      await connection.execute(
        'INSERT INTO company_analytics (company_id, whatsapp_clicks, date) VALUES (?, 1, CURDATE())',
        [id]
      );
    }

    connection.release();

    res.json({ message: 'Click registered' });
  } catch (error) {
    console.error('WhatsApp click error:', error);
    res.status(500).json({ error: 'Failed to register click' });
  }
});

// Atualizar perfil da empresa (autenticado)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, description, phone, whatsapp, address, city, state, zip_code, category, logo_url } = req.body;

    const connection = await pool.getConnection();

    // Verificar se a empresa pertence ao usuário
    const [companies] = await connection.execute(
      'SELECT user_id FROM companies WHERE id = ?',
      [id]
    );

    if (companies.length === 0 || companies[0].user_id !== req.user.id) {
      connection.release();
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Buscar coordenadas se CEP foi fornecido
    let latitude, longitude, region;
    if (zip_code) {
      try {
        const response = await axios.get(`${process.env.CEP_API_URL}/${zip_code}/json/`);
        latitude = parseFloat(response.data.lat);
        longitude = parseFloat(response.data.lon);
        region = response.data.uf;
      } catch (error) {
        console.error('CEP lookup error:', error);
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (company_name) {
      updateFields.push('company_name = ?');
      updateValues.push(company_name);
    }
    if (description) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (whatsapp) {
      updateFields.push('whatsapp = ?');
      updateValues.push(whatsapp);
    }
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (city) {
      updateFields.push('city = ?');
      updateValues.push(city);
    }
    if (state) {
      updateFields.push('state = ?');
      updateValues.push(state);
    }
    if (zip_code) {
      updateFields.push('zip_code = ?');
      updateValues.push(zip_code);
    }
    if (category) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (logo_url) {
      updateFields.push('logo_url = ?');
      updateValues.push(logo_url);
    }
    if (latitude) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }
    if (longitude) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }
    if (region) {
      updateFields.push('region = ?');
      updateValues.push(region);
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    const query = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`;

    await connection.execute(query, updateValues);
    connection.release();

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Buscar por CEP
router.get('/location/:cep', async (req, res) => {
  try {
    const { cep } = req.params;

    const response = await axios.get(`${process.env.CEP_API_URL}/${cep}/json/`);

    if (response.data.erro) {
      return res.status(404).json({ error: 'CEP not found' });
    }

    res.json({
      cep: response.data.cep,
      address: response.data.logradouro,
      city: response.data.localidade,
      state: response.data.uf,
      latitude: response.data.lat,
      longitude: response.data.lon
    });
  } catch (error) {
    console.error('CEP lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup CEP' });
  }
});

module.exports = router;
