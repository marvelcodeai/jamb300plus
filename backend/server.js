const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const supabaseUrl =
  process.env.SUPABASE_URL;

const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY;

const supabaseSecretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;


// =====================================================
// ENVIRONMENT CHECK
// =====================================================

console.log('\n================================');
console.log('🔧 ENVIRONMENT CHECK');
console.log('================================');

console.log(
  'SUPABASE_URL:',
  supabaseUrl ? '✅ Loaded' : '❌ Missing'
);

console.log(
  'SUPABASE_PUBLISHABLE_KEY:',
  supabasePublishableKey
    ? '✅ Loaded'
    : '❌ Missing'
);

console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  supabaseSecretKey
    ? '✅ Loaded'
    : '❌ Missing'
);

console.log('================================\n');


// =====================================================
// REQUIRED ENVIRONMENT VALIDATION
// =====================================================

if (
  !supabaseUrl ||
  !supabaseSecretKey
) {

  console.error(
    '❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.'
  );

  process.exit(1);
}


if (
  !supabaseSecretKey.startsWith(
    'sb_secret_'
  )
) {

  console.error(
    '\n❌ WRONG SUPABASE SERVER KEY'
  );

  console.error(
    'SUPABASE_SERVICE_ROLE_KEY must contain your FULL sb_secret_ key.'
  );

  console.error(
    'Do NOT put the sb_publishable_ key here.'
  );

  process.exit(1);
}


// =====================================================
// SUPABASE SERVER CLIENT
// =====================================================

const supabase =
  createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
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


function generateVerificationCode() {

  return crypto
    .randomInt(
      100000,
      1000000
    )
    .toString();

}


function hashVerificationCode(code) {

  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

}


// =====================================================
// TEST BACKEND
// =====================================================

app.get(
  '/',
  (req, res) => {

    res.json({

      success: true,

      message:
        'JAMB300Plus backend is running!'

    });

  }
);


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
      } =
        await supabase
          .from(
            'email_verification_codes'
          )
          .select('id')
          .limit(1);


      if (error) {

        console.error(
          '❌ Supabase test error:',
          error
        );

        return res
          .status(500)
          .json({

            success: false,

            message:
              error.message

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

      return res
        .status(500)
        .json({

          success: false,

          message:
            error.message

        });

    }

  }
);


// =====================================================
// REGISTER USER
//
// CURRENT FLOW:
//
// REGISTER
//    ↓
// ACCOUNT CREATED
//    ↓
// EMAIL ALREADY CONFIRMED
//    ↓
// LOGIN
//    ↓
// HOME
//
// EMAIL VERIFICATION IS DISABLED FOR NOW.
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

        return res
          .status(400)
          .json({

            success: false,

            message:
              'Full name, email and password are required.'

          });

      }


      const cleanName =
        String(fullName)
          .trim();

      const cleanEmail =
        normalizeEmail(email);


      if (
        cleanName.length < 3
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              'Please enter your full name.'

          });

      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(cleanEmail)
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              'Please enter a valid email address.'

          });

      }


      if (
        password.length < 6
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              'Password must be at least 6 characters.'

          });

      }


      // -------------------------------------------------
      // CHECK EXISTING USER
      // -------------------------------------------------

      console.log(
        '\n🔎 Checking existing Supabase users...'
      );


      const {
        data: existingUsers,
        error: existingError
      } =
        await supabase.auth.admin
          .listUsers({

            page: 1,

            perPage: 1000

          });


      if (existingError) {

        console.error(
          '❌ Supabase listUsers error:',
          existingError
        );

        return res
          .status(500)
          .json({

            success: false,

            message:
              'Unable to check your account.'

          });

      }


      const existingUser =
        existingUsers.users.find(
          user =>
            normalizeEmail(
              user.email
            ) === cleanEmail
        );


      // -------------------------------------------------
      // EXISTING USER
      // -------------------------------------------------

      if (existingUser) {

        // -------------------------------------------------
        // ACCOUNT ALREADY EXISTS
        // -------------------------------------------------

        if (
          existingUser.email_confirmed_at
        ) {

          return res
            .status(409)
            .json({

              success: false,

              message:
                'An account with this email already exists.'

            });

        }


        // -------------------------------------------------
        // EXISTING UNVERIFIED ACCOUNT
        //
        // Verification is disabled temporarily,
        // so confirm the account and update the password.
        // -------------------------------------------------

        console.log(
          '♻️ Existing unverified user found.'
        );

        console.log(
          '🔓 Temporarily confirming account...'
        );


        const {
          data: updatedUser,
          error: updateError
        } =
          await supabase.auth.admin
            .updateUserById(
              existingUser.id,
              {

                password,

                email_confirm:
                  true,

                user_metadata: {

                  full_name:
                    cleanName,

                  exam_type:
                    'JAMB'

                }

              }
            );


        if (updateError) {

          console.error(
            '❌ Update user error:',
            updateError
          );

          return res
            .status(400)
            .json({

              success: false,

              message:
                updateError.message

            });

        }


        console.log(
          '✅ Existing account updated and confirmed.'
        );


        return res
          .status(201)
          .json({

            success: true,

            message:
              'Account created successfully. You can now sign in.',

            email:
              cleanEmail,

            userId:
              updatedUser.user.id

          });

      }


      // -------------------------------------------------
      // CREATE NEW USER
      // -------------------------------------------------

      console.log(
        '👤 Creating new Supabase user...'
      );


      const {
        data: createdUser,
        error: createError
      } =
        await supabase.auth.admin
          .createUser({

            email:
              cleanEmail,

            password,

            // -------------------------------------------
            // EMAIL VERIFICATION DISABLED
            // -------------------------------------------

            email_confirm:
              true,

            user_metadata: {

              full_name:
                cleanName,

              exam_type:
                'JAMB'

            }

          });


      if (createError) {

        console.error(
          '❌ Create user error:',
          createError
        );

        return res
          .status(400)
          .json({

            success: false,

            message:
              createError.message

          });

      }


      const user =
        createdUser.user;


      // -------------------------------------------------
      // REGISTRATION SUCCESS
      // -------------------------------------------------

      console.log(
        '\n================================'
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
        'Verification: DISABLED'
      );

      console.log(
        '================================\n'
      );


      return res
        .status(201)
        .json({

          success: true,

          message:
            'Account created successfully. You can now sign in.',

          email:
            cleanEmail,

          userId:
            user.id

        });


    } catch (error) {

      console.error(
        '\n❌ REGISTRATION SERVER ERROR:'
      );

      console.error(
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            'Something went wrong while creating your account.'

        });

    }

  }
);


// =====================================================
// VERIFY EMAIL
//
// DISABLED FOR NOW.
//
// KEPT FOR FUTURE EMAIL VERIFICATION IMPLEMENTATION.
// =====================================================

app.post(
  '/api/auth/verify-email',
  async (req, res) => {

    return res
      .status(503)
      .json({

        success: false,

        message:
          'Email verification is currently disabled.'

      });

  }
);


// =====================================================
// RESEND VERIFICATION CODE
//
// DISABLED FOR NOW.
// =====================================================

app.post(
  '/api/auth/resend-code',
  async (req, res) => {

    return res
      .status(503)
      .json({

        success: false,

        message:
          'Email verification is currently disabled.'

      });

  }
);


// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {

    console.log(
      `🚀 JAMB300Plus backend running on http://localhost:${PORT}`
    );

    console.log(
      '🔐 Supabase server client ready.'
    );

    console.log(
      '📧 Email verification disabled.'
    );

    console.log(
      '➡️ Current flow: REGISTER → LOGIN → HOME'
    );

  }
);