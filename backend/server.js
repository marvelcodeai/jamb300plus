// =====================================================
// JAMB300PLUS - PRODUCTION EXPRESS BACKEND
// =====================================================

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 3000;

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:4200';

// =====================================================
// ENVIRONMENT CHECK
// =====================================================

console.log('\n================================');
console.log('🔧 ENVIRONMENT CHECK');
console.log('================================');

console.log(
  'SUPABASE_URL:',
  SUPABASE_URL ? '✅ Loaded' : '❌ Missing'
);

console.log(
  'SUPABASE_PUBLISHABLE_KEY:',
  SUPABASE_PUBLISHABLE_KEY
    ? '✅ Loaded'
    : '❌ Missing'
);

console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  SUPABASE_SERVICE_ROLE_KEY
    ? '✅ Loaded'
    : '❌ Missing'
);

console.log(
  'FRONTEND_URL:',
  FRONTEND_URL
);

console.log('================================\n');

// =====================================================
// REQUIRED ENVIRONMENT VALIDATION
// =====================================================

if (
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    '❌ Missing required Supabase environment variables.'
  );

  process.exit(1);
}

// =====================================================
// VALIDATE SERVER SECRET KEY
// =====================================================

if (
  !SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')
) {
  console.error('\n❌ WRONG SUPABASE SERVER KEY');
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY must contain your full sb_secret_ key.'
  );
  console.error(
    'Do NOT put your sb_publishable_ key here.'
  );

  process.exit(1);
}

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:4200',
  'http://127.0.0.1:4200'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // such as health checks and server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        '⚠️ CORS blocked origin:',
        origin
      );

      return callback(
        new Error('Not allowed by CORS')
      );
    },
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],
    credentials: true
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: '1mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb'
  })
);

// =====================================================
// SUPABASE SERVER CLIENT
//
// IMPORTANT:
// The service-role/secret key NEVER goes to Angular.
// This client exists only inside Node.js.
// =====================================================

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// =====================================================
// SUPABASE AUTH CLIENT
//
// Uses the publishable key.
// Used for normal authentication operations such as login
// and password-reset requests.
// =====================================================

const supabaseAuth = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// =====================================================
// HELPERS
// =====================================================

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function getSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName:
      user.user_metadata?.full_name || '',
    examType:
      user.user_metadata?.exam_type || 'JAMB',
    emailConfirmed:
      Boolean(user.email_confirmed_at),
    createdAt:
      user.created_at
  };
}

// =====================================================
// ROOT / TEST BACKEND
// =====================================================

app.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'JAMB300Plus backend is running!',
    environment:
      process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', async (req, res) => {
  try {
    const {
      error
    } = await supabaseAdmin
      .from('email_verification_codes')
      .select('id')
      .limit(1);

    if (error) {
      console.error(
        '❌ Health check Supabase error:',
        error
      );

      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Supabase connection failed.'
      });
    }

    return res.json({
      success: true,
      status: 'healthy',
      service: 'JAMB300Plus backend',
      supabase: 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(
      '❌ Health check error:',
      error
    );

    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Backend health check failed.'
    });
  }
});

// =====================================================
// TEST SUPABASE CONNECTION
// =====================================================

app.get(
  '/api/test-supabase',
  async (req, res) => {
    try {
      const {
        data,
        error
      } = await supabaseAdmin
        .from('email_verification_codes')
        .select('id')
        .limit(1);

      if (error) {
        console.error(
          '❌ Supabase test error:',
          error
        );

        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      return res.json({
        success: true,
        message:
          'Supabase connection is working!',
        rowsFound:
          data?.length || 0
      });

    } catch (error) {
      console.error(
        '❌ Supabase connection error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to connect to Supabase.'
      });
    }
  }
);

// =====================================================
// REGISTER
//
// POST /api/auth/register
//
// BODY:
// {
//   fullName,
//   email,
//   password
// }
//
// FLOW:
//
// Angular
//   ↓
// Express
//   ↓
// Supabase Admin
//   ↓
// Account created
//   ↓
// Login
// =====================================================

