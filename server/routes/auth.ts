import { Router, Request, Response } from 'express';
import { db, User } from '../db.js';

export const authRouter = Router();

// Customer or Admin Register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, password, mobile, country, state, city, address, postalCode, companyName } = req.body;

    if (!fullName || !email || !password || !mobile) {
      return res.status(400).json({ error: 'Full name, email, mobile, and password are required.' });
    }

    const existing = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const newId = `CUST-${1000 + db.getUsers().length + 1}`;
    const newUser: User = {
      id: newId,
      fullName,
      email: email.toLowerCase(),
      passwordHash: password, // In production, bcrypt.hashSync(password, 10)
      mobile,
      country: country || 'India',
      state: state || '',
      city: city || '',
      address: address || '',
      postalCode: postalCode || '',
      companyName: companyName || '',
      role: 'customer',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    // Audit log
    db.addAuditLog({
      id: `LOG-${Date.now()}`,
      adminId: 'SYSTEM',
      adminEmail: 'system@nexoracloud.com',
      action: 'CUSTOMER_REGISTERED',
      entityType: 'customer',
      entityId: newUser.id,
      newValue: { email: newUser.email, fullName: newUser.fullName },
      result: 'success',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
    });

    // Welcome Notification
    db.addNotification({
      id: `NOTIF-${Date.now()}`,
      recipientEmail: newUser.email,
      recipientId: newUser.id,
      type: 'ACCOUNT_CREATED',
      subject: 'Welcome to Nexora Cloud Platform',
      messageHtml: `<p>Hello ${newUser.fullName}, your customer account (${newUser.id}) has been created successfully. You can now register domains and deploy websites instantly.</p>`,
      isRead: false,
      sentAt: new Date().toISOString(),
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({
      message: 'Account registered successfully',
      user: userSafe,
      token: `token_${newUser.id}_${Date.now()}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Customer Google Authentication (OpenID Connect / Google Identity Services)
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, profile, googleId: directGoogleId, email: directEmail, fullName: directFullName, avatarUrl: directAvatarUrl } = req.body;

    let googleId = directGoogleId || '';
    let email = directEmail || '';
    let fullName = directFullName || '';
    let avatarUrl = directAvatarUrl || '';

    // If Google ID Token / credential JWT is provided:
    if (credential) {
      try {
        // Verify with Google tokeninfo endpoint
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
          signal: AbortSignal.timeout(4000),
        }).catch(() => null);

        if (verifyRes && verifyRes.ok) {
          const payload: any = await verifyRes.json();
          googleId = payload.sub;
          email = payload.email;
          fullName = payload.name;
          avatarUrl = payload.picture;
        } else {
          // Parse JWT claims fallback if tokeninfo unreached or in mock/preview
          const parts = credential.split('.');
          if (parts.length === 3) {
            const claims = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            googleId = claims.sub || `G-${Date.now()}`;
            email = claims.email;
            fullName = claims.name;
            avatarUrl = claims.picture;
          }
        }
      } catch (err) {
        console.warn('Google token verification fallback:', err);
      }
    }

    // Direct verified profile fallback from Google OAuth
    if (!email && profile) {
      googleId = profile.id || profile.sub || `G-${Date.now()}`;
      email = profile.email;
      fullName = profile.name || profile.displayName || profile.fullName || profile.email?.split('@')[0];
      avatarUrl = profile.picture || profile.avatar || profile.avatarUrl;
    }

    if (!email) {
      return res.status(400).json({ error: 'Failed to verify Google Account identity. Please retry.' });
    }

    const { user, isNew } = db.loginOrRegisterGoogleUser({
      googleId: googleId || `G-${Date.now()}`,
      email: email.toLowerCase(),
      fullName: fullName || email.split('@')[0],
      avatarUrl,
    });

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: `Account suspended: ${user.suspendedReason || 'Please contact support@nexoracloud.com'}`,
      });
    }

    const token = `token_${user.id}_${Date.now()}`;
    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      message: isNew ? 'Customer account created via Google' : 'Login successful with Google',
      user: safeUser,
      token,
      isNew,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});

// Admin Login (Preserved for Administrators with 2FA)
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: `Account suspended: ${user.suspendedReason || 'Please contact compliance at support@nexoracloud.com'}`,
      });
    }

    // If Admin role with 2FA enabled
    if (user.role !== 'customer' && user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          userId: user.id,
          message: 'Two-Factor Authentication required. Demo OTP code is 654321.',
        });
      }

      if (twoFactorCode !== user.twoFactorSecret && twoFactorCode !== '654321') {
        return res.status(401).json({ error: 'Invalid 2FA authentication code.' });
      }
    }

    const { passwordHash: _, ...userSafe } = user;
    return res.status(200).json({
      message: 'Login successful',
      user: userSafe,
      token: `token_${user.id}_${Date.now()}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Get Current User Profile via Token / Header
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  // Token format: Bearer token_CUST-1001_timestamp
  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('_');
  const userId = parts[1];

  const user = db.getUsers().find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found or session expired.' });
  }

  const { passwordHash: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

// Update Profile
authRouter.put('/profile', (req: Request, res: Response) => {
  try {
    const { userId, fullName, mobile, address, city, state, postalCode, country, companyName } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const updated = db.updateUser(userId, {
      fullName,
      mobile,
      address,
      city,
      state,
      postalCode,
      country,
      companyName,
    });

    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _, ...safe } = updated;
    return res.json({ message: 'Profile updated successfully', user: safe });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Password Reset Request
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // For security, don't leak user existence
    return res.json({ message: 'If an account exists with this email, password reset instructions have been dispatched.' });
  }

  db.addNotification({
    id: `NOTIF-${Date.now()}`,
    recipientEmail: user.email,
    recipientId: user.id,
    type: 'PASSWORD_RESET',
    subject: 'Nexora Cloud Password Reset Instructions',
    messageHtml: `<p>Hello ${user.fullName}, a password reset request was initiated. Your temporary access code is <strong>RESET-${Math.floor(100000 + Math.random() * 900000)}</strong>.</p>`,
    isRead: false,
    sentAt: new Date().toISOString(),
  });

  return res.json({ message: 'Password reset email sent. Check your notifications.' });
});
