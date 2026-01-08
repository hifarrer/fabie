import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

class AuthService {
  // Simple password hashing (for MVP - use bcrypt in production)
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async register(userData) {
    await db.read();

    // Check if email already exists
    const existingUser = db.data.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: this.hashPassword(userData.password),
      company: userData.company || '',
      location: userData.location || '',
      phone: userData.phone || '',
      role: userData.role, // 'buyer' or 'seller'
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(email, password) {
    await db.read();

    const user = db.data.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user has a password (seeded users don't)
    if (user.password && user.password !== this.hashPassword(password)) {
      throw new Error('Invalid email or password');
    }

    // For seeded users without passwords, allow login with any password (demo mode)
    if (!user.password) {
      // This is a demo user, allow login
    }

    // Return user without password
    const { password: pwd, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id) {
    await db.read();
    const user = db.data.users.find(u => u.id === id);
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id, updates) {
    await db.read();
    const index = db.data.users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    // Don't allow updating email to an existing one
    if (updates.email && updates.email !== db.data.users[index].email) {
      const existingUser = db.data.users.find(u => u.email === updates.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    // Hash password if being updated
    if (updates.password) {
      updates.password = this.hashPassword(updates.password);
    }

    db.data.users[index] = {
      ...db.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.write();

    const { password, ...userWithoutPassword } = db.data.users[index];
    return userWithoutPassword;
  }
}

export default new AuthService();


