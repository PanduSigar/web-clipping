import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function verifyReceiptWithAI(receiptBase64, expectedPrice, expectedPackage, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Extract base64 and mime type
    const match = receiptBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      console.warn('[AI Verification Agent] Format bukti bayar tidak didukung.');
      return { status: 'Pending', reason: 'Format gambar tidak didukung' };
    }
    
    const mimeType = match[1];
    const base64Data = match[2];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    const prompt = `
Anda adalah AI Agen Keuangan yang bertugas memverifikasi struk bukti transfer pembayaran (QRIS / m-banking / e-wallet).
Kami sedang memproses pesanan dengan detail berikut:
- Paket yang dibeli: ${expectedPackage}
- Harga paket: Rp ${expectedPrice.toLocaleString('id-ID')}

Tugas Anda:
Periksa gambar struk bukti transfer yang dilampirkan. Apakah struk ini valid, asli, dan nominal transfernya tepat sebesar Rp ${expectedPrice.toLocaleString('id-ID')}?

Kriteria valid:
1. Status transaksi harus sukses (Berhasil / Success / Selesai / Transaksi Berhasil / Berhasil Ditransfer).
2. Nominal yang tertera harus sama persis dengan Rp ${expectedPrice.toLocaleString('id-ID')}.
3. Struk harus merupakan struk pembayaran asli, bukan tangkapan layar acak, foto bukan struk, atau gambar kosong.

Format respon Anda harus berupa JSON dengan struktur berikut:
{
  "isValid": true atau false,
  "reason": "Alasan singkat mengapa valid atau tidak valid"
}
Kembalikan HANYA format JSON di atas, tanpa teks tambahan lainnya.
`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log(`[AI Verification Agent] Respon Gemini:`, responseText);

    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const verification = JSON.parse(cleanText);

    if (verification.isValid === true) {
      return { status: 'Success', reason: verification.reason || 'Diverifikasi secara otomatis oleh AI Agen.' };
    } else {
      return { status: 'Rejected', reason: verification.reason || 'Ditolak secara otomatis oleh AI Agen.' };
    }
  } catch (err) {
    console.error('[AI Verification Agent] Gagal verifikasi bukti menggunakan AI:', err.message);
    return { status: 'Pending', reason: 'Error pada proses AI: ' + err.message };
  }
}

// Read configuration from .env file directly
function getEnvConfig() {
  const envPath = path.resolve('.env');
  const config = {
    VITE_USE_LOCAL_DB: 'false',
    DB_HOST: 'localhost',
    DB_PORT: '3306',
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'dataflow_db'
  };

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.substring(0, equalsIdx).trim();
        let value = trimmed.substring(equalsIdx + 1).trim();
        
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        config[key] = value.trim();
      }
    }
  }

  // Fallback to process.env if available
  for (const key of Object.keys(config)) {
    if (process.env[key]) {
      config[key] = process.env[key];
    }
  }

  return config;
}

// SHA256 Password hashing
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Parse request body JSON helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (!body) resolve({});
        else resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
}

let pool = null;

