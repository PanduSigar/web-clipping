import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';

// Helper to make secure POST requests without external dependencies
function securePost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

export default function vitePaymentPlugin() {
  return {
    name: 'vite-plugin-payment-gateway',
    configureServer(server) {
      // 1. Endpoint to initiate a payment transaction (Midtrans Snap token)
      server.middlewares.use('/api/payment/create', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { price, tokens, email, userId } = JSON.parse(body);

              // Retrieve server keys from local settings if available
              const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || ''; 
              const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

              // Fallback to SIMULATION if no keys are provided
              if (!midtransServerKey || midtransServerKey.trim() === '') {
                console.log('[Payment API] Menjalankan dalam MODE SIMULASI (Tidak ada Midtrans Server Key).');
                const mockToken = `mock-snap-token-${Date.now()}`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  isSimulation: true,
                  token: mockToken,
                  redirect_url: `https://example.com/payment?token=${mockToken}`
                }));
                return;
              }

              const orderId = `ORDER-${userId ? userId.substring(0, 8) : 'GUEST'}-${Date.now()}`;
              const baseUrl = isProduction 
                ? 'https://app.midtrans.com/snap/v1/transactions' 
                : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

              const midtransHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(midtransServerKey.trim() + ':').toString('base64')
              };

              const transactionDetails = {
                transaction_details: {
                  order_id: orderId,
                  gross_amount: Number(price)
                },
                credit_card: {
                  secure: true
                },
                customer_details: {
                  email: email || 'guest@example.com'
                },
                item_details: [
                  {
                    id: 'token_package',
                    price: Number(price),
                    quantity: 1,
                    name: `Top Up ${Number(tokens).toLocaleString('id-ID')} Kuota Token Gemini`
                  }
                ],
                custom_field1: userId // Store userId so we know who bought it
              };

              console.log(`[Payment API] Mengirim data transaksi ke Midtrans untuk Order: ${orderId}`);
              const response = await securePost(baseUrl, midtransHeaders, transactionDetails);

              if (response.statusCode === 201 || response.statusCode === 200) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  isSimulation: false,
                  token: response.data.token,
                  redirect_url: response.data.redirect_url
                }));
              } else {
                console.error('[Payment API] Gagal dari Midtrans API:', response.data || response.raw);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'Gagal membuat transaksi ke Midtrans', 
                  details: response.data || response.raw 
                }));
              }
            } catch (err) {
              console.error('[Payment API] Error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });

      // 2. Webhook notification endpoint called by Midtrans
      server.middlewares.use('/api/payment/webhook', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const notification = JSON.parse(body);
              console.log('[Payment Webhook] Menerima notifikasi dari Midtrans:', notification);

              const transactionStatus = notification.transaction_status;
              const fraudStatus = notification.fraud_status;
              const orderId = notification.order_id;
              const amount = notification.gross_amount;
              const userId = notification.custom_field1; // retrieve stored userId

              let isSuccess = false;
              if (transactionStatus === 'capture') {
                if (fraudStatus === 'challenge') {
                  // Challenge status
                } else if (fraudStatus === 'accept') {
                  isSuccess = true;
                }
              } else if (transactionStatus === 'settlement') {
                isSuccess = true;
              }

              if (isSuccess && userId) {
                console.log(`[Payment Webhook] Pembayaran sukses untuk order ${orderId}, user ${userId}. Menambah kuota...`);
                
                // Map the price back to tokens count
                // Starter: Rp 15.000 -> 100k tokens
                // Pro: Rp 50.000 -> 500k tokens
                // Business: Rp 120.000 -> 1.5M tokens
                let tokensToCredit = 0;
                const price = Number(amount);
                if (price === 15000) tokensToCredit = 100000;
                else if (price === 50000) tokensToCredit = 500000;
                else if (price === 150000) tokensToCredit = 2000000; // Updated to 150k package for 2M tokens
                else tokensToCredit = Math.floor(price * 10); // fallback

                // Note: The actual Supabase update will occur in the frontend,
                // but we also print this log to verify the backend webhook triggers correctly.
                console.log(`[Payment Webhook] Kredit kuota sebanyak ${tokensToCredit} token untuk user ${userId}`);
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'OK' }));
            } catch (err) {
              console.error('[Payment Webhook] Error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
