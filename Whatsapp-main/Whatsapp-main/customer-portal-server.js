const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3006;

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// 1. Customer Authentication Endpoints

// Customer Registration
app.post('/api/customer/register', async (req, res) => {
  try {
    const { name, email, password, mobile, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate dealer code
    const dealerCode = 'CUS' + Date.now().toString().slice(-6);

    // Insert new customer
    const result = await pool.query(
      `INSERT INTO users (name, email, password, mobile, phone, dealer_code, "isActive", dealer_type, customer_status)
       VALUES ($1, $2, $3, $4, $5, $6, true, 'customer', 'active')
       RETURNING id, name, email, mobile, phone, dealer_code`,
      [name, email, hashedPassword, mobile || phone, phone, dealerCode]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.phone,
        dealerCode: user.dealer_code
      },
      message: 'Customer registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Customer Login
app.post('/api/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password, mobile, phone, dealer_code, "isActive", customer_status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.isActive || user.customer_status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          phone: user.phone,
          dealerCode: user.dealer_code
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get Customer Profile
app.get('/api/customer/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, mobile, phone, dealer_code, profile_image, address, 
              created_at, last_login, account_balance, message_balance, voucher_credits, biz_points
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update Customer Profile
app.put('/api/customer/profile', authenticateToken, async (req, res) => {
  try {
    const { name, mobile, phone, address, profile_image } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           mobile = COALESCE($2, mobile),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           profile_image = COALESCE($5, profile_image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, email, mobile, phone, address, profile_image`,
      [name, mobile, phone, address, profile_image, req.user.id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change Password
app.post('/api/customer/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Verify current password
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'WhatsApp Customer Portal API',
      version: '1.0.0',
      description: 'Customer portal for WhatsApp messaging system management',
      endpoints: {
        authentication: {
          'POST /api/customer/register': 'Register new customer',
          'POST /api/customer/login': 'Customer login',
          'GET /api/customer/profile': 'Get customer profile',
          'PUT /api/customer/profile': 'Update customer profile',
          'POST /api/customer/change-password': 'Change password'
        },
        whatsapp: {
          'GET /api/customer/whatsapp/instances': 'Get WhatsApp instances',
          'POST /api/customer/whatsapp/instances': 'Create WhatsApp instance',
          'GET /api/customer/whatsapp/qr/:instanceId': 'Get QR code for instance',
          'POST /api/customer/whatsapp/send-message': 'Send WhatsApp message',
          'GET /api/customer/whatsapp/messages': 'Get message history'
        },
        contacts: {
          'GET /api/customer/contacts': 'Get contacts',
          'POST /api/customer/contacts': 'Add contact',
          'GET /api/customer/groups': 'Get contact groups',
          'POST /api/customer/groups': 'Create contact group'
        },
        api: {
          'GET /api/customer/api-keys': 'Get API keys',
          'POST /api/customer/api-keys': 'Create API key',
          'DELETE /api/customer/api-keys/:id': 'Delete API key'
        }
      }
    },
    message: 'WhatsApp Customer Portal API is running'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    },
    message: 'Customer portal API is healthy'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Customer Portal API Server running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;