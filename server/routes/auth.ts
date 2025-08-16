import { Router } from 'express';
import { hashPassword, verifyPassword } from '../lib/auth';
import { getUserByEmail, createUser, updateUser, readJSON } from '../lib/json-storage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      onboardingCompleted: false
    };

    await createUser(newUser);

    // Set session
    req.session.userId = newUser.id;
    
    res.json({ 
      success: true, 
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Set session
    req.session.userId = user.id;
    
    res.json({ 
      success: true, 
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /me
router.get('/me', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const users = await readJSON('users.json');
    const user = users.find((u: any) => u.id === req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      id: user.id, 
      email: user.email,
      onboardingCompleted: user.onboardingCompleted 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;