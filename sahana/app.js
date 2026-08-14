import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { body, validationResult } from 'express-validator';
import User from './models/User.js';
import Item from './models/Item.js';

// Load environment variables from the .env file before any other configuration.
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure-auth';
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-production';

// Connect to MongoDB using Mongoose and handle connection errors clearly.
async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function requireAuth(req, res, next) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Authentication required.' });
}

function requireRole(role) {
  return asyncHandler(async (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findById(req.session.userId).select('role');
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    next();
  });
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60
    }
  }));

  /*app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  }));*/

  // Validation rules for user registration. These checks run before creating a new user.
  const registrationValidators = [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }).withMessage('Password must be strong and include uppercase, lowercase, numbers, and symbols.'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin.')
  ];

  // Validation rules for login. We only need a valid email and a non-empty password.
  const loginValidators = [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ];

  // POST /register and POST /api/register both create a new user account.
  // We normalize the email, hash the password, and save the user with Mongoose.
  app.post(['/register', '/api/register'], registrationValidators, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user' } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    req.session.userId = user._id;
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1h'
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  }));

  // POST /login and POST /api/login authenticate a user and return a JWT token.
  app.post(['/login', '/api/login'], loginValidators, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    req.session.userId = user._id;
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '1h'
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  }));

  app.post(['/logout', '/api/logout'], requireAuth, asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Unable to log out.' });
      }
      return res.status(200).json({ message: 'Logged out successfully.' });
    });
  }));

  // GET /me and GET /api/me returns the current session user profile.
  app.get(['/me', '/api/me'], requireAuth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId).select('name email role createdAt');
    if (!user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    return res.status(200).json({ user });
  }));

  app.get(['/admin', '/api/admin'], requireRole('admin'), asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId).select('name email role');
    return res.status(200).json({ message: 'Admin dashboard', user });
  }));

  app.get(['/items', '/api/items'], requireAuth, asyncHandler(async (req, res) => {
    const items = await Item.find().select('id title description status ownerId createdAt');
    return res.status(200).json({ items });
  }));

  app.post(['/items', '/api/items'], requireAuth, [
    body('title').trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters.'),
    body('description').optional().trim().isLength({ min: 2 }).withMessage('Description must be at least 2 characters.'),
    body('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Invalid status.')
  ], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await Item.create({
      title: req.body.title,
      description: req.body.description || '',
      status: req.body.status || 'draft',
      ownerId: req.session.userId
    });

    return res.status(201).json({ message: 'Item created successfully.', item });
  }));

  app.put(['/items/:id', '/api/items/:id'], requireAuth, [
    body('title').optional().trim().isLength({ min: 2 }).withMessage('Title must be at least 2 characters.'),
    body('description').optional().trim().isLength({ min: 2 }).withMessage('Description must be at least 2 characters.'),
    body('status').optional().isIn(['draft', 'active', 'archived']).withMessage('Invalid status.')
  ], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const item = await Item.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    return res.status(200).json({ message: 'Item updated successfully.', item });
  }));

  app.delete(['/items/:id', '/api/items/:id'], requireAuth, asyncHandler(async (req, res) => {
    const item = await Item.findOneAndDelete({ id: req.params.id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    return res.status(200).json({ message: 'Item deleted successfully.' });
  }));

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  });

  return app;
}

function listenOnPort(app, basePort) {
  const tryListen = (port, attempt = 1) => {
    const server = app.listen(port, () => {
      console.log(`Auth service listening on http://localhost:${port}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attempt < 10) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Trying ${nextPort} instead.`);
        tryListen(nextPort, attempt + 1);
        return;
      }

      console.error('Failed to start server:', error.message);
      process.exit(1);
    });
  };

  tryListen(basePort);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  await connectDatabase();
  const app = createApp();
  listenOnPort(app, PORT);
}