app.post(
  '/api/auth/register',
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        password
      } = req.body;

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !fullName ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Full name, email and password are required.'
        });
      }

      const cleanFullName =
        cleanName(fullName);

      const cleanEmail =
        normalizeEmail(email);

      if (cleanFullName.length < 3) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter your full name.'
        });
      }

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 6 characters.'
        });
      }

      // -------------------------------------------------
      // CREATE USER
      // -------------------------------------------------

      console.log(
        '\n👤 Creating Supabase user...'
      );

      const {
        data,
        error
      } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,

        user_metadata: {
          full_name: cleanFullName,
          exam_type: 'JAMB'
        }
      });

      // -------------------------------------------------
      // SUPABASE ERROR
      // -------------------------------------------------

      if (error) {
        console.error(
          '❌ Supabase registration error:',
          error
        );

        const errorMessage =
          String(error.message || '')
            .toLowerCase();

        if (
          errorMessage.includes(
            'already registered'
          ) ||
          errorMessage.includes(
            'already exists'
          ) ||
          errorMessage.includes(
            'user already registered'
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              'An account with this email already exists.'
          });
        }

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            'Unable to create account.'
        });
      }

      const user = data?.user;

      if (!user) {
        return res.status(500).json({
          success: false,
          message:
            'Account creation failed.'
        });
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      console.log(
        '================================'
      );

      console.log(
        '✅ REGISTRATION SUCCESSFUL'
      );

      console.log(
        'Email:',
        cleanEmail
      );

      console.log(
        'User ID:',
        user.id
      );

      console.log(
        'Email confirmed: YES'
      );

      console.log(
        '================================\n'
      );

      return res.status(201).json({
        success: true,
        message:
          'Account created successfully. You can now sign in.',
        email: cleanEmail,
        userId: user.id,
        user: getSafeUser(user)
      });

    } catch (error) {
      console.error(
        '\n❌ REGISTRATION SERVER ERROR:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Something went wrong while creating your account.'
      });
    }
  }
);

// =====================================================
// LOGIN
//
// POST /api/auth/login
//
// BODY:
// {
//   email,
//   password
// }
//
// RETURNS:
// {
//   success,
//   message,
//   session,
//   user
// }
// =====================================================

app.post(
  '/api/auth/login',
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            'Email and password are required.'
        });
      }

      const cleanEmail =
        normalizeEmail(email);

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.'
        });
      }

      // -------------------------------------------------
      // SIGN IN
      // -------------------------------------------------

      console.log(
        '\n🔐 Login attempt:',
        cleanEmail
      );

      const {
        data,
        error
      } = await supabaseAuth.auth
        .signInWithPassword({
          email: cleanEmail,
          password
        });

      if (error) {
        console.error(
          '❌ Login error:',
          error.message
        );

        return res.status(401).json({
          success: false,
          message:
            'Invalid email or password.'
        });
      }

      if (!data?.user || !data?.session) {
        return res.status(401).json({
          success: false,
          message:
            'Unable to create your login session.'
        });
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      console.log(
        '✅ Login successful:',
        cleanEmail
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        session: {
          accessToken:
            data.session.access_token,
          refreshToken:
            data.session.refresh_token,
          expiresAt:
            data.session.expires_at,
          expiresIn:
            data.session.expires_in
        },
        user: getSafeUser(data.user)
      });

    } catch (error) {
      console.error(
        '❌ LOGIN SERVER ERROR:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Something went wrong while signing in.'
      });
    }
  }
);

// =====================================================
// FORGOT PASSWORD
//
// POST /api/auth/forgot-password
//
// BODY:
// {
//   email
// }
//
// Supabase sends the recovery email.
// =====================================================

app.post(
  '/api/auth/forgot-password',
  async (req, res) => {
    try {
      const {
        email
      } = req.body;

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            'Email is required.'
        });
      }

      const cleanEmail =
        normalizeEmail(email);

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address.'
        });
      }

      // -------------------------------------------------
      // RESET REDIRECT URL
      //
      // After the user clicks the Supabase email,
      // Supabase redirects them back to Angular.
      // -------------------------------------------------

      const redirectTo =
        `${FRONTEND_URL}/reset-password`;

      console.log(
        '\n📧 Password reset requested:',
        cleanEmail
      );

      // -------------------------------------------------
      // SEND PASSWORD RESET EMAIL
      // -------------------------------------------------

      const {
        error
      } = await supabaseAuth.auth
        .resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo
          }
        );

      if (error) {
        console.error(
          '❌ Password reset error:',
          error
        );

        return res.status(400).json({
          success: false,
          message:
            'Unable to send password reset instructions.'
        });
      }

      // -------------------------------------------------
      // SUCCESS
      //
      // We intentionally return a generic success
      // message rather than revealing whether an
      // email exists in the system.
      // -------------------------------------------------

      return res.json({
        success: true,
        message:
          'If an account exists with this email, password reset instructions have been sent.'
      });

    } catch (error) {
      console.error(
        '❌ FORGOT PASSWORD SERVER ERROR:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to process your password reset request.'
      });
    }
  }
);

