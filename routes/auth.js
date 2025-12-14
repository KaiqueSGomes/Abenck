const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// Registrar novo usuário (pessoa física)
router.post('/register/user', async (req, res) => {
  try {
    const { email, password, full_name, cpf, phone } = req.body;

    if (!email || !password || !full_name || !cpf) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Verificar se usuário já existe
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR cpf = ?',
      [email, cpf]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, full_name, cpf, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, cpf, phone]
    );

    connection.release();

    const token = jwt.sign(
      { id: result.insertId, email, type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.insertId, email, full_name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Registrar nova empresa
router.post('/register/company', async (req, res) => {
  try {
    const { email, password, company_name, cnpj, phone, whatsapp, category } = req.body;

    if (!email || !password || !company_name || !cnpj) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Verificar se usuário já existe
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR cnpj = ?',
      [email, cnpj]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, full_name, cnpj, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, company_name, cnpj, phone]
    );

    // Inserir empresa
    const [companyResult] = await connection.execute(
      'INSERT INTO companies (user_id, company_name, cnpj, phone, whatsapp, category) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.insertId, company_name, cnpj, phone, whatsapp, category]
    );

    connection.release();

    const token = jwt.sign(
      { id: userResult.insertId, email, type: 'company', company_id: companyResult.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Company registered successfully',
      token,
      user: { id: userResult.insertId, email, company_name, company_id: companyResult.insertId }
    });
  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({ error: 'Company registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, email, password, full_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verificar se é empresa
    const [companies] = await connection.execute(
      'SELECT id FROM companies WHERE user_id = ?',
      [user.id]
    );

    connection.release();

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: companies.length > 0 ? 'company' : 'user',
        company_id: companies.length > 0 ? companies[0].id : null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        type: companies.length > 0 ? 'company' : 'user',
        company_id: companies.length > 0 ? companies[0].id : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
