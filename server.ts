import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const VITE_VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VITE_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error(
    'VAPID keys are not configured. Please add VITE_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your .env file'
  );
}

// In-memory storage for push subscriptions (for demonstration purposes)
// In a production app, you would store these in a database.
let subscriptions: webpush.PushSubscription[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // Configure web-push with VAPID keys
  if (VITE_VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        'mailto:your-email@example.com',
        VITE_VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );
    } catch (err) {
      console.error('Failed to set VAPID details:', err);
    }
  }

  // API route for clients to subscribe to push notifications
  app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscriptions.some(s => s.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
        console.log('New subscription added:', subscription.endpoint);
    }
    res.status(201).json({ message: 'Subscription successful.' });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Start listening immediately to satisfy platform health checks
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Server is listening on port ${PORT}`);
  });

  // Initialize everything else in the background
  (async () => {
    // Initialize Supabase client
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const sendNotification = (subscription: webpush.PushSubscription, payload: any) => {
          webpush.sendNotification(subscription, JSON.stringify(payload))
            .catch((error: any) => {
              if (error.statusCode === 410) {
                subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
              }
            });
        };

        supabase
          .channel('system_alerts_inserts')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'system_alerts' }, 
            (payload) => {
              const newAlert = payload.new;
              const notificationPayload = {
                title: `New Alert: ${newAlert.type}`,
                body: newAlert.message,
                icon: '/logo.png'
              };
              subscriptions.forEach(subscription => sendNotification(subscription, notificationPayload));
            }
          )
          .subscribe();
        console.log('>>> Supabase listener active.');
      } catch (err) {
        console.error('Supabase init failed:', err);
      }
    }

    // Initialize Vite middleware
    if (process.env.NODE_ENV !== 'production') {
      try {
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: false // Disable HMR as per platform guidelines
          },
          appType: 'spa',
        });
        app.use(vite.middlewares);
        console.log('>>> Vite middleware ready.');
      } catch (err) {
        console.error('Vite init failed:', err);
      }
    }
  })();
}

startServer();
