// Background Service Worker - Handles RPC calls and config fetching
// Manifest V3 service worker

// Cloudflare Worker URL - Deploy cloudflare-worker.js and put URL here
const WORKER_URL = 'https://wage-tracker.YOUR_SUBDOMAIN.workers.dev';

const WAGE_TOKEN_MINT = '4nswj3o1Lo9iWYvvRJxUD8vbCy9ay7QQoXYcncHNbonk';

// Cache for remote config
let cachedConfig = null;
let configLastFetched = 0;
const CONFIG_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

console.log('[Background] Service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request.action);

  if (request.action === 'getConfig') {
    getRemoteConfig()
      .then(config => {
        console.log('[Background] Returning config:', JSON.stringify(config));
        sendResponse(config);
      })
      .catch(err => {
        console.log('[Background] Config error:', err.message);
        // Return default config on error
        sendResponse(getDefaultConfig());
      });
    return true;
  }

  if (request.action === 'checkWageBalance') {
    console.log('[Background] Processing checkWageBalance request');
    console.log('[Background] Wallet:', request.walletAddress);
    console.log('[Background] Token:', request.tokenMint || WAGE_TOKEN_MINT);

    checkWageBalance(request.walletAddress, request.tokenMint || WAGE_TOKEN_MINT)
      .then(result => {
        console.log('[Background] Sending response:', JSON.stringify(result));
        sendResponse(result);
      })
      .catch(err => {
        console.log('[Background] Error:', err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
});

// Default config when server is unreachable
function getDefaultConfig() {
  return {
    tokenGatingEnabled: false,
    autoSellEnabled: false,
    voiceJournalingEnabled: false,
    walletConnectEnabled: false,
    wageTokenMint: WAGE_TOKEN_MINT,
    requiredBalance: 1000,
    version: '2.0.0',
    message: '$WAGE Tracker - Free Version'
  };
}

// Fetch config from Cloudflare Worker
async function getRemoteConfig() {
  // Check cache first
  if (cachedConfig && (Date.now() - configLastFetched) < CONFIG_CACHE_TIME) {
    console.log('[Background] Using cached config');
    return cachedConfig;
  }

  // Skip if worker URL not configured
  if (WORKER_URL.includes('YOUR_SUBDOMAIN')) {
    console.log('[Background] Worker URL not configured, using defaults');
    return getDefaultConfig();
  }

  try {
    console.log('[Background] Fetching remote config...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${WORKER_URL}/config`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      const config = await response.json();
      cachedConfig = config;
      configLastFetched = Date.now();
      console.log('[Background] Remote config fetched:', JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.log('[Background] Remote config error:', err.message);
  }

  // Fallback to defaults
  return getDefaultConfig();
}

async function checkWageBalance(walletAddress, tokenMint) {
  console.log('[Background] ========== BALANCE CHECK START ==========');
  console.log('[Background] Wallet address:', walletAddress);
  console.log('[Background] Token mint:', tokenMint);

  // Method 1: Try Cloudflare Worker proxy (if configured)
  if (WORKER_URL && !WORKER_URL.includes('YOUR_SUBDOMAIN')) {
    try {
      console.log('[Background] ----- Trying Worker Proxy -----');
      const proxyUrl = `${WORKER_URL}/balance?wallet=${walletAddress}&mint=${tokenMint}`;
      console.log('[Background] Proxy URL:', proxyUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeout);
      console.log('[Background] Proxy HTTP status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Background] Proxy response:', JSON.stringify(data));

        if (data.success && typeof data.balance === 'number') {
          console.log('[Background] ===== TOKEN FOUND via Proxy =====');
          console.log('[Background] Balance:', data.balance);
          return { success: true, balance: data.balance };
        } else if (data.error) {
          console.log('[Background] Proxy error:', data.error);
        }
      }
    } catch (err) {
      console.log('[Background] Proxy error:', err.name, err.message);
    }
  }

  // Method 2: Try Solscan API (free, no auth)
  try {
    console.log('[Background] ----- Trying Solscan API -----');
    const solscanUrl = `https://api.solscan.io/account/tokens?account=${walletAddress}`;
    console.log('[Background] URL:', solscanUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(solscanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);
    console.log('[Background] Solscan HTTP status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[Background] Solscan response keys:', Object.keys(data));

      if (data.data && Array.isArray(data.data)) {
        console.log('[Background] Found', data.data.length, 'token accounts');

        const targetToken = data.data.find(t => t.tokenAddress === tokenMint);
        if (targetToken) {
          const balance = parseFloat(targetToken.tokenAmount?.uiAmount || targetToken.amount || 0);
          console.log('[Background] ===== TOKEN FOUND via Solscan =====');
          console.log('[Background] Balance:', balance);
          return { success: true, balance: balance };
        } else {
          console.log('[Background] Token not found in wallet via Solscan');
        }
      }
    }
  } catch (err) {
    console.log('[Background] Solscan error:', err.name, err.message);
  }

  // Method 3: Try direct RPC as fallback
  const rpcEndpoints = [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana'
  ];

  for (const rpcUrl of rpcEndpoints) {
    try {
      console.log('[Background] ----- Trying RPC:', rpcUrl, '-----');

      const requestBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: tokenMint },
          { encoding: 'jsonParsed' }
        ]
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[Background] RPC HTTP status:', response.status);

      if (!response.ok) continue;

      const data = await response.json();
      if (data.error) {
        console.log('[Background] RPC error:', JSON.stringify(data.error));
        continue;
      }

      const accountCount = data.result?.value?.length || 0;
      console.log('[Background] Token accounts found:', accountCount);

      if (accountCount > 0) {
        const tokenInfo = data.result.value[0].account.data.parsed.info;
        const balance = tokenInfo.tokenAmount.uiAmount || 0;
        console.log('[Background] ===== TOKEN FOUND via RPC =====');
        console.log('[Background] Balance:', balance);
        return { success: true, balance: balance };
      } else {
        return { success: true, balance: 0 };
      }
    } catch (err) {
      console.log('[Background] RPC error for', rpcUrl, ':', err.message);
      continue;
    }
  }

  console.log('[Background] ========== ALL METHODS FAILED ==========');
  return { error: 'All RPC endpoints failed' };
}