async function getPool(config) {
  if (pool) return pool;

  console.log(`[Local DB Server] Menghubungkan ke MySQL Laragon di ${config.DB_HOST}:${config.DB_PORT}...`);
  
  // 1. Establish initial connection without database to check/create database
  const connection = await mysql.createConnection({
    host: config.DB_HOST,
    port: Number(config.DB_PORT),
    user: config.DB_USER,
    password: config.DB_PASSWORD,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\``);
  await connection.end();

  // 2. Create connection pool targeting the database
  pool = mysql.createPool({
    host: config.DB_HOST,
    port: Number(config.DB_PORT),
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // 3. Run auto-migrations
  await runMigrations();

  return pool;
}

async function runMigrations() {
  console.log('[Local DB Server] Memeriksa & membuat tabel database...');
  const conn = await pool.getConnection();
  try {
    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create profiles table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token_limit BIGINT DEFAULT 15000,
        token_used BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        package_name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        tokens INT NOT NULL,
        receipt LONGTEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        approved_by VARCHAR(255) DEFAULT 'Manual',
        notes VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist on older tables
    try {
      await conn.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'");
    } catch (colErr) {}
    try {
      await conn.query('ALTER TABLE transactions ADD COLUMN approved_by VARCHAR(255) DEFAULT \'Manual\'');
    } catch (colErr) {}
    try {
      await conn.query('ALTER TABLE transactions ADD COLUMN notes VARCHAR(255) DEFAULT NULL');
    } catch (colErr) {}

    // Ensure admin@dataflow.com is marked as admin
    try {
      await conn.query("UPDATE users SET role = 'admin' WHERE email = 'admin@dataflow.com'");
    } catch (dbErr) {
      console.error('[Local DB Server] Gagal memperbarui role admin@dataflow.com:', dbErr.message);
    }

    // Seed default admin if it doesn't exist
    try {
      const [adminUsers] = await conn.query("SELECT id FROM users WHERE email = 'admin@dataflow.com'");
      if (!adminUsers || adminUsers.length === 0) {
        const adminId = `mysql-admin-${Date.now()}`;
        const adminPasswordHash = hashPassword('admin123');
        await conn.query(
          "INSERT INTO users (id, email, password, role) VALUES (?, 'admin@dataflow.com', ?, 'admin')",
          [adminId, adminPasswordHash]
        );
        // Also insert profile for admin
        await conn.query(
          "INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, 'admin@dataflow.com', 999999, 0)",
          [adminId]
        );
        console.log('[Local DB Server] Seeded default admin account: admin@dataflow.com with password: admin123');
      }
    } catch (seedErr) {
      console.error('[Local DB Server] Gagal melakukan seeding admin default:', seedErr.message);
    }

    // Create academic_journals table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS academic_journals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create presentations table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS presentations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slide_data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create clipper_history table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS clipper_history (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        video_url VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        clip_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('[Local DB Server] Tabel users, profiles, transactions, academic_journals, presentations, dan clipper_history siap.');
  } catch (err) {
    console.error('[Local DB Server] Gagal melakukan inisialisasi tabel:', err.message);
  } finally {
    conn.release();
  }
}

export default function viteDbPlugin() {
  const config = getEnvConfig();

  // If local DB is not enabled, do not boot up connection pools
  const isLocalDbEnabled = config.VITE_USE_LOCAL_DB === 'true';

  return {
    name: 'vite-plugin-local-db',
    configureServer(server) {
      if (!isLocalDbEnabled) {
        console.log('[Local DB Server] Mode Database Laragon (MySQL) dinonaktifkan. Menggunakan simulation mode.');
        return;
      }

      // Initialize DB Pool immediately on server startup
      getPool(config).catch(err => {
        console.error('[Local DB Server] Gagal menghubungkan ke MySQL Laragon pada startup server:', err.message);
      });

      // API: SIGN UP
      server.middlewares.use('/api/db/signup', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { email, password } = await parseJsonBody(req);

            if (!email || !password) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Email dan kata sandi wajib diisi.' }));
              return;
            }

            // Check if user already exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing && existing.length > 0) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Email sudah terdaftar.' }));
              return;
            }

            const userId = `mysql-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const hashedPassword = hashPassword(password);

            // Determine user role
            const adminEmails = (config.ADMIN_EMAILS || 'admin@dataflow.com')
              .split(',')
              .map(e => e.trim().toLowerCase());
            const isEmailAdmin = adminEmails.includes(email.trim().toLowerCase());
            const userRole = isEmailAdmin ? 'admin' : 'user';

            // Transaction insert
            const conn = await db.getConnection();
            try {
              await conn.beginTransaction();
              await conn.query('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', [userId, email, hashedPassword, userRole]);
              await conn.query('INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, ?, 15000, 0)', [userId, email]);
              await conn.commit();
            } catch (txErr) {
              await conn.rollback();
              throw txErr;
            } finally {
              conn.release();
            }

            console.log(`[Local DB Server] User baru berhasil terdaftar: ${email} dengan role: ${userRole}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              user: { id: userId, email, role: userRole },
              profile: { id: userId, email, token_limit: 15000, token_used: 0 },
              isSimulation: false
            }));
          } catch (err) {
            console.error('[Local DB Server] Signup Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: SIGN IN
      server.middlewares.use('/api/db/signin', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { email, password } = await parseJsonBody(req);

            if (!email || !password) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Email dan kata sandi wajib diisi.' }));
              return;
            }

            const hashedPassword = hashPassword(password);
            const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, hashedPassword]);

            if (!users || users.length === 0) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Email atau kata sandi salah.' }));
              return;
            }

            const user = users[0];
            
            // Get or create profile
            let [profiles] = await db.query('SELECT * FROM profiles WHERE id = ?', [user.id]);
            let profile;
            if (!profiles || profiles.length === 0) {
              await db.query('INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, ?, 15000, 0)', [user.id, email]);
              profile = { id: user.id, email, token_limit: 15000, token_used: 0 };
            } else {
              profile = profiles[0];
              // Convert BigInt columns to numbers for safety in JSON conversion
              profile.token_limit = Number(profile.token_limit);
              profile.token_used = Number(profile.token_used);
            }

            console.log(`[Local DB Server] User login berhasil: ${email} (Role: ${user.role})`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              user: { id: user.id, email: user.email, role: user.role },
              profile,
              token: `local-token-${user.id}`,
              isSimulation: false
            }));
          } catch (err) {
            console.error('[Local DB Server] Signin Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: GET USER PROFILE
      server.middlewares.use('/api/db/profile', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const db = await getPool(config);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const userId = urlObj.searchParams.get('userId');
            const email = urlObj.searchParams.get('email') || '';

            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Parameter userId wajib disertakan.' }));
              return;
            }

            let [profiles] = await db.query('SELECT * FROM profiles WHERE id = ?', [userId]);
            let profile;

            if (!profiles || profiles.length === 0) {
              // Create default profile if missing
              await db.query('INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, ?, 15000, 0)', [userId, email]);
              profile = { id: userId, email, token_limit: 15000, token_used: 0 };
            } else {
              profile = profiles[0];
              profile.token_limit = Number(profile.token_limit);
              profile.token_used = Number(profile.token_used);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(profile));
          } catch (err) {
            console.error('[Local DB Server] Get Profile Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: UPDATE USER QUOTA
      server.middlewares.use('/api/db/update-quota', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { userId, tokensToAdd } = await parseJsonBody(req);

            if (!userId || tokensToAdd === undefined) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId dan tokensToAdd wajib dikirim.' }));
              return;
            }

            // Retrieve current
            const [profiles] = await db.query('SELECT * FROM profiles WHERE id = ?', [userId]);
            if (!profiles || profiles.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Profil tidak ditemukan.' }));
              return;
            }

            const current = profiles[0];
            const newLimit = Number(current.token_limit) + Number(tokensToAdd);

            await db.query('UPDATE profiles SET token_limit = ? WHERE id = ?', [newLimit, userId]);
            console.log(`[Local DB Server] Sukses menambah ${tokensToAdd} token ke user ${userId}. Limit baru: ${newLimit}`);

            const updated = {
              ...current,
              token_limit: newLimit,
              token_used: Number(current.token_used)
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updated));
          } catch (err) {
            console.error('[Local DB Server] Update Quota Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: DEDUCT USER TOKENS
      server.middlewares.use('/api/db/deduct-tokens', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { userId, tokensUsed } = await parseJsonBody(req);

            if (!userId || tokensUsed === undefined) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId dan tokensUsed wajib dikirim.' }));
              return;
            }

            const [profiles] = await db.query('SELECT * FROM profiles WHERE id = ?', [userId]);
            if (!profiles || profiles.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Profil tidak ditemukan.' }));
              return;
            }

            const current = profiles[0];
            const newUsed = Number(current.token_used) + Number(tokensUsed);

            await db.query('UPDATE profiles SET token_used = ? WHERE id = ?', [newUsed, userId]);
            console.log(`[Local DB Server] Sukses mendebet ${tokensUsed} token dari user ${userId}. Total terpakai: ${newUsed}`);

            const updated = {
              ...current,
              token_limit: Number(current.token_limit),
              token_used: newUsed
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updated));
          } catch (err) {
            console.error('[Local DB Server] Deduct Tokens Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: CREATE PENDING TRANSACTION WITH RECEIPT PROOF
      server.middlewares.use('/api/db/transaction/create', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { id, userId, email, packageName, price, tokens, receipt } = await parseJsonBody(req);

            if (!id || !userId || !email || !packageName || !price || !tokens || !receipt) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Data transaksi tidak lengkap.' }));
              return;
            }

            await db.query(
              'INSERT INTO transactions (id, user_id, email, package_name, price, tokens, receipt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [id, userId, email, packageName, price, tokens, receipt, 'Pending']
            );

            console.log(`[Local DB Server] Transaksi Pending dibuat untuk Order ${id} oleh ${email}`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, transactionId: id }));

            // Trigger AI Agent Verification in the background
            const geminiApiKey = config.GEMINI_API_KEY || 'AIzaSyBWcnd0dkt2KzWqS1CoihiHfL0cPoh55N4';
            
            setTimeout(async () => {
              console.log(`[Local DB Server] AI Agent mulai memverifikasi pesanan ${id} secara otomatis...`);
              const aiResult = await verifyReceiptWithAI(receipt, price, packageName, geminiApiKey);
              
              const conn = await db.getConnection();
              try {
                await conn.beginTransaction();

                if (aiResult.status === 'Success') {
                  // 1. Update status to Success, approved_by to 'AI Agent', and set notes
                  await conn.query(
                    'UPDATE transactions SET status = "Success", approved_by = "AI Agent", notes = ? WHERE id = ?',
                    [aiResult.reason, id]
                  );
                  console.log(`[Local DB Server] [AI APPROVE] Transaksi ${id} disetujui otomatis oleh AI Agen!`);

                  // 2. Add tokens to buyer profile
                  const [profiles] = await conn.query('SELECT * FROM profiles WHERE id = ?', [userId]);
                  if (profiles && profiles.length > 0) {
                    const newLimit = Number(profiles[0].token_limit) + Number(tokens);
                    await conn.query('UPDATE profiles SET token_limit = ? WHERE id = ?', [newLimit, userId]);
                  } else {
                    await conn.query('INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, ?, ?, 0)', [userId, email, tokens]);
                  }
                  await conn.commit();
                } else if (aiResult.status === 'Rejected') {
                  // Update status to Rejected, approved_by to 'AI Agent', and set notes
                  await conn.query(
                    'UPDATE transactions SET status = "Rejected", approved_by = "AI Agent", notes = ? WHERE id = ?',
                    [aiResult.reason, id]
                  );
                  await conn.commit();
                  console.log(`[Local DB Server] [AI REJECT] Transaksi ${id} ditolak otomatis oleh AI Agen karena: ${aiResult.reason}`);
                } else {
                  // Leave as Pending for manual admin review
                  await conn.query(
                    'UPDATE transactions SET notes = ? WHERE id = ?',
                    [aiResult.reason, id]
                  );
                  await conn.commit();
                  console.log(`[Local DB Server] [AI PENDING] Transaksi ${id} dibiarkan Pending untuk verifikasi manual karena: ${aiResult.reason}`);
                }
              } catch (txErr) {
                await conn.rollback();
                console.error('[Local DB Server] Gagal memproses update AI verification di database:', txErr.message);
              } finally {
                conn.release();
              }
            }, 1000);

          } catch (err) {
            console.error('[Local DB Server] Create Transaction Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: GET ALL TRANSACTIONS FOR ADMIN PANEL
      server.middlewares.use('/api/db/admin/transactions', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const db = await getPool(config);
            const [rows] = await db.query('SELECT * FROM transactions ORDER BY created_at DESC');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
          } catch (err) {
            console.error('[Local DB Server] Admin Get Transactions Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: APPROVE TRANSACTION
      server.middlewares.use('/api/db/admin/approve-transaction', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { transactionId } = await parseJsonBody(req);

            if (!transactionId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'transactionId wajib dikirim.' }));
              return;
            }

            // Get transaction details
            const [txs] = await db.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
            if (!txs || txs.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Transaksi tidak ditemukan.' }));
              return;
            }

            const tx = txs[0];
            if (tx.status !== 'Pending') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Transaksi ini sudah diproses sebelumnya.' }));
              return;
            }

            const conn = await db.getConnection();
            try {
              await conn.beginTransaction();

              // 1. Update status to Success
              await conn.query('UPDATE transactions SET status = "Success", approved_by = "Admin" WHERE id = ?', [transactionId]);

              // 2. Add tokens to buyer profile
              const [profiles] = await conn.query('SELECT * FROM profiles WHERE id = ?', [tx.user_id]);
              if (profiles && profiles.length > 0) {
                const newLimit = Number(profiles[0].token_limit) + Number(tx.tokens);
                await conn.query('UPDATE profiles SET token_limit = ? WHERE id = ?', [newLimit, tx.user_id]);
              } else {
                // Create profile if missing (rare case)
                await conn.query('INSERT INTO profiles (id, email, token_limit, token_used) VALUES (?, ?, ?, 0)', [tx.user_id, tx.email, tx.tokens]);
              }

              await conn.commit();
              console.log(`[Local DB Server] Transaksi ${transactionId} berhasil DISETUJUI. +${tx.tokens} token dikreditkan ke ${tx.email}`);
            } catch (txErr) {
              await conn.rollback();
              throw txErr;
            } finally {
              conn.release();
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error('[Local DB Server] Approve Transaction Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: REJECT TRANSACTION
      server.middlewares.use('/api/db/admin/reject-transaction', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { transactionId } = await parseJsonBody(req);

            if (!transactionId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'transactionId wajib dikirim.' }));
              return;
            }

            // Get transaction details
            const [txs] = await db.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
            if (!txs || txs.length === 0) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Transaksi tidak ditemukan.' }));
              return;
            }

            const tx = txs[0];
            if (tx.status !== 'Pending') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Transaksi ini sudah diproses.' }));
              return;
            }

            await db.query('UPDATE transactions SET status = "Rejected", approved_by = "Admin" WHERE id = ?', [transactionId]);
            console.log(`[Local DB Server] Transaksi ${transactionId} berhasil DITOLAK.`);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error('[Local DB Server] Reject Transaction Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: SAVE ACADEMIC JOURNAL
      server.middlewares.use('/api/db/journal/save', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { userId, title, topic, content } = await parseJsonBody(req);

            if (!userId || !title || !content) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId, title, dan content wajib dikirim.' }));
              return;
            }

            const id = `journal-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            await db.query(
              'INSERT INTO academic_journals (id, user_id, title, topic, content) VALUES (?, ?, ?, ?, ?)',
              [id, userId, title, topic || '', content]
            );

            console.log(`[Local DB Server] Jurnal berhasil disimpan. ID: ${id}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id }));
          } catch (err) {
            console.error('[Local DB Server] Save Journal Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: GET USER ACADEMIC JOURNALS
      server.middlewares.use('/api/db/journals', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const db = await getPool(config);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const userId = urlObj.searchParams.get('userId');

            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId wajib disertakan.' }));
              return;
            }

            const [rows] = await db.query('SELECT * FROM academic_journals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
          } catch (err) {
            console.error('[Local DB Server] Get Journals Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: SAVE PRESENTATION
      server.middlewares.use('/api/db/presentation/save', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { userId, title, slideData } = await parseJsonBody(req);

            if (!userId || !title || !slideData) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId, title, dan slideData wajib dikirim.' }));
              return;
            }

            const id = `pres-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const slideDataStr = typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
            
            await db.query(
              'INSERT INTO presentations (id, user_id, title, slide_data) VALUES (?, ?, ?, ?)',
              [id, userId, title, slideDataStr]
            );

            console.log(`[Local DB Server] Presentasi berhasil disimpan. ID: ${id}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id }));
          } catch (err) {
            console.error('[Local DB Server] Save Presentation Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: GET USER PRESENTATIONS
      server.middlewares.use('/api/db/presentations', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const db = await getPool(config);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const userId = urlObj.searchParams.get('userId');

            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId wajib disertakan.' }));
              return;
            }

            const [rows] = await db.query('SELECT * FROM presentations WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
          } catch (err) {
            console.error('[Local DB Server] Get Presentations Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: SAVE CLIPPER HISTORY
      server.middlewares.use('/api/db/clipper/save', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            const db = await getPool(config);
            const { userId, videoUrl, title, startTime, endTime, clipPath } = await parseJsonBody(req);

            if (!userId || !videoUrl || !title || !startTime || !endTime || !clipPath) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Data clipper history tidak lengkap.' }));
              return;
            }

            const id = `clip-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            await db.query(
              'INSERT INTO clipper_history (id, user_id, video_url, title, start_time, end_time, clip_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [id, userId, videoUrl, title, startTime, endTime, clipPath]
            );

            console.log(`[Local DB Server] Clipper log disimpan. ID: ${id}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id }));
          } catch (err) {
            console.error('[Local DB Server] Save Clipper History Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });

      // API: GET USER CLIPPER HISTORY
      server.middlewares.use('/api/db/clipper/history', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const db = await getPool(config);
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const userId = urlObj.searchParams.get('userId');

            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'userId wajib disertakan.' }));
              return;
            }

            const [rows] = await db.query('SELECT * FROM clipper_history WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
          } catch (err) {
            console.error('[Local DB Server] Get Clipper History Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}