// =====================================================
// GET CURRENT USER
//
// GET /api/auth/user
//
// Authorization:
// Bearer <access_token>
//
// This lets Angular verify a Supabase session
// through the backend.
// =====================================================

app.get(
  '/api/auth/user',
  async (req, res) => {
    try {
      const authHeader =
        req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message:
            'Authorization token is required.'
        });
      }

      const token =
        authHeader.replace(
          'Bearer ',
          ''
        ).trim();

      if (!token) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid authorization token.'
        });
      }

      const {
        data,
        error
      } = await supabaseAuth.auth
        .getUser(token);

      if (error || !data?.user) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid or expired session.'
        });
      }

      return res.json({
        success: true,
        user: getSafeUser(data.user)
      });

    } catch (error) {
      console.error(
        '❌ GET USER ERROR:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to retrieve user information.'
      });
    }
  }
);

// =====================================================
// UPDATE PROFILE
//
// PUT /api/auth/profile
//
// Authorization:
// Bearer <access_token>
//
// BODY:
// {
//   fullName
// }
// =====================================================

app.put(
  '/api/auth/profile',
  async (req, res) => {
    try {
      const authHeader =
        req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message:
            'Authorization token is required.'
        });
      }

      const token =
        authHeader.replace(
          'Bearer ',
          ''
        ).trim();

      // -------------------------------------------------
      // GET CURRENT USER
      // -------------------------------------------------

      const {
        data: userData,
        error: userError
      } = await supabaseAuth.auth
        .getUser(token);

      if (
        userError ||
        !userData?.user
      ) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid or expired session.'
        });
      }

      const {
        fullName
      } = req.body;

      const cleanFullName =
        cleanName(fullName);

      if (
        !cleanFullName ||
        cleanFullName.length < 3
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid full name.'
        });
      }

      // -------------------------------------------------
      // UPDATE USER
      // -------------------------------------------------

      const {
        data,
        error
      } = await supabaseAdmin.auth
        .admin
        .updateUserById(
          userData.user.id,
          {
            user_metadata: {
              ...userData.user
                .user_metadata,
              full_name:
                cleanFullName
            }
          }
        );

      if (error) {
        console.error(
          '❌ Profile update error:',
          error
        );

        return res.status(400).json({
          success: false,
          message:
            error.message ||
            'Unable to update profile.'
        });
      }

      return res.json({
        success: true,
        message:
          'Profile updated successfully.',
        user: getSafeUser(data.user)
      });

    } catch (error) {
      console.error(
        '❌ PROFILE UPDATE ERROR:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to update your profile.'
      });
    }
  }
);

// =====================================================
// FUTURE EMAIL VERIFICATION ENDPOINT
//
// Email verification is currently disabled because
// registration automatically confirms the email.
//
// Kept so the frontend does not receive a 404 if it
// still references this route.
// =====================================================

app.post(
  '/api/auth/verify-email',
  async (req, res) => {
    return res.status(503).json({
      success: false,
      message:
        'Email verification is currently disabled.'
    });
  }
);

// =====================================================
// FUTURE RESEND VERIFICATION ENDPOINT
// =====================================================

app.post(
  '/api/auth/resend-code',
  async (req, res) => {
    return res.status(503).json({
      success: false,
      message:
        'Email verification is currently disabled.'
    });
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        `Route ${req.method} ${req.originalUrl} not found.`
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      '❌ GLOBAL SERVER ERROR:',
      err
    );

    if (
      err.message ===
      'Not allowed by CORS'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Request blocked by CORS policy.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Internal server error.'
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log('\n================================');
    console.log(
      `🚀 JAMB300Plus backend running on port ${PORT}`
    );
    console.log(
      `🌐 Frontend: ${FRONTEND_URL}`
    );
    console.log(
      '🔐 Supabase server client ready.'
    );
    console.log(
      '📧 Email verification: DISABLED'
    );
    console.log(
      '🔑 Password reset: ENABLED'
    );
    console.log(
      '➡️ Flow: REGISTER → LOGIN → HOME'
    );
    console.log('================================\n');
  }
);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on(
  'SIGTERM',
  () => {
    console.log(
      '\n🛑 SIGTERM received. Shutting down...'
    );

    process.exit(0);
  }
);

process.on(
  'SIGINT',
  () => {
    console.log(
      '\n🛑 SIGINT received. Shutting down...'
    );

    process.exit(0);
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  app
};
