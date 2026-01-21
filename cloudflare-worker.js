// Cloudflare Worker - Feature Flags + Token Balance Proxy
// Deploy this to Cloudflare Workers (free tier: 100k requests/day)
//
// Setup:
// 1. Go to https://dash.cloudflare.com
// 2. Workers & Pages → Create Worker
// 3. Paste this code
// 4. Add environment variable: HELIUS_API_KEY = your-helius-api-key
// 5. Deploy and copy the worker URL
// 6. Update WORKER_URL in background.js

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ========================================
    // FEATURE FLAGS ENDPOINT
    // ========================================
    // Change these values to enable/disable features for ALL users
    if (path === '/config' || path === '/') {
      const config = {
        // ====== CHANGE THESE TO CONTROL FEATURES ======
        tokenGatingEnabled: false,     // Set to true to require $WAGE tokens
        autoSellEnabled: false,        // Set to true to enable auto-sell
        voiceJournalingEnabled: false, // Set to true to enable voice notes
        walletConnectEnabled: false,   // Set to true to enable wallet connect
        // ==============================================

        // Token settings (for when token gating is enabled)
        wageTokenMint: '4nswj3o1Lo9iWYvvRJxUD8vbCy9ay7QQoXYcncHNbonk',
        requiredBalance: 1000,         // Minimum $WAGE for PRO

        // Version info
        version: '2.0.0',
        message: '$WAGE Tracker - Free Version'
      };

      return new Response(JSON.stringify(config), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ========================================
    // TOKEN BALANCE ENDPOINT (for token gating)
    // ========================================
    if (path === '/balance') {
      try {
        const walletAddress = url.searchParams.get('wallet');
        const tokenMint = url.searchParams.get('mint');

        if (!walletAddress) {
          return new Response(JSON.stringify({ error: 'Missing wallet parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Call Helius API with the secret key
        const heliusUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${env.HELIUS_API_KEY}`;

        const response = await fetch(heliusUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Helius returned ${response.status}`);
        }

        const data = await response.json();

        // If specific token mint requested, filter for it
        if (tokenMint && data.tokens) {
          const token = data.tokens.find(t => t.mint === tokenMint);
          if (token) {
            const balance = token.amount / Math.pow(10, token.decimals || 0);
            return new Response(JSON.stringify({
              success: true,
              balance: balance,
              mint: tokenMint
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({
              success: true,
              balance: 0,
              mint: tokenMint
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // Return all token balances
        return new Response(JSON.stringify({
          success: true,
          tokens: data.tokens || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Unknown endpoint
    return new Response(JSON.stringify({
      error: 'Unknown endpoint',
      endpoints: ['/config', '/balance']
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
