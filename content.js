// Axiom Hourly Wage Widget - Content Script (v2 - Free Version)
// Features controlled by remote config from Cloudflare Worker
(function () {
  'use strict';

  // Remote config (loaded from Cloudflare Worker)
  let remoteConfig = {
    tokenGatingEnabled: false,
    autoSellEnabled: false,
    voiceJournalingEnabled: false,
    walletConnectEnabled: false,
    wageTokenMint: '4nswj3o1Lo9iWYvvRJxUD8vbCy9ay7QQoXYcncHNbonk',
    requiredBalance: 1000,
    version: '2.0.0',
    message: '$WAGE Tracker - Free Version'
  };

  // Configuration
  const MIN_WAGE = 15; // $15/hr baseline for comparison
  const COLOR_THRESHOLDS = {
    amazing: 100,  // Green: $100+/hr
    good: 50,      // Cyan: $50-100/hr
    okay: 25,      // Yellow: $25-50/hr
    bad: 0         // Orange: $0-25/hr, Red: negative
  };

  // Idle/ready messages (before session starts)
  const IDLE_MESSAGES = [
    "ready to grind",
    "ready for financial freedom",
    "ready to burn SOL",
    "let's get this bread",
    "time to cook",
    "bags loading...",
    "degening awaits",
    "wen moon?",
    "charts are calling",
    "money printer ready",
    "portfolio needs you",
    "SOL ain't gonna trade itself",
    "wagmi mode activated",
    "your hourly awaits",
    "time to stack sats... wait wrong chain",
    "the market is your oyster",
    "feeling bullish today?",
    "candles don't light themselves",
    "your PnL needs attention",
    "the trenches are calling"
  ];

  // Get random idle message
  function getIdleMessage() {
    return IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
  }

  // Tiered funny messages based on hourly wage performance
  const TIER_MESSAGES = {
    // Losing money badly (< -$50/hr)
    disaster: [
      "sir this is a casino",
      "have you tried not clicking?",
      "the chart can't hurt you if you close your eyes",
      "at least you have your health",
      "this is fine 🔥",
      "buying high selling low speedrun",
      "congrats you're the exit liquidity",
      "maybe try paper trading first",
      "the real profit was the lessons learned",
      "F in the chat",
      "your ancestors are disappointed",
      "wendy's application loading...",
      "ctrl+z doesn't work here chief"
    ],
    // Losing money (-$50 to $0/hr)
    losing: [
      "it's called volatility bro",
      "diamond hands they said",
      "zoom out... wait no zoom back in",
      "just a healthy pullback",
      "unrealized until you sell right?",
      "the dip before the dip",
      "catching knives is a skill",
      "at least gas fees are low",
      "we're still early... to losing",
      "this is just a tax write-off strategy",
      "pain is temporary... right?",
      "character development arc",
      "learning expensive lessons"
    ],
    // Below minimum wage ($0-15/hr)
    belowMin: [
      "put the fries in the bag bro",
      "would you like fries with that?",
      "walmart greeter arc incoming",
      "at least it's honest work",
      "the dollar menu calls to you",
      "have you considered a 9-5?",
      "uber eats driver money",
      "side hustle energy",
      "intern without the experience",
      "exposure doesn't pay rent",
      "doordash might pay better",
      "your boss at mcdonald's misses you",
      "technically still profit tho"
    ],
    // Around minimum wage ($15-30/hr)
    minWage: [
      "employee of the month material",
      "living wage achieved",
      "mom would be proud... maybe",
      "paying bills but barely",
      "the grind is real",
      "middle class speedrun",
      "healthcare? never heard of her",
      "at least you showed up",
      "participation trophy earnings",
      "the hustle continues",
      "survival mode activated",
      "ramen budget secured",
      "one green candle at a time"
    ],
    // Decent ($30-75/hr)
    decent: [
      "not bad for clicking buttons",
      "the wife's boyfriend approves",
      "rent money secured",
      "touching grass can wait",
      "getting somewhere now",
      "copium levels: manageable",
      "your portfolio thanks you",
      "keep this energy",
      "the algorithm favors you today",
      "bullish on your future",
      "the vibes are immaculate",
      "this is the way",
      "steady gains energy"
    ],
    // Good ($75-150/hr)
    good: [
      "okay we see you",
      "main character energy",
      "the charts whisper to you",
      "lawyer money without the degree",
      "your bags are pumping",
      "someone's been studying",
      "the force is strong with this one",
      "built different fr",
      "stonks only go up for you",
      "certified degen genius",
      "that's that me espresso",
      "the market bends to your will",
      "printer doing its thing"
    ],
    // Great ($150-500/hr)
    great: [
      "doctor money without the debt",
      "wife changing gains incoming",
      "the whales notice you",
      "generational wealth loading...",
      "teach me your ways sensei",
      "portfolio looking thicc",
      "financial advisor who?",
      "the SEC wants to know your location",
      "insider info? nah just skill",
      "your future lambo awaits",
      "mom can finally retire",
      "hedge funds hate this one trick",
      "you're in the matrix now"
    ],
    // Incredible ($500+/hr)
    incredible: [
      "hey bezos what's up",
      "is that you satoshi?",
      "retirement speedrun any%",
      "yacht shopping when?",
      "the IRS has entered the chat",
      "money printer go brrr",
      "you ARE the market",
      "tell elon I said hi",
      "touching grass is for poors",
      "new high score unlocked",
      "ascended to a higher plane",
      "congrats you broke the simulation",
      "billionaire mindset activated"
    ]
  };

  // Get random message for current tier
  function getTierMessage(hourlyWage) {
    let tier;
    if (hourlyWage < -50) tier = 'disaster';
    else if (hourlyWage < 0) tier = 'losing';
    else if (hourlyWage < 15) tier = 'belowMin';
    else if (hourlyWage < 30) tier = 'minWage';
    else if (hourlyWage < 75) tier = 'decent';
    else if (hourlyWage < 150) tier = 'good';
    else if (hourlyWage < 500) tier = 'great';
    else tier = 'incredible';

    const messages = TIER_MESSAGES[tier];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // $WAGE Token Configuration (controlled by remote config)
  // Token gating disabled by default - can be enabled via Cloudflare Worker
  const WAGE_TOKEN_MINT = '4nswj3o1Lo9iWYvvRJxUD8vbCy9ay7QQoXYcncHNbonk';
  const WAGE_TOTAL_SUPPLY = 1000000000; // 1 billion tokens
  const WAGE_PRO_THRESHOLD = 1000; // Will use remoteConfig.requiredBalance when token gating enabled

  // No trial system in v2 - all features controlled by remote config

  // State
  let state = {
    sessionActive: false,
    sessionStartTime: null,
    // Current token tracking
    currentTokenId: null,
    currentTokenName: null,
    currentTokenStartPNL: null,
    currentTokenLastPNL: null,  // Last known PNL for current token
    currentTokenStartTime: null,
    // PNL Stabilization - wait for Axiom to finish loading before locking in startPNL
    pnlStabilizing: false,      // True if we're waiting for PnL to stabilize
    stabilizationStart: null,   // When we started waiting for stabilization
    lastStablePNL: null,        // Last PnL value during stabilization
    // All token trades in this session
    sessionTrades: [],
    // SOL balance tracking (ground truth)
    startingSolBalance: null,
    currentSolPnl: null, // Current SOL-based P/L in USD
    // Active trade time tracking (only count time when holding)
    completedTradeTime: 0, // Milliseconds spent in completed trades
    // UI state
    widgetPosition: { x: null, y: null },
    widgetSize: { width: 310, height: null },
    minimized: false,
    docked: false,
    dailyGoal: 100,
    sessionHistory: [],
    settingsOpen: false,
    // Voice Journal settings
    openaiApiKey: '',
    voiceRecordingEnabled: false,
    // Auto-sell when session goal is hit
    autoSellOnGoal: false,
    // Journal entries (stored separately to avoid bloating main state)
    journalEntries: [],
    // $WAGE Token Ecosystem (disabled in v2 free version)
    walletConnected: false,
    walletAddress: null,
    wageBalance: 0,
    wageTier: 'free' // Always 'free' in v2 unless token gating enabled via remote config
  };

  // Voice recording state (not persisted)
  // Uses free browser Speech Recognition API (no API costs!)
  let voiceRecorder = {
    recognition: null,
    isRecording: false,
    currentTokenTranscript: '', // Accumulated transcript for current token
    restartTimeout: null
  };

  // Calculate total time spent actively holding positions (in hours)
  function getActiveTradeHours() {
    // Sum of all completed trades' durations
    const completedTime = state.sessionTrades.reduce((sum, t) => {
      return sum + (t.endTime - t.startTime);
    }, 0);

    // Add current trade's duration if we're in one
    let currentTradeTime = 0;
    if (state.currentTokenId && state.currentTokenStartTime) {
      currentTradeTime = Date.now() - state.currentTokenStartTime;
    }

    const totalMs = completedTime + currentTradeTime;
    return totalMs / 3600000; // Convert to hours
  }

  // Debug log
  let debugLog = [];
  const MAX_DEBUG_LINES = 100;

  function debug(msg) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    debugLog.push(line);
    if (debugLog.length > MAX_DEBUG_LINES) {
      debugLog.shift();
    }
    // console.log('[AxiomWage]', msg);
  }

  // ============================================
  // REMOTE CONFIG & ACCESS CONTROL (v2)
  // ============================================

  // Load remote config from Cloudflare Worker
  async function loadRemoteConfig() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getConfig' }, resolve);
      });
      if (response && !response.error) {
        remoteConfig = { ...remoteConfig, ...response };
        debug(`Remote config loaded: ${JSON.stringify(remoteConfig)}`);
      }
    } catch (err) {
      debug(`Remote config error: ${err.message}, using defaults`);
    }
    return remoteConfig;
  }

  // Check if user has PRO access (v2: based on remote config)
  function isPro() {
    // If token gating is disabled, everyone is "PRO" (has full access)
    if (!remoteConfig.tokenGatingEnabled) {
      return true;
    }
    // If token gating is enabled, check wallet balance
    return state.walletConnected && state.wageBalance >= remoteConfig.requiredBalance;
  }

  // Check if user can use the app (v2: always true unless token gating enabled)
  function canUseApp() {
    return isPro();
  }

  // Check if a specific feature is enabled
  function isFeatureEnabled(feature) {
    switch (feature) {
      case 'autosell': return remoteConfig.autoSellEnabled;
      case 'voice': return remoteConfig.voiceJournalingEnabled;
      case 'wallet': return remoteConfig.walletConnectEnabled;
      default: return true;
    }
  }

  // ============================================
  // VOICE JOURNAL - Free Browser Speech Recognition
  // ============================================

  function startVoiceRecording() {
    // Check if Speech Recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      debug('Speech Recognition not supported in this browser');
      alert('Speech Recognition is not supported in this browser. Please use Chrome.');
      return false;
    }

    try {
      voiceRecorder.recognition = new SpeechRecognition();
      voiceRecorder.recognition.continuous = true;
      voiceRecorder.recognition.interimResults = true;
      voiceRecorder.recognition.lang = 'en-US';

      voiceRecorder.recognition.onstart = () => {
        voiceRecorder.isRecording = true;
        updateRecordingIndicator(false); // Green MIC - listening
        debug('Speech recognition started - listening...');
      };

      voiceRecorder.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          voiceRecorder.currentTokenTranscript += ' ' + finalTranscript.trim();
          debug(`Transcribed: "${finalTranscript.trim().substring(0, 50)}..."`);
          updateRecordingIndicator(true); // Red REC - captured speech

          // Flash back to green after showing red
          setTimeout(() => {
            if (voiceRecorder.isRecording) {
              updateRecordingIndicator(false);
            }
          }, 500);
        }

        if (interimTranscript) {
          updateRecordingIndicator(true); // Red REC while speaking
        }
      };

      voiceRecorder.recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          // This is normal - just no speech detected, keep listening
          return;
        }
        debug(`Speech recognition error: ${event.error}`);

        // Try to restart on recoverable errors
        if (event.error === 'network' || event.error === 'aborted') {
          restartRecognition();
        }
      };

      voiceRecorder.recognition.onend = () => {
        // Auto-restart if we're still supposed to be recording
        if (voiceRecorder.isRecording) {
          restartRecognition();
        } else {
          updateRecordingIndicator(false);
          debug('Speech recognition stopped');
        }
      };

      voiceRecorder.recognition.start();
      return true;
    } catch (err) {
      debug(`Failed to start speech recognition: ${err.message}`);
      // console.error('Speech recognition error:', err);
      return false;
    }
  }

  function restartRecognition() {
    if (!voiceRecorder.isRecording) return;

    // Clear any existing restart timeout
    if (voiceRecorder.restartTimeout) {
      clearTimeout(voiceRecorder.restartTimeout);
    }

    // Restart after a brief delay
    voiceRecorder.restartTimeout = setTimeout(() => {
      if (voiceRecorder.isRecording && voiceRecorder.recognition) {
        try {
          voiceRecorder.recognition.start();
          debug('Speech recognition restarted');
        } catch (err) {
          // Already started, ignore
        }
      }
    }, 100);
  }

  function stopVoiceRecording() {
    voiceRecorder.isRecording = false;

    if (voiceRecorder.restartTimeout) {
      clearTimeout(voiceRecorder.restartTimeout);
      voiceRecorder.restartTimeout = null;
    }

    if (voiceRecorder.recognition) {
      try {
        voiceRecorder.recognition.stop();
      } catch (err) {
        // Already stopped, ignore
      }
      voiceRecorder.recognition = null;
    }

    updateRecordingIndicator(false);
    debug('Voice recording stopped');
  }

  function updateRecordingIndicator(isRecording) {
    const quickBtn = widget?.querySelector('.voice-quick-btn');

    // Sync quick button state
    if (quickBtn) {
      if (voiceRecorder.isRecording) {
        quickBtn.classList.add('recording');
        quickBtn.innerHTML = '<span class="mic-label">REC</span> 🔴';
      } else {
        quickBtn.classList.remove('recording');
        quickBtn.innerHTML = '<span class="mic-label">MIC</span> ⏺';
      }
    }
  }

  // ============================================
  // VOICE JOURNAL - Trade Scraping from Orderbook
  // ============================================

  function scrapeUserTrades() {
    const trades = [];

    // Find all elements with the crown "👑 YOU" badge
    const youBadges = document.querySelectorAll('span.text-yellow-500');

    youBadges.forEach(badge => {
      if (!badge.textContent.includes('👑 YOU')) return;

      // Find the parent trade row
      const row = badge.closest('.flex.flex-row.w-full');
      if (!row) return;

      try {
        // Get price - look for text-increase (buy) or text-decrease (sell)
        const priceEl = row.querySelector('span.text-increase, span.text-decrease');
        const price = priceEl ? priceEl.textContent.replace('$', '').trim() : null;
        const isBuy = priceEl?.classList.contains('text-increase');

        // Get amount - inside text-textSecondary
        const amountEl = row.querySelector('.text-textSecondary span');
        const amount = amountEl ? amountEl.textContent.trim() : null;

        // Get time - from the solscan link
        const timeLink = row.querySelector('a[href*="solscan.io"]');
        const timeAgo = timeLink ? timeLink.textContent.trim() : null;
        const txHash = timeLink ? timeLink.href.split('/tx/')[1] : null;

        if (price && amount) {
          trades.push({
            type: isBuy ? 'buy' : 'sell',
            price: price,
            amount: amount,
            timeAgo: timeAgo,
            txHash: txHash,
            timestamp: Date.now()
          });
        }
      } catch (e) {
        // console.warn('Error parsing trade row:', e);
      }
    });

    return trades;
  }

  // ============================================
  // VOICE JOURNAL - LLM Processing
  // ============================================

  async function processJournalWithLLM(tokenName, transcript, trades, tradeProfit) {
    if (!state.openaiApiKey || !transcript.trim()) {
      return null;
    }

    const tradesText = trades.map(t =>
      `${t.type.toUpperCase()} ${t.amount} at ${t.price} (${t.timeAgo})`
    ).join('\n');

    const profitStr = tradeProfit >= 0 ? `+$${tradeProfit.toFixed(2)}` : `-$${Math.abs(tradeProfit).toFixed(2)}`;

    const prompt = `You are a trading coach. Analyze this trade and be CONCISE. Use the trader's exact words, don't add fluff.

TOKEN: ${tokenName} | PnL: ${profitStr}

VOICE NOTES:
${transcript}

TRADES:
${tradesText || 'No trade data'}

Write a SHORT journal entry in this format:

## ${tokenName} — ${profitStr}

**Why I entered:** [1-2 sentences max from their notes]

**What I saw:** [Brief bullet points of signals/observations they mentioned]

**Lesson:** [One actionable takeaway, max 1 sentence]

Keep it SHORT. No generic advice. Only use details they actually mentioned.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        debug(`ChatGPT API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      // Return markdown content directly
      return { markdown: content };
    } catch (err) {
      debug(`LLM processing error: ${err.message}`);
      return null;
    }
  }

  // Save journal entry for a completed trade
  async function saveJournalEntry(trade) {
    const transcript = voiceRecorder.currentTokenTranscript.trim();
    const scrapedTrades = scrapeUserTrades();

    // Only process with LLM if we have a transcript AND an API key
    // Otherwise just save the raw transcript (still useful!)
    let processedNotes = null;
    if (transcript && state.openaiApiKey) {
      debug('Processing notes with LLM...');
      processedNotes = await processJournalWithLLM(trade.tokenName, transcript, scrapedTrades, trade.profit);
    } else if (transcript) {
      debug('Saving raw transcript (no API key for LLM processing)');
    }

    const entry = {
      id: Date.now(),
      tokenId: trade.tokenId,
      tokenName: trade.tokenName,
      timestamp: Date.now(),
      trade: {
        startPNL: trade.startPNL,
        endPNL: trade.endPNL,
        profit: trade.profit,
        startTime: trade.startTime,
        endTime: trade.endTime
      },
      scrapedTrades: scrapedTrades,
      rawTranscript: transcript,
      processedNotes: processedNotes
    };

    state.journalEntries.push(entry);

    // Keep only last 100 entries to manage storage
    if (state.journalEntries.length > 100) {
      state.journalEntries = state.journalEntries.slice(-100);
    }

    saveState();
    debug(`Journal entry saved for ${trade.tokenName}`);

    // Clear transcript for next token
    voiceRecorder.currentTokenTranscript = '';
  }

  // ============================================
  // $WAGE TOKEN ECOSYSTEM - Phantom Wallet Integration
  // ============================================

  // Wallet bridge communication
  // wallet-bridge.js runs in MAIN world and handles Phantom access
  let pageScriptReady = false;

  // Listen for ready signal from wallet-bridge.js
  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'axiom-wage-page' && event.data.action === 'ready') {
      pageScriptReady = true;
      debug('Wallet bridge ready for Phantom access');
    }
  });

  // Message the wallet bridge and wait for response
  function messagePageScript(action, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(2);

      const handler = (event) => {
        if (event.source !== window) return;
        if (!event.data || event.data.source !== 'axiom-wage-page') return;
        if (event.data.id !== id) return;

        window.removeEventListener('message', handler);
        clearTimeout(timer);
        resolve(event.data.result);
      };

      const timer = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error('Timeout waiting for page script'));
      }, timeout);

      window.addEventListener('message', handler);
      window.postMessage({ source: 'axiom-wage-widget', action, id }, '*');
    });
  }

  // Check if Phantom wallet is available
  async function isPhantomAvailable() {
    try {
      const result = await messagePageScript('checkPhantom', 2000);
      return result === true;
    } catch (err) {
      debug('Failed to check Phantom: ' + err.message);
      return false;
    }
  }

  // Connect to Phantom wallet
  async function connectWallet() {
    const hasPhantom = await isPhantomAvailable();
    if (!hasPhantom) {
      debug('Phantom wallet not found - please install Phantom extension');
      alert('Phantom wallet not found!\n\nPlease install Phantom from phantom.app to connect your wallet.');
      return false;
    }

    try {
      debug('Connecting to Phantom wallet...');
      const result = await messagePageScript('connectWallet', 60000); // 60s for user approval

      if (!result.success) {
        throw new Error(result.error || 'Connection failed');
      }

      const publicKey = result.publicKey;
      state.walletConnected = true;
      state.walletAddress = publicKey;
      debug(`Wallet connected: ${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`);

      // Check $WAGE token balance
      await checkWageBalance();

      saveState();
      updateWalletUI();
      return true;
    } catch (err) {
      debug(`Wallet connection failed: ${err.message}`);
      return false;
    }
  }

  // Disconnect wallet
  async function disconnectWallet() {
    try {
      await messagePageScript('disconnectWallet', 5000);
    } catch (err) {
      debug(`Disconnect error: ${err.message}`);
    }

    state.walletConnected = false;
    state.walletAddress = null;
    state.wageBalance = 0;
    state.wageTier = 'none';
    saveState();
    updateWalletUI();
    debug('Wallet disconnected');
  }

  // Check $WAGE token balance using Solana RPC
  async function checkWageBalance() {
    if (!state.walletAddress) {
      debug('checkWageBalance: No wallet address');
      return;
    }

    debug(`Checking $WAGE balance for ${state.walletAddress.substring(0, 8)}...`);
    debug(`Looking for token mint: ${WAGE_TOKEN_MINT}`);

    // TESTING MODE: Bypass RPC and grant PRO when wallet is connected
    if (TESTING_MODE) {
      debug('TESTING MODE: Granting PRO access (wallet connected)');
      state.wageBalance = 1000000; // Fake balance for testing
      state.wageTier = 'pro';
      saveState();
      updateWalletUI();
      return;
    }

    // Use background script to check balance (bypasses CORS)
    try {
      debug('========== CHECKING TOKEN BALANCE ==========');
      debug(`Wallet: ${state.walletAddress}`);
      debug(`Token mint: ${WAGE_TOKEN_MINT}`);
      debug(`PRO threshold: ${WAGE_PRO_THRESHOLD}`);
      debug('Sending request to background script...');

      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'checkWageBalance',
            walletAddress: state.walletAddress,
            tokenMint: WAGE_TOKEN_MINT
          },
          (response) => {
            if (chrome.runtime.lastError) {
              debug(`Background script error: ${chrome.runtime.lastError.message}`);
              resolve({ error: chrome.runtime.lastError.message });
            } else {
              debug(`Background response received: ${JSON.stringify(response)}`);
              resolve(response || { error: 'No response from background' });
            }
          }
        );
      });

      debug('========== BALANCE RESULT ==========');
      debug(`Result: ${JSON.stringify(result)}`);

      if (result.error) {
        debug(`❌ Balance check failed: ${result.error}`);
        state.wageBalance = 0;
        state.wageTier = 'free';
      } else if (result.success) {
        const balance = result.balance || 0;
        state.wageBalance = balance;

        debug(`✓ Token balance: ${balance}`);
        debug(`✓ Raw amount: ${result.raw || 'N/A'}`);
        debug(`✓ Decimals: ${result.decimals || 'N/A'}`);
        debug(`✓ PRO threshold: ${WAGE_PRO_THRESHOLD}`);
        debug(`✓ Has PRO: ${balance >= WAGE_PRO_THRESHOLD}`);

        if (balance >= WAGE_PRO_THRESHOLD) {
          state.wageTier = 'pro';
          debug(`🎉 PRO TIER UNLOCKED! Balance: ${formatNumber(balance)}`);
        } else {
          state.wageTier = 'free';
          debug(`Free tier - need ${formatNumber(WAGE_PRO_THRESHOLD - balance)} more for PRO`);
        }
      }
      debug('====================================');
    } catch (err) {
      debug(`Balance check error: ${err.message}`);
      state.wageBalance = 0;
      state.wageTier = 'free';
    }

    saveState();
    updateWalletUI();
  }

  // Format large numbers with K/M suffix
  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  // Update wallet-related UI elements
  function updateWalletUI() {
    const walletBtn = widget?.querySelector('.wallet-connect-btn');
    const walletStatus = widget?.querySelector('.wallet-status');
    const flexBtn = widget?.querySelector('.flex-btn');
    const tierBadge = widget?.querySelector('.tier-badge');

    if (walletBtn) {
      if (state.walletConnected) {
        const shortAddr = state.walletAddress
          ? `${state.walletAddress.substring(0, 4)}...${state.walletAddress.substring(state.walletAddress.length - 4)}`
          : 'Connected';
        walletBtn.textContent = shortAddr;
        walletBtn.classList.add('connected');
        walletBtn.title = 'Click to disconnect';
      } else {
        walletBtn.textContent = 'Connect Wallet';
        walletBtn.classList.remove('connected');
        walletBtn.title = 'Connect Phantom wallet';
      }
    }

    if (walletStatus) {
      if (state.walletConnected && state.wageBalance > 0) {
        walletStatus.innerHTML = `<span class="wage-balance">${formatNumber(state.wageBalance)} $WAGE</span>`;
        walletStatus.style.display = 'flex';
      } else {
        walletStatus.style.display = 'none';
      }
    }

    // Hide the old tier badge (we use PRO banner now)
    if (tierBadge) {
      tierBadge.style.display = 'none';
    }

    // Update PRO banner
    const proBanner = widget?.querySelector('.pro-banner');
    if (proBanner) {
      proBanner.style.display = isPro() ? 'flex' : 'none';
    }

    // v2: No trial indicator - free version

    // FLEX button - always available in v2 (show when session is active with profit)
    if (flexBtn) {
      // Show FLEX button when session is active - visibility will update based on profit
      flexBtn.style.display = state.sessionActive ? 'block' : 'none';
    }

    // Update wage-gated features UI
    updateWageGatedUI();
  }

  // Check if $WAGE PRO features are available (Journal, Auto-sell)
  // PRO = has WAGE_PRO_THRESHOLD tokens or more
  function hasWageAccess() {
    return isPro();
  }

  // v2: Update UI for features (no token gating in free version)
  function updateWageGatedUI() {
    // v2: Features controlled by remote config, not token gating
    // Update PRO banner visibility (hidden in v2 free version)
    updateProBanner();
    debug(`v2 Free version - all basic features enabled`);
  }

  // Update PRO banner in header (hidden in v2)
  function updateProBanner() {
    const proBanner = widget?.querySelector('.pro-banner');
    if (proBanner) {
      // v2: Only show PRO banner if token gating is enabled via remote config
      proBanner.style.display = (remoteConfig.tokenGatingEnabled && isPro()) ? 'flex' : 'none';
    }
  }

  // v2: No trial UI needed

  // v2: Show feature coming soon message instead of upgrade prompt
  function showUpgradePrompt() {
    // v2: This is now a "feature coming soon" prompt, not a trial expired prompt
    const statusText = widget?.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = 'Premium features coming soon!';
      setTimeout(() => {
        if (!state.sessionActive) statusText.textContent = getIdleMessage();
      }, 3000);
    }
  }

  // FLEX vibe messages by performance tier
  const FLEX_VIBES = {
    printing: [
      "PRINTING MONEY 🖨️💰",
      "ABSOLUTELY COOKING 🔥",
      "GENERATIONAL WEALTH LOADING 📈",
      "IS THIS LEGAL?? 💸",
      "CANT STOP WONT STOP 🚀"
    ],
    winning: [
      "WE ARE SO BACK 📈",
      "THE CHARTS SPEAK TO ME 🧠",
      "CALLED IT 📞",
      "EZ MONEY 💵",
      "TODAY WAS A GOOD DAY ☀️"
    ],
    grinding: [
      "GRINDING 💪",
      "STACKING SATS... WAIT WRONG CHAIN 🤝",
      "SLOW AND STEADY 🐢",
      "BRICK BY BRICK 🧱",
      "HONEST WORK 👷"
    ],
    surviving: [
      "STILL HERE 🫡",
      "LEARNING EXPERIENCE 📚",
      "DOWN BAD BUT NOT OUT 💎",
      "TOMORROW WE FEAST 🍽️",
      "ITS CALLED VOLATILITY BRO 📊"
    ]
  };

  // Get random flex vibe based on hourly wage
  function getFlexVibe(hourlyWage) {
    let tier;
    if (hourlyWage >= 500) tier = 'printing';
    else if (hourlyWage >= 100) tier = 'winning';
    else if (hourlyWage >= 0) tier = 'grinding';
    else tier = 'surviving';

    const vibes = FLEX_VIBES[tier];
    return vibes[Math.floor(Math.random() * vibes.length)];
  }

  // FLEX: Share PnL to X (Twitter)
  function flexPnL() {
    // Get current session stats
    const sessionProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
    const todayProfit = getTodayEarnings() + (state.sessionActive ? sessionProfit : 0);
    const activeHours = getActiveTradeHours();
    const hourlyWage = activeHours > 0 ? sessionProfit / activeHours : 0;

    // Format today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Build tweet text
    const profitText = sessionProfit >= 0 ? `+${formatCurrency(sessionProfit)}` : formatCurrency(sessionProfit);
    const hourlyText = hourlyWage >= 0 ? `+${formatCurrency(hourlyWage)}/hr` : `${formatCurrency(hourlyWage)}/hr`;
    const vibeText = getFlexVibe(hourlyWage);

    // Extract the emoji from the end of vibe text to use on both sides
    const emojiMatch = vibeText.match(/[\p{Emoji}]+$/u);
    const vibeEmoji = emojiMatch ? emojiMatch[0] : '💰';
    const vibeTextClean = vibeText.replace(/[\p{Emoji}]+$/u, '').trim();

    // TODO: Update @WageTracker to community handle when ready
    const tweetText = `${vibeEmoji} ${vibeTextClean} ${vibeEmoji}

Session: ${profitText}
Hourly: ${hourlyText}

Tracking my $WAGE 💰`;

    // Open Twitter/X share dialog
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');

    debug('FLEX posted to X!');
  }

  // Simple markdown to HTML converter for journal entries
  function simpleMarkdownToHtml(md) {
    if (!md) return '';
    return md
      // Escape HTML first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Blockquotes (for rules)
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Bullet points
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      // Wrap in paragraph
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br>/g, '<p>')
      .replace(/<br><\/p>/g, '</p>');
  }

  // Render journal entries UI
  function renderJournalEntries() {
    const container = widget.querySelector('.journal-entries');
    if (!container) return;

    if (state.journalEntries.length === 0) {
      container.innerHTML = '<div class="journal-empty">No journal entries yet. Enable voice recording and trade to create entries.</div>';
      return;
    }

    // Sort by most recent first
    const entries = [...state.journalEntries].sort((a, b) => b.timestamp - a.timestamp);

    container.innerHTML = entries.map(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Show actual Axiom PNL (what's displayed on screen) not calculated trade profit
      const axiomPnl = entry.trade.endPNL;
      const tradePnl = entry.trade.profit;
      const profitClass = axiomPnl >= 0 ? 'profit-positive' : 'profit-negative';
      const profitStr = formatCurrency(axiomPnl);
      const tradeChange = tradePnl >= 0 ? `+${formatCurrency(tradePnl)}` : formatCurrency(tradePnl);

      // Process notes if available
      let notesHtml = '';
      if (entry.processedNotes && entry.processedNotes.markdown) {
        // Convert markdown to simple HTML
        const markdown = entry.processedNotes.markdown;
        const htmlContent = simpleMarkdownToHtml(markdown);
        notesHtml = `<div class="journal-notes journal-markdown">${htmlContent}</div>`;
      } else if (entry.processedNotes) {
        // Legacy JSON format
        const notes = entry.processedNotes;
        notesHtml = `
          <div class="journal-notes">
            ${notes.summary ? `<div class="note-section"><strong>Summary:</strong> ${notes.summary}</div>` : ''}
            ${notes.whyEntry ? `<div class="note-section"><strong>Entry:</strong> ${notes.whyEntry}</div>` : ''}
            ${notes.whyExit ? `<div class="note-section"><strong>Exit:</strong> ${notes.whyExit}</div>` : ''}
            ${notes.mistake ? `<div class="note-section lesson"><strong>Improve:</strong> ${notes.mistake}</div>` : ''}
          </div>
        `;
      } else if (entry.rawTranscript) {
        notesHtml = `<div class="journal-notes"><div class="note-section raw">"${entry.rawTranscript}"</div></div>`;
      }

      // Scraped trades
      let tradesHtml = '';
      if (entry.scrapedTrades && entry.scrapedTrades.length > 0) {
        tradesHtml = `
          <div class="journal-trades">
            ${entry.scrapedTrades.map(t =>
          `<div class="scraped-trade ${t.type}">${t.type.toUpperCase()} ${t.amount} @ ${t.price}</div>`
        ).join('')}
          </div>
        `;
      }

      const tradeChangeClass = tradePnl >= 0 ? 'profit-positive' : 'profit-negative';

      return `
        <div class="journal-entry" data-id="${entry.id}">
          <div class="journal-entry-header">
            <span class="journal-token">${entry.tokenName}</span>
            <span class="${profitClass}">${profitStr}</span>
          </div>
          <div class="journal-entry-time">${date} ${time} <span class="trade-change ${tradeChangeClass}">(${tradeChange} this trade)</span></div>
          ${tradesHtml}
          ${notesHtml}
        </div>
      `;
    }).join('');
  }

  let updateInterval = null;
  let observer = null;
  let pnlElement = null;
  let lastPnlUrl = null; // Track URL to detect page changes

  // DOM References
  let widget = null;
  let dockedWidget = null;
  let wageValue = null;
  let elapsedValue = null;
  let currentPnlValue = null;
  let sessionPnlValue = null;
  let statusDot = null;
  let statusText = null;
  let startBtn = null;
  let minWageMultiple = null;
  let tierMessage = null;
  let sessionGoalProgress = null;
  let sessionGoalText = null;
  let dailyGoalProgress = null;
  let dailyGoalText = null;
  let historyContainer = null;
  let tradesToggle = null;
  let tradesBreakdown = null;
  let lastTierMessage = null; // Will be set to random idle message on init
  let lastTier = null;
  let lastTierChangeTime = 0; // Timestamp of last tier message change
  const TIER_MESSAGE_COOLDOWN = 30000; // 30 seconds minimum between message changes
  let goalNotificationShown = false; // Track if CASH OUT notification was shown this session

  // Initialize
  function init() {
    debug('Widget v2 initializing...');
    // wallet-bridge.js is loaded automatically via manifest with world: "MAIN"

    // Load remote config first, then restore state
    loadRemoteConfig().then(() => {
      debug(`Remote config: tokenGating=${remoteConfig.tokenGatingEnabled}, autoSell=${remoteConfig.autoSellEnabled}`);

      return restoreState();
    }).then(() => {
      cleanOldHistory();
      injectWidget();
      debug('Widget injected');

      // Update UI based on remote config
      updateWalletUI();

      // If session was active, restore it
      if (state.sessionActive && state.sessionStartTime) {
        startUpdateLoop();
        startBtn.textContent = 'Stop Session';
        startBtn.classList.remove('btn-primary');
        startBtn.classList.add('btn-danger');
        statusDot.classList.add('active');
        statusText.textContent = state.currentTokenId ? 'Tracking active' : 'Waiting for trade...';
      } else {
        // Not in session - check if PNL is available
        waitForPNLElement();
      }
    });
  }

  // Restore state from storage
  async function restoreState() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['axiomWageState'], (result) => {
        if (result.axiomWageState) {
          // Only restore persistent settings, NOT session-specific data
          // This prevents stale session data from showing -$20 on startup
          const saved = result.axiomWageState;

          // Restore settings and history (persistent data)
          state.widgetPosition = saved.widgetPosition || state.widgetPosition;
          state.widgetSize = saved.widgetSize || state.widgetSize;
          state.minimized = saved.minimized || false;
          state.docked = saved.docked || false;
          state.dailyGoal = saved.dailyGoal || 100;
          state.sessionHistory = saved.sessionHistory || [];
          state.openaiApiKey = saved.openaiApiKey || '';
          state.voiceRecordingEnabled = saved.voiceRecordingEnabled || false;
          state.autoSellOnGoal = saved.autoSellOnGoal || false;
          state.journalEntries = saved.journalEntries || [];
          // Wallet state (persisted)
          state.walletConnected = saved.walletConnected || false;
          state.walletAddress = saved.walletAddress || null;
          state.wageBalance = saved.wageBalance || 0;
          state.wageTier = saved.wageTier || 'none';

          // Restore session state if it was active (survives page refresh)
          state.sessionActive = saved.sessionActive || false;
          state.sessionStartTime = saved.sessionStartTime || null;
          state.sessionTrades = saved.sessionTrades || [];
          state.startingSolBalance = saved.startingSolBalance || null;
          state.completedTradeTime = saved.completedTradeTime || 0;

          debug(`=== SESSION RESTORE ===`);
          debug(`sessionActive: ${state.sessionActive}`);
          debug(`sessionStartTime: ${state.sessionStartTime ? new Date(state.sessionStartTime).toLocaleString() : 'null'}`);
          debug(`sessionTrades count: ${state.sessionTrades.length}`);
          if (state.sessionTrades.length > 0) {
            const tradesProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
            debug(`sessionTrades total profit: $${tradesProfit.toFixed(2)}`);
            state.sessionTrades.forEach((t, i) => {
              debug(`  Trade ${i + 1}: ${t.tokenName} = $${t.profit.toFixed(2)}`);
            });
          }

          // Clear current token tracking on refresh (will re-detect on page load)
          // This prevents stale PNL values from corrupting the next trade
          state.currentTokenId = null;
          state.currentTokenName = null;
          state.currentTokenStartPNL = null;
          state.currentTokenLastPNL = null;
          state.currentTokenStartTime = null;
          state.currentSolPnl = null;
          // Clear stabilization state
          state.pnlStabilizing = false;
          state.stabilizationStart = null;
          state.lastStablePNL = null;

          debug(`Restored settings: DailyGoal=$${state.dailyGoal}, History=${state.sessionHistory.length} sessions`);
          debug(`Current token tracking cleared (will re-detect)`);

          // Save the cleaned state
          saveState();
        }

        // v2: No trial data to load
        resolve();
      });
    });
  }

  // Save state to storage
  function saveState() {
    chrome.storage.local.set({ axiomWageState: state });
  }

  // Clean history older than 7 days and validate profit values
  function cleanOldHistory() {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const originalCount = state.sessionHistory.length;
    const originalTotal = state.sessionHistory.reduce((sum, s) => sum + (s.totalProfit || s.profit || 0), 0);

    state.sessionHistory = state.sessionHistory.filter(s => {
      // Remove old entries
      if (s.endTime <= weekAgo) return false;

      // Validate session has reasonable profit
      const profit = s.totalProfit !== undefined ? s.totalProfit : (s.profit || 0);

      // If session has trades, recalculate profit from them
      if (s.trades && s.trades.length > 0) {
        const calculatedProfit = s.trades.reduce((sum, t) => sum + (t.profit || 0), 0);
        // If there's a big mismatch, fix it
        if (Math.abs(calculatedProfit - profit) > 1) {
          debug(`Fixing session profit mismatch: stored=${profit.toFixed(2)}, calculated=${calculatedProfit.toFixed(2)}`);
          s.totalProfit = calculatedProfit;
        }
      }

      // Reject sessions with extreme profit values (>$1000 either way)
      const finalProfit = s.totalProfit !== undefined ? s.totalProfit : (s.profit || 0);
      if (Math.abs(finalProfit) > 1000) {
        debug(`Removing session with extreme profit: ${finalProfit.toFixed(2)}`);
        return false;
      }

      return true;
    });

    if (state.sessionHistory.length !== originalCount) {
      const newTotal = state.sessionHistory.reduce((sum, s) => sum + (s.totalProfit || s.profit || 0), 0);
      debug(`Cleaned sessionHistory: ${originalCount} -> ${state.sessionHistory.length} sessions, $${originalTotal.toFixed(2)} -> $${newTotal.toFixed(2)}`);
    }

    saveState();
  }

  // Get today's total earnings from history (token-based P/L)
  function getTodayEarnings() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    return state.sessionHistory
      .filter(s => s.endTime >= todayTimestamp)
      .reduce((sum, s) => sum + (s.totalProfit !== undefined ? s.totalProfit : (s.profit || 0)), 0);
  }

  // Get current token identifier from URL
  function getCurrentTokenId() {
    const url = window.location.href;
    // Extract token ID from URLs like /meme/TOKEN_ID or /token/TOKEN_ID
    const match = url.match(/\/(meme|token|trade)\/([^?\/]+)/);
    return match ? match[2] : null;
  }

  // Get current holding/position size (to check if we're actively holding)
  function getCurrentHolding() {
    // Look for the "Holding" label with text-textTertiary class (Axiom specific)
    const holdingLabels = document.querySelectorAll('span.text-textTertiary');
    for (const label of holdingLabels) {
      if (label.textContent.trim().toLowerCase() === 'holding') {
        // Found the label, get the parent container
        const container = label.closest('.flex.flex-col');
        if (container) {
          // Find the value span with text-textSecondary class containing the USD value
          const valueSpan = container.querySelector('span.text-textSecondary');
          if (valueSpan) {
            const valueText = valueSpan.textContent.trim();
            // Parse the USD value (e.g., "$0", "$12.34")
            const value = parseFloat(valueText.replace(/[$,]/g, ''));
            if (!isNaN(value)) {
              return value;
            }
          }
        }
      }
    }

    // Fallback: Look for any span with "Holding" text
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      const text = span.textContent.trim().toLowerCase();
      if (text === 'holding' || text === 'holdings') {
        const container = span.closest('.flex.flex-col') || span.parentElement;
        if (container) {
          const valueSpans = container.querySelectorAll('span');
          for (const vs of valueSpans) {
            const valueText = vs.textContent.trim();
            if (valueText.match(/^\$[\d,]+\.?\d*$/)) {
              const value = parseFloat(valueText.replace(/[$,]/g, ''));
              if (!isNaN(value)) {
                return value;
              }
            }
          }
        }
      }
    }

    // If we can't find holding info, return null (unknown)
    return null;
  }

  // Check if user has an active position
  function hasActivePosition() {
    const holding = getCurrentHolding();
    // If we can't detect holding, assume there might be one (don't block tracking)
    if (holding === null) return true;
    // Only return true if holding is greater than 0
    return holding > 0;
  }

  // Get token name/ticker from the page
  function getTokenName() {
    // Method 1: Find the specific Axiom token name element (truncate class with max-width style)
    // But exclude elements that contain PNL arrows or dollar amounts
    const truncateElements = document.querySelectorAll('.truncate');
    for (const el of truncateElements) {
      const style = el.getAttribute('style') || '';
      // Look for the element with max-width calc (this is the token name)
      if (style.includes('max-width') && el.textContent.trim().length > 0) {
        let name = el.textContent.trim();
        // Make sure it's not a number or common UI text
        if (name && !name.startsWith('$') && !name.match(/^[\d.,]+$/)) {
          // Remove any PNL arrows and values that might be included
          // Pattern: ↑ $5.71K or ↓ $2.34 etc
          name = name.replace(/[↑↓]\s*\$[\d.,]+[KMB]?/gi, '').trim();
          // Also remove just arrows
          name = name.replace(/[↑↓]/g, '').trim();
          if (name.length > 0) {
            return name;
          }
        }
      }
    }

    // Method 2: Look for div with specific Axiom classes
    const axiomNameEl = document.querySelector('.min-w-0.whitespace-nowrap.overflow-hidden.truncate');
    if (axiomNameEl) {
      let name = axiomNameEl.textContent.trim();
      // Clean up PNL arrows and values
      name = name.replace(/[↑↓]\s*\$[\d.,]+[KMB]?/gi, '').trim();
      name = name.replace(/[↑↓]/g, '').trim();
      if (name && name.length > 0) {
        return name;
      }
    }

    // Method 3: Try to get from page title
    const pageTitle = document.title;
    // Axiom titles might be like "Token Name | Axiom" or similar
    const titleParts = pageTitle.split(/[|\-–]/);
    if (titleParts.length > 0) {
      const name = titleParts[0].trim();
      if (name && name.length > 0 && name.length < 30) {
        return name;
      }
    }

    // Method 4: Get shortened token address from URL as fallback
    const tokenId = getCurrentTokenId();
    if (tokenId) {
      return tokenId.substring(0, 6) + '...';
    }

    return 'Unknown';
  }

  // Get SOL balance from the page
  function getSolBalance() {
    // Look for the SOL balance element (text-[14px] font-semibold text-textPrimary)
    const balanceElements = document.querySelectorAll('span.text-textPrimary');
    for (const el of balanceElements) {
      const text = el.textContent.trim();
      // Look for a number that could be SOL balance (typically 0-1000 range)
      const value = parseFloat(text);
      if (!isNaN(value) && value >= 0 && value < 100000) {
        // Check if parent/sibling has SOL indicator or it's in the header area
        const parent = el.closest('div');
        if (parent) {
          const parentText = parent.textContent.toLowerCase();
          // Make sure it's likely the SOL balance (not some other number)
          if (parentText.includes('sol') || el.classList.contains('font-semibold')) {
            // Additional check: should be a reasonable SOL balance format
            if (text.match(/^\d+\.?\d*$/)) {
              return value;
            }
          }
        }
      }
    }

    // Fallback: look for specific class combination
    const specificEl = document.querySelector('span.text-\\[14px\\].font-semibold.text-textPrimary');
    if (specificEl) {
      const value = parseFloat(specificEl.textContent.trim());
      if (!isNaN(value)) return value;
    }

    return null;
  }

  // Fetch SOL price from CoinGecko (cached for 60 seconds)
  async function fetchSolPrice() {
    const now = Date.now();
    // Use cached price if less than 60 seconds old
    if (solPrice && (now - solPriceLastFetch) < 60000) {
      return solPrice;
    }

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      if (data && data.solana && data.solana.usd) {
        solPrice = data.solana.usd;
        solPriceLastFetch = now;
        return solPrice;
      }
    } catch (e) {
      console.warn('Failed to fetch SOL price:', e);
    }

    // Fallback to last known price or estimate
    return solPrice || 150; // Default fallback
  }

  // Check if we're still on the same token
  function isOnSameToken() {
    if (!state.currentTokenId) return true;
    const currentToken = getCurrentTokenId();
    return currentToken === state.currentTokenId;
  }

  // Auto-detect the PNL element on Axiom
  function findPNLElement() {
    // Only look for PNL on trading pages (not main page)
    const url = window.location.href;
    const isTradingPage = url.includes('/meme/') || url.includes('/token/') || url.includes('/trade/');

    if (!isTradingPage) {
      return null;
    }

    // Method 1: Find the "PnL" label and get sibling value
    const allSpans = document.querySelectorAll('span');
    for (const span of allSpans) {
      if (span.textContent.trim() === 'PnL') {
        const container = span.closest('.flex.flex-col');
        if (container) {
          const valueSpan = container.querySelector('span.text-increase, span.text-decrease');
          if (valueSpan && valueSpan.textContent.includes('$')) {
            // Validate it's a reasonable PNL value (not millions)
            const parsed = parsePNLValue(valueSpan.textContent);
            if (parsed !== null && Math.abs(parsed) < 1000000) {
              return valueSpan;
            }
          }
        }
      }
    }

    // Method 2: Look for the PnL section by structure
    const pnlSections = document.querySelectorAll('[class*="min-w-"]');
    for (const section of pnlSections) {
      const hasLabel = section.textContent.includes('PnL');
      if (hasLabel) {
        const valueSpan = section.querySelector('span.text-increase, span.text-decrease');
        if (valueSpan && valueSpan.textContent.includes('$')) {
          const parsed = parsePNLValue(valueSpan.textContent);
          if (parsed !== null && Math.abs(parsed) < 1000000) {
            return valueSpan;
          }
        }
      }
    }

    return null;
  }

  // Wait for PNL element to appear
  function waitForPNLElement() {
    pnlElement = findPNLElement();

    if (pnlElement) {
      onPNLFound();
    } else {
      const checkInterval = setInterval(() => {
        pnlElement = findPNLElement();
        if (pnlElement) {
          clearInterval(checkInterval);
          onPNLFound();
        }
      }, 500);

      const bodyObserver = new MutationObserver(() => {
        pnlElement = findPNLElement();
        if (pnlElement) {
          bodyObserver.disconnect();
          clearInterval(checkInterval);
          onPNLFound();
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });

      // Update status
      if (statusText) {
        const url = window.location.href;
        if (!url.includes('/meme/') && !url.includes('/token/')) {
          statusText.textContent = 'Open a trade to start';
        }
      }
    }
  }

  function onPNLFound() {
    // PNL found - update status if not in active session
    if (!state.sessionActive) {
      statusDot.classList.add('detected');
      statusText.textContent = 'PNL detected - Ready!';
    }
  }

  // Inject the widget into the page
  function injectWidget() {
    widget = document.createElement('div');
    widget.id = 'axiom-wage-widget';
    widget.innerHTML = `
      <div class="widget-container${state.minimized ? ' minimized' : ''}">
        <div class="widget-header">
          <h3 class="widget-title">$WAGE <span class="tier-badge" style="display: none;"></span></h3>
          <div class="header-buttons">
            <button class="wallet-connect-btn disabled-feature" title="Coming Soon" disabled>Connect Wallet</button>
            <button class="widget-journal-btn" title="Trading Journal">📓</button>
            <button class="widget-dock-btn" title="Dock to header">⬆</button>
            <button class="widget-debug-btn" title="Copy Debug Log">📋</button>
            <button class="widget-settings-btn" title="Settings">⚙</button>
            <button class="widget-minimize">${state.minimized ? '+' : '−'}</button>
          </div>
          <!-- PRO Banner (tilted, below minimize button) -->
          <div class="pro-banner" style="display: none;">
            <span class="pro-crown">👑</span>
            <span class="pro-text">PRO</span>
          </div>
        </div>
        <div class="widget-body">
          <!-- Wallet Status (shown when connected with balance) -->
          <div class="wallet-status" style="display: none;"></div>

          <!-- Main Wage Display -->
          <div class="wage-display">
            <div class="wage-label">Per Hour</div>
            <div class="wage-value">$0.00</div>
            <div class="min-wage-multiple">0x min wage</div>
            <div class="tier-message">${getIdleMessage()}</div>
          </div>

          <!-- v2: No trial indicator - free version -->

          <!-- Stats Row -->
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-label">Elapsed</div>
              <div class="stat-value" id="elapsed-time">00:00:00</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Coin</div>
              <div class="stat-value" id="current-pnl">$0.00</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Session</div>
              <div class="stat-value" id="session-pnl">$0.00</div>
            </div>
          </div>

          <!-- Session Goal -->
          <div class="goal-section session-goal">
            <div class="goal-header">
              <span class="goal-label">Session</span>
              <span class="goal-text session-goal-text">$0 / $${state.dailyGoal}</span>
            </div>
            <div class="goal-bar">
              <div class="goal-progress session-goal-progress" style="width: 0%"></div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="widget-buttons">
            <button class="widget-btn btn-primary" id="start-btn">
              Start Session
            </button>
            <button class="widget-btn btn-flex flex-btn" style="display: none; margin-top: 8px;">
              🔥 FLEX on X
            </button>
          </div>

          <!-- Status -->
          <div class="status-indicator">
            <div class="status-dot detected"></div>
            <span class="status-text">Ready to start</span>
            <button class="voice-quick-btn disabled-feature" title="Voice notes - Coming Soon" disabled><span class="mic-label">MIC</span> ⏺</button>
            <button class="trades-toggle" style="display: none;" title="Show trades">+</button>
          </div>

          <!-- Trades breakdown (hidden by default) -->
          <div class="trades-breakdown" style="display: none;"></div>

          <!-- Settings Panel (hidden by default) -->
          <div class="settings-panel" style="display: none;">
            <!-- Today's Progress (in settings) -->
            <div class="goal-section daily-goal" style="margin-bottom: 12px;">
              <div class="goal-header">
                <span class="goal-label">Today's Total</span>
                <span class="goal-text daily-goal-text">$0 / $${state.dailyGoal}</span>
              </div>
              <div class="goal-bar">
                <div class="goal-progress daily-goal-progress" style="width: 0%"></div>
              </div>
            </div>
            <div class="setting-item disabled-feature" data-feature="apikey">
              <label>OpenAI API Key <span class="coming-soon">Coming Soon</span></label>
              <input type="password" class="api-key-input" placeholder="Coming soon..." disabled>
            </div>
            <div class="setting-item setting-toggle disabled-feature" data-feature="voice">
              <label>Voice Journal <span class="coming-soon">Coming Soon</span></label>
              <button class="toggle-btn" id="voice-toggle" disabled>OFF</button>
            </div>
            <div class="setting-item setting-toggle disabled-feature" data-feature="autosell">
              <label>Auto-Sell on Goal <span class="coming-soon">Coming Soon</span></label>
              <button class="toggle-btn" id="autosell-toggle" disabled>OFF</button>
            </div>
            <button class="widget-btn btn-secondary save-settings-btn">Save Settings</button>
          </div>

          <!-- Journal Panel (hidden by default) -->
          <div class="journal-panel" style="display: none;">
            <div class="journal-header">
              <span>Trading Journal</span>
              <button class="close-journal-btn">✕</button>
            </div>
            <div class="journal-entries"></div>
          </div>

          <!-- Session History -->
          <div class="history-section">
            <div class="history-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span>Today's Sessions</span>
              <span class="history-toggle">▼</span>
            </div>
            <div class="history-list"></div>
          </div>
        </div>
        <div class="resize-handle"></div>
      </div>
    `;

    document.body.appendChild(widget);

    // Prevent widget from capturing keyboard events meant for Axiom (like space for hotkeys)
    widget.addEventListener('keydown', (e) => {
      // Only capture keys when actively typing in an input field
      const isTypingInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (!isTypingInInput) {
        // Let the event propagate to Axiom
        e.stopPropagation();
        // Blur the widget so Axiom can receive the event
        if (document.activeElement && widget.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
    }, true);

    // Make widget container not focusable by keyboard navigation
    widget.setAttribute('tabindex', '-1');

    // Auto-blur buttons after click so they don't capture keyboard events
    widget.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => btn.blur(), 10);
      });
    });

    // Get DOM references
    wageValue = widget.querySelector('.wage-value');
    elapsedValue = widget.querySelector('#elapsed-time');
    currentPnlValue = widget.querySelector('#current-pnl');
    sessionPnlValue = widget.querySelector('#session-pnl');
    statusDot = widget.querySelector('.status-dot');
    statusText = widget.querySelector('.status-text');
    startBtn = widget.querySelector('#start-btn');
    minWageMultiple = widget.querySelector('.min-wage-multiple');
    tierMessage = widget.querySelector('.tier-message');
    sessionGoalProgress = widget.querySelector('.session-goal-progress');
    sessionGoalText = widget.querySelector('.session-goal-text');
    dailyGoalProgress = widget.querySelector('.daily-goal-progress');
    dailyGoalText = widget.querySelector('.daily-goal-text');
    historyContainer = widget.querySelector('.history-list');
    tradesToggle = widget.querySelector('.trades-toggle');
    tradesBreakdown = widget.querySelector('.trades-breakdown');

    // Apply saved position
    if (state.widgetPosition.x !== null) {
      widget.style.top = state.widgetPosition.y + 'px';
      widget.style.right = 'auto';
      widget.style.left = state.widgetPosition.x + 'px';
    }

    setupEventListeners();
    updateGoalDisplay();
    renderHistory();
    updateWageGatedUI(); // Set initial locked/unlocked state

    // Update wallet UI if previously connected
    if (state.walletConnected) {
      updateWalletUI();
      // Re-check balance on load and THEN check trial status
      checkWageBalance().then(() => {
        debug('Balance check complete on load, checking trial status...');
        checkTrialStatusAfterBalanceCheck();
      });
    }

    // Restore docked state if previously docked
    if (state.docked) {
      setTimeout(() => dockWidget(), 500); // Delay to let Axiom header load
    }
  }

  function setupEventListeners() {
    const header = widget.querySelector('.widget-header');
    const minimizeBtn = widget.querySelector('.widget-minimize');
    const settingsBtn = widget.querySelector('.widget-settings-btn');
    const settingsPanel = widget.querySelector('.settings-panel');
    const saveSettingsBtn = widget.querySelector('.save-settings-btn');
    const container = widget.querySelector('.widget-container');
    const historyHeader = widget.querySelector('.history-header');

    // Wallet Connect Button - disabled in v2 free version
    const walletBtn = widget.querySelector('.wallet-connect-btn');
    walletBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // v2: Feature coming soon
      statusText.textContent = 'Wallet connect coming soon!';
      setTimeout(() => {
        if (!state.sessionActive) statusText.textContent = getIdleMessage();
      }, 2000);
    });

    // FLEX Button - Share PnL to X
    const flexBtn = widget.querySelector('.flex-btn');
    flexBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      flexPnL();
    });

    // Debug copy button - for troubleshooting
    const debugBtn = widget.querySelector('.widget-debug-btn');
    debugBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Build comprehensive debug info
      let debugInfo = '=== AXIOM WAGE v2 DEBUG ===\n\n';

      // Current session trades
      debugInfo += '=== CURRENT SESSION TRADES ===\n';
      if (state.sessionTrades.length === 0) {
        debugInfo += 'No trades in current session\n';
      } else {
        state.sessionTrades.forEach((t, i) => {
          debugInfo += `Trade ${i + 1}: ${t.tokenName}\n`;
          debugInfo += `  StartPNL: ${t.startPNL}, EndPNL: ${t.endPNL}, Profit: ${t.profit}\n`;
          debugInfo += `  Duration: ${Math.round((t.endTime - t.startTime) / 1000)}s\n`;
        });
        const totalProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
        debugInfo += `\nTotal session profit from completed trades: $${totalProfit.toFixed(2)}\n`;
      }

      // Current tracking state
      debugInfo += '\n=== CURRENT TRACKING STATE ===\n';
      debugInfo += `Session Active: ${state.sessionActive}\n`;
      debugInfo += `Session Start Time: ${state.sessionStartTime ? new Date(state.sessionStartTime).toLocaleString() : 'null'}\n`;
      debugInfo += `Current Token ID: ${state.currentTokenId}\n`;
      debugInfo += `Current Token Name: ${state.currentTokenName}\n`;
      debugInfo += `Current Token StartPNL: ${state.currentTokenStartPNL}\n`;
      debugInfo += `Current Token LastPNL: ${state.currentTokenLastPNL}\n`;

      // Current page state
      debugInfo += '\n=== CURRENT PAGE STATE ===\n';
      const currentPNL = getCurrentPNL();
      const currentTokenId = getCurrentTokenId();
      const tokenName = getTokenName();
      debugInfo += `Page Token ID: ${currentTokenId}\n`;
      debugInfo += `Page Token Name: ${tokenName}\n`;
      debugInfo += `Page PNL (raw): ${currentPNL}\n`;
      debugInfo += `PNL Element text: ${pnlElement?.textContent?.trim() || 'not found'}\n`;

      // Today's sessions from history
      debugInfo += '\n=== TODAY\'S SESSION HISTORY ===\n';
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySessions = state.sessionHistory.filter(s => s.endTime >= todayStart.getTime());
      if (todaySessions.length === 0) {
        debugInfo += 'No completed sessions today\n';
      } else {
        todaySessions.forEach((s, i) => {
          debugInfo += `Session ${i + 1}: Profit=$${(s.totalProfit || s.profit || 0).toFixed(2)}, Hourly=$${(s.hourlyWage || 0).toFixed(2)}/hr\n`;
          if (s.trades) {
            s.trades.forEach(t => {
              debugInfo += `  - ${t.tokenName}: $${t.profit.toFixed(2)}\n`;
            });
          }
        });
        const todayTotal = todaySessions.reduce((sum, s) => sum + (s.totalProfit || s.profit || 0), 0);
        debugInfo += `\nToday's total: $${todayTotal.toFixed(2)}\n`;
      }

      // Recent debug log
      debugInfo += '\n=== RECENT DEBUG LOG (last 50) ===\n';
      debugInfo += debugLog.slice(-50).join('\n');

      navigator.clipboard.writeText(debugInfo).then(() => {
        debugBtn.textContent = '✓';
        setTimeout(() => { debugBtn.textContent = '📋'; }, 1000);
        debug('Debug info copied to clipboard');
      });
    });

    // Dock button
    const dockBtn = widget.querySelector('.widget-dock-btn');
    dockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.docked) {
        undockWidget();
      } else {
        dockWidget();
      }
    });

    // Resize handle
    const resizeHandle = widget.querySelector('.resize-handle');
    let isResizing = false;
    let startWidth = 0;
    let startX = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      startWidth = widget.offsetWidth;
      document.body.style.userSelect = 'none';

      const onResizeMove = (e) => {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(280, Math.min(500, startWidth + deltaX));
        widget.style.width = newWidth + 'px';
        state.widgetSize.width = newWidth;
      };

      const onResizeEnd = () => {
        isResizing = false;
        document.body.style.userSelect = '';
        saveState();
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);
      };

      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
    });

    // Apply saved size
    if (state.widgetSize && state.widgetSize.width) {
      widget.style.width = state.widgetSize.width + 'px';
    }

    // Minimize toggle
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.minimized = !state.minimized;
      container.classList.toggle('minimized');
      minimizeBtn.textContent = state.minimized ? '+' : '−';
      saveState();
    });

    // Settings toggle
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.settingsOpen = !state.settingsOpen;
      settingsPanel.style.display = state.settingsOpen ? 'block' : 'none';
    });

    // Save settings
    const apiKeyInput = widget.querySelector('.api-key-input');
    const voiceToggle = widget.querySelector('#voice-toggle');

    saveSettingsBtn.addEventListener('click', () => {
      // Save API key if changed (not the masked value)
      const apiKeyValue = apiKeyInput.value;
      if (apiKeyValue && !apiKeyValue.includes('•')) {
        state.openaiApiKey = apiKeyValue;
        apiKeyInput.value = '••••••••';
        debug('API key saved');
      }

      saveState();
      state.settingsOpen = false;
      settingsPanel.style.display = 'none';
    });

    // v2: Voice toggle disabled - coming soon
    voiceToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      statusText.textContent = 'Voice journaling coming soon!';
      setTimeout(() => {
        if (!state.sessionActive) statusText.textContent = getIdleMessage();
      }, 2000);
    });

    // v2: Quick voice button disabled - coming soon
    const voiceQuickBtn = widget.querySelector('.voice-quick-btn');
    voiceQuickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      statusText.textContent = 'Voice notes coming soon!';
      setTimeout(() => {
        if (!state.sessionActive) statusText.textContent = getIdleMessage();
      }, 2000);
    });

    // v2: Auto-sell toggle disabled - coming soon
    const autoSellToggle = widget.querySelector('#autosell-toggle');
    autoSellToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      statusText.textContent = 'Auto-sell coming soon!';
      setTimeout(() => {
        if (!state.sessionActive) statusText.textContent = getIdleMessage();
      }, 2000);
    });

    // Journal button - show journal entries (no PRO requirement in v2)
    const journalBtn = widget.querySelector('.widget-journal-btn');
    const journalPanel = widget.querySelector('.journal-panel');
    const closeJournalBtn = widget.querySelector('.close-journal-btn');

    journalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      journalPanel.style.display = journalPanel.style.display === 'none' ? 'block' : 'none';
      if (journalPanel.style.display === 'block') {
        renderJournalEntries();
      }
    });

    closeJournalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      journalPanel.style.display = 'none';
    });

    // v2: Clear history, reset session, clear today, test notification buttons removed

    // History toggle
    historyHeader.addEventListener('click', () => {
      historyHeader.parentElement.classList.toggle('expanded');
    });

    // Draggable - smooth implementation
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let widgetStartX = 0;
    let widgetStartY = 0;
    let dragMoveCount = 0;

    function onDragStart(e) {
      const targetEl = e.target;
      const isButton = e.target.closest('button');
      const isInput = e.target.closest('input');
      debug(`DRAG: mousedown on ${targetEl.tagName}.${targetEl.className} | isButton=${!!isButton} isInput=${!!isInput}`);

      if (isButton) {
        debug('DRAG: Ignoring - clicked on button');
        return;
      }
      if (isInput) {
        debug('DRAG: Ignoring - clicked on input');
        return;
      }

      // If already dragging (missed mouseup), clean up first
      if (isDragging) {
        debug('DRAG: Already dragging! Forcing cleanup...');
        onDragEnd({ type: 'forced-cleanup' });
      }

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      dragMoveCount = 0;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const rect = widget.getBoundingClientRect();
      widgetStartX = rect.left;
      widgetStartY = rect.top;

      debug(`DRAG START: mouse(${e.clientX}, ${e.clientY}) widget(${widgetStartX}, ${widgetStartY})`);

      widget.style.transition = 'none';
      widget.classList.add('dragging');
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      // Use capture phase for move/up events
      document.addEventListener('mousemove', onDragMove, true);
      document.addEventListener('mouseup', onDragEnd, true);
      // Handle mouse leaving the actual window (not child elements)
      window.addEventListener('mouseout', onWindowMouseOut);
      window.addEventListener('blur', onDragEnd);

      debug('DRAG: All listeners attached');
    }

    function onWindowMouseOut(e) {
      // Only end drag if mouse actually left the window
      if (!e.relatedTarget && !e.toElement) {
        debug('DRAG: Mouse left window');
        onDragEnd(e);
      }
    }

    function onDragMove(e) {
      if (!isDragging) {
        debug('DRAG MOVE: called but isDragging=false');
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      dragMoveCount++;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      let newX = widgetStartX + deltaX;
      let newY = widgetStartY + deltaY;

      // Keep within viewport bounds (with some padding)
      const maxX = window.innerWidth - widget.offsetWidth - 10;
      const maxY = window.innerHeight - widget.offsetHeight - 10;
      const clampedX = Math.max(10, Math.min(newX, maxX));
      const clampedY = Math.max(10, Math.min(newY, maxY));

      // Log every 10th move to avoid spam
      if (dragMoveCount % 10 === 1) {
        debug(`DRAG MOVE #${dragMoveCount}: mouse(${e.clientX}, ${e.clientY}) delta(${deltaX}, ${deltaY}) newPos(${clampedX}, ${clampedY}) clamped=${newX !== clampedX || newY !== clampedY}`);
      }

      widget.style.left = clampedX + 'px';
      widget.style.top = clampedY + 'px';
      widget.style.right = 'auto';
    }

    function onDragEnd(e) {
      const eventType = e ? e.type : 'unknown';
      debug(`DRAG END: event=${eventType} isDragging=${isDragging} moveCount=${dragMoveCount}`);

      if (!isDragging) {
        debug('DRAG END: called but isDragging=false, ignoring');
        return;
      }

      isDragging = false;
      widget.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Save position
      const finalX = parseInt(widget.style.left) || 0;
      const finalY = parseInt(widget.style.top) || 0;
      state.widgetPosition.x = finalX;
      state.widgetPosition.y = finalY;
      saveState();

      debug(`DRAG SAVED: position(${finalX}, ${finalY})`);

      // Clean up all listeners
      document.removeEventListener('mousemove', onDragMove, true);
      document.removeEventListener('mouseup', onDragEnd, true);
      window.removeEventListener('mouseout', onWindowMouseOut);
      window.removeEventListener('blur', onDragEnd);
    }

    header.addEventListener('mousedown', onDragStart);
    debug('DRAG: mousedown listener attached to header');

    // DEBUG: Global mouseup tracker to see if events are firing at all
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        debug(`DRAG DEBUG: Global mouseup detected while dragging! target=${e.target.tagName}.${e.target.className}`);
      }
    }, true);

    // Start/Stop button
    startBtn.addEventListener('click', () => {
      if (state.sessionActive) {
        stopSession();
      } else {
        showGoalModal();
      }
    });
  }

  // Goal Modal
  function showGoalModal() {
    // Don't require PNL element to start - user can start anywhere
    const modal = document.createElement('div');
    modal.className = 'goal-modal';
    modal.innerHTML = `
      <div class="goal-modal-content">
        <div class="goal-modal-title">Set Session Goal</div>
        <div class="goal-modal-subtitle">How much do you want to make this session?</div>
        <input type="number" class="goal-modal-input" placeholder="$${state.dailyGoal}" value="${state.dailyGoal}">
        <div class="goal-modal-buttons">
          <button class="widget-btn btn-secondary cancel-btn">Cancel</button>
          <button class="widget-btn btn-primary start-btn">Start Session</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Prevent modal from blocking Axiom hotkeys when not typing
    modal.addEventListener('keydown', (e) => {
      const isTypingInInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      if (!isTypingInInput && e.key === ' ') {
        // Let space key through to Axiom
        modal.remove();
        return;
      }
    }, true);

    const input = modal.querySelector('.goal-modal-input');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const startBtnModal = modal.querySelector('.start-btn');

    // Focus input
    setTimeout(() => input.focus(), 100);

    // Cancel
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Click outside to cancel
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Start session
    startBtnModal.addEventListener('click', () => {
      const newGoal = parseInt(input.value) || state.dailyGoal;
      state.dailyGoal = Math.max(1, Math.min(1000000, newGoal));
      saveState();
      modal.remove();
      startSession();
    });

    // Enter key to start
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startBtnModal.click();
      } else if (e.key === 'Escape') {
        modal.remove();
      }
    });
  }

  // Dock/Undock functions
  function dockWidget() {
    // Find the Rewards button in the Axiom header
    let rewardsBtn = null;
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.textContent.includes('Rewards')) {
        rewardsBtn = btn;
        break;
      }
    }

    if (!rewardsBtn) {
      debug('Could not find Rewards button to dock next to');
      // Fallback: try the old method
      const headerContainer = document.querySelector('.border-b.border-primaryStroke');
      if (headerContainer) {
        const searchBtn = headerContainer.querySelector('button[type="button"]');
        if (searchBtn?.parentElement) {
          rewardsBtn = { parentElement: searchBtn.parentElement, nextSibling: searchBtn };
        }
      }
      if (!rewardsBtn) {
        debug('Could not find any suitable location for docking');
        return;
      }
    }

    // Create docked widget
    dockedWidget = document.createElement('div');
    dockedWidget.id = 'axiom-wage-docked';
    dockedWidget.innerHTML = `
      <div class="docked-container">
        <span class="docked-label">$/hr</span>
        <span class="docked-value">$0.00</span>
        <button class="docked-undock" title="Undock">⬇</button>
      </div>
    `;

    // Insert right after the Rewards button
    const targetArea = rewardsBtn.parentElement;
    if (rewardsBtn.nextSibling) {
      targetArea.insertBefore(dockedWidget, rewardsBtn.nextSibling);
    } else {
      targetArea.appendChild(dockedWidget);
    }

    // Prevent clicks on docked widget from reaching Axiom elements
    dockedWidget.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add undock listener with proper event handling
    dockedWidget.querySelector('.docked-undock').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      undockWidget();
    });

    // Hide main widget
    widget.style.display = 'none';
    state.docked = true;
    saveState();
    debug('Widget docked to header');
  }

  function undockWidget() {
    if (dockedWidget) {
      dockedWidget.remove();
      dockedWidget = null;
    }
    widget.style.display = 'block';
    state.docked = false;
    saveState();
    debug('Widget undocked');
  }

  // Session Management
  function startSession() {
    // v2: No trial check - free version allows unlimited sessions

    pnlElement = findPNLElement();
    const currentPNL = getCurrentPNL();
    const currentTokenId = getCurrentTokenId();
    const holding = getCurrentHolding();
    const hasPos = hasActivePosition();

    debug(`START SESSION - TokenId: ${currentTokenId}, PNL: ${currentPNL}, Holding: ${holding}, HasPosition: ${hasPos}`);

    state.sessionActive = true;
    state.sessionStartTime = Date.now();
    state.sessionTrades = []; // Reset trades for new session
    goalNotificationShown = false; // Reset CASH OUT notification for new session

    // If we're on a trading page with PNL and have a position, start tracking with stabilization
    if (currentPNL !== null && currentTokenId && hasPos) {
      state.currentTokenId = currentTokenId;
      state.currentTokenName = getTokenName();
      state.currentTokenStartPNL = currentPNL;
      state.currentTokenLastPNL = currentPNL;
      state.currentTokenStartTime = Date.now();
      // Enter stabilization mode - wait for Axiom PnL to settle
      state.pnlStabilizing = true;
      state.stabilizationStart = Date.now();
      state.lastStablePNL = currentPNL;
      debug(`SESSION START: Token=${state.currentTokenName}, InitialPNL=${currentPNL} - waiting 3s for stabilization`);
      statusText.textContent = `Loading ${state.currentTokenName}...`;
    } else {
      state.currentTokenId = null;
      state.currentTokenName = null;
      state.currentTokenStartPNL = null;
      state.currentTokenLastPNL = null;
      state.currentTokenStartTime = null;
      debug(`No position to track - waiting`);
      statusText.textContent = 'Waiting for trade...';
    }

    saveState();
    updateGoalDisplay();
    startUpdateLoop();

    startBtn.textContent = 'Stop Session';
    startBtn.classList.remove('btn-primary');
    startBtn.classList.add('btn-danger');
    statusDot.classList.remove('detected');
    statusDot.classList.add('active');

    // v2: Voice recording disabled in free version
  }

  // Save current token's trade and switch to new token
  function switchToken(newTokenId, newTokenName, newPNL) {
    // Save the current token's trade if we were tracking one
    if (state.currentTokenId && state.currentTokenStartPNL !== null) {
      // IMPORTANT: Use lastPNL, NOT getCurrentPNL()!
      // When switching tokens, we're already on the NEW page, so getCurrentPNL() would return wrong value
      const endPNL = state.currentTokenLastPNL !== null ? state.currentTokenLastPNL : state.currentTokenStartPNL;
      const profit = endPNL - state.currentTokenStartPNL;

      debug(`SAVING TRADE: ${state.currentTokenName} | Start: ${state.currentTokenStartPNL} | End: ${endPNL} | Profit: ${profit.toFixed(2)}`);

      const trade = {
        tokenId: state.currentTokenId,
        tokenName: state.currentTokenName,
        startPNL: state.currentTokenStartPNL,
        endPNL: endPNL,
        profit: profit,
        startTime: state.currentTokenStartTime,
        endTime: Date.now()
      };
      state.sessionTrades.push(trade);

      // Save journal entry for this trade
      if (voiceRecorder.currentTokenTranscript) {
        saveJournalEntry(trade);
      }
    }

    // Start tracking new token with stabilization
    state.currentTokenId = newTokenId;
    state.currentTokenName = newTokenName;
    state.currentTokenStartPNL = newPNL;
    state.currentTokenLastPNL = newPNL;
    state.currentTokenStartTime = Date.now();
    // Enter stabilization mode
    state.pnlStabilizing = true;
    state.stabilizationStart = Date.now();
    state.lastStablePNL = newPNL;

    saveState();
    statusText.textContent = `Loading ${newTokenName}...`;
  }

  async function stopSession() {
    // Stop voice recording
    if (voiceRecorder.isRecording) {
      stopVoiceRecording();
    }

    // v2: No trial tracking to stop

    // Save current token's trade if we were tracking one
    if (state.currentTokenId && state.currentTokenStartPNL !== null) {
      // Use getCurrentPNL() if we're still on the same page, otherwise use lastPNL
      const pagePNL = getCurrentPNL();
      const pageTokenId = getCurrentTokenId();

      // Only trust page PNL if we're still on the same token's page
      let endPNL;
      if (pageTokenId === state.currentTokenId && pagePNL !== null) {
        endPNL = pagePNL;
      } else {
        // We're on a different page, use last known PNL
        endPNL = state.currentTokenLastPNL !== null ? state.currentTokenLastPNL : state.currentTokenStartPNL;
      }

      const profit = endPNL - state.currentTokenStartPNL;

      debug(`STOP SESSION - Saving trade: ${state.currentTokenName} | Start: ${state.currentTokenStartPNL} | End: ${endPNL} | Profit: ${profit.toFixed(2)}`);

      const trade = {
        tokenId: state.currentTokenId,
        tokenName: state.currentTokenName,
        startPNL: state.currentTokenStartPNL,
        endPNL: endPNL,
        profit: profit,
        startTime: state.currentTokenStartTime,
        endTime: Date.now()
      };
      state.sessionTrades.push(trade);

      // Save journal entry for this trade
      if (voiceRecorder.currentTokenTranscript) {
        saveJournalEntry(trade);
      }
    }

    // Calculate final SOL-based P/L (ground truth)
    let solBasedProfit = null;
    const endingSolBalance = getSolBalance();
    if (state.startingSolBalance !== null && endingSolBalance !== null) {
      const solDiff = endingSolBalance - state.startingSolBalance;
      const price = await fetchSolPrice();
      solBasedProfit = solDiff * price;
    }

    // Only save to history if we have any trades
    if (state.sessionTrades.length > 0) {
      const totalProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
      // Calculate actual time spent in trades (not total session time)
      const activeTradeMs = state.sessionTrades.reduce((sum, t) => sum + (t.endTime - t.startTime), 0);
      const activeHours = activeTradeMs / 3600000;
      const hourlyWage = activeHours > 0 ? totalProfit / activeHours : 0;

      const session = {
        startTime: state.sessionStartTime,
        endTime: Date.now(),
        trades: state.sessionTrades,
        totalProfit: totalProfit,
        activeTradeTime: activeTradeMs, // Store active trade time for reference
        solProfit: solBasedProfit,     // Just for reference, not used in calcs
        hourlyWage: hourlyWage,
        tokenCount: state.sessionTrades.length
      };

      state.sessionHistory.push(session);
    }

    // Reset session
    state.sessionActive = false;
    state.sessionStartTime = null;
    state.currentTokenId = null;
    state.currentTokenName = null;
    state.currentTokenStartPNL = null;
    state.currentTokenLastPNL = null;
    state.currentTokenStartTime = null;
    state.pnlStabilizing = false;
    state.stabilizationStart = null;
    state.lastStablePNL = null;
    state.sessionTrades = [];

    saveState();
    stopUpdateLoop();

    startBtn.textContent = 'Start Session';
    startBtn.classList.remove('btn-danger');
    startBtn.classList.add('btn-primary');
    statusDot.classList.remove('active');
    statusDot.classList.add('detected');
    statusText.textContent = 'Session saved!';

    setTimeout(() => {
      statusText.textContent = 'Ready to start';
    }, 2000);

    // Reset display
    wageValue.textContent = '$0.00';
    wageValue.className = 'wage-value';
    elapsedValue.textContent = '00:00:00';
    if (currentPnlValue) currentPnlValue.textContent = '$0.00';
    if (sessionPnlValue) sessionPnlValue.textContent = '$0.00';
    minWageMultiple.textContent = '0x min wage';
    minWageMultiple.className = 'min-wage-multiple';
    // Reset tier message to random idle message
    if (tierMessage) {
      lastTierMessage = getIdleMessage();
      tierMessage.textContent = lastTierMessage;
      tierMessage.className = 'tier-message';
    }
    lastTier = null;
    updateDockedWidget(0);

    // Update UI
    updateGoalDisplay();
    renderHistory();
  }

  // PNL Reading
  function getCurrentPNL() {
    // Clear cached element if URL changed (navigated to different token page)
    const currentUrl = window.location.href;
    if (currentUrl !== lastPnlUrl) {
      pnlElement = null;
      lastPnlUrl = currentUrl;
      debug(`URL changed, clearing PNL element cache`);
    }

    if (!pnlElement || !document.contains(pnlElement)) {
      pnlElement = findPNLElement();
    }
    if (!pnlElement) return null;
    const text = pnlElement.textContent.trim();
    return parsePNLValue(text);
  }

  let lastParsedPNL = null;
  function parsePNLValue(text) {
    if (!text) return null;

    // Extract dollar amount from strings like "+$0.091 (+9%)" or "-$5.23 (-12%)"
    const match = text.match(/([+-]?\$?[\d,]+\.?\d*)/);
    if (!match) {
      debug(`PNL PARSE FAIL: Could not match pattern in "${text}"`);
      return null;
    }

    let cleaned = match[1].replace(/[$,]/g, '').trim();

    // Handle K/M suffixes
    let multiplier = 1;
    const valueLastChar = cleaned.slice(-1).toLowerCase();
    if (valueLastChar === 'k') {
      multiplier = 1000;
      cleaned = cleaned.slice(0, -1);
    } else if (valueLastChar === 'm') {
      multiplier = 1000000;
      cleaned = cleaned.slice(0, -1);
    }

    const value = parseFloat(cleaned);
    if (isNaN(value)) return null;

    return value * multiplier;
  }

  // Update Loop
  function startUpdateLoop() {
    stopUpdateLoop();
    updateCalculation();
    updateInterval = setInterval(updateCalculation, 1000);
    setupPNLObserver();
  }

  function stopUpdateLoop() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function setupPNLObserver() {
    if (!pnlElement) return;
    try {
      const container = pnlElement.closest('.flex.flex-col') || pnlElement.parentElement;
      observer = new MutationObserver(() => {
        pnlElement = findPNLElement();
        updateCalculation();
      });
      observer.observe(container || pnlElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    } catch (e) {
      console.warn('Observer setup failed:', e);
    }
  }

  function updateCalculation() {
    if (!state.sessionActive) return;

    const currentTokenId = getCurrentTokenId();
    const currentPNL = getCurrentPNL();
    const holding = getCurrentHolding();
    const hasPosition = hasActivePosition();
    const now = Date.now();

    // Always update elapsed time
    updateElapsedTime(now - state.sessionStartTime);

    // Check if we're on a trading page with PNL
    if (currentPNL !== null && currentTokenId) {

      // Check if this is the same token we're tracking
      if (state.currentTokenId === currentTokenId) {
        // Same token - check if still holding
        // IMPORTANT: Don't update lastPNL yet - we need the previous value for sanity checks
        // if position just closed (Axiom can show glitched values during sell)
        const previousLastPNL = state.currentTokenLastPNL;

        // Handle PNL stabilization period (first 3 seconds after detecting position)
        // This prevents false profits when Axiom loads old historical PnL values
        const STABILIZATION_TIME = 3000; // 3 seconds
        if (state.pnlStabilizing) {
          const stabilizationElapsed = now - state.stabilizationStart;

          // Check if PnL changed significantly during stabilization
          if (Math.abs(currentPNL - state.lastStablePNL) > 0.5) {
            debug(`STABILIZING: PNL changed from ${state.lastStablePNL} to ${currentPNL} - updating startPNL`);
            state.currentTokenStartPNL = currentPNL; // Keep updating startPNL
            state.lastStablePNL = currentPNL;
          }

          if (stabilizationElapsed >= STABILIZATION_TIME) {
            // Lock in the startPNL
            state.pnlStabilizing = false;
            state.currentTokenStartPNL = currentPNL; // Final lock-in at current value
            state.currentTokenStartTime = now; // Reset start time to now
            debug(`STABILIZED: Locked startPNL=${currentPNL} for ${state.currentTokenName} after ${(stabilizationElapsed / 1000).toFixed(1)}s`);
            statusText.textContent = `Tracking ${state.currentTokenName}`;
            saveState();
          } else {
            // Still stabilizing
            statusText.textContent = `Loading ${state.currentTokenName}... ${Math.ceil((STABILIZATION_TIME - stabilizationElapsed) / 1000)}s`;
            // Show 0 profit during stabilization
            const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
            const activeHours = getActiveTradeHours();
            const hourlyWage = activeHours > 0 ? completedProfit / activeHours : 0;
            updateWageDisplay(hourlyWage);
            updatePNLDisplay(0, completedProfit);
            updateDockedWidget(hourlyWage);
            updateMinWageMultiple(hourlyWage);
            updateGoalDisplay(completedProfit);
            return; // Don't process further until stabilized
          }
        }

        if (hasPosition) {
          // Still holding - NOW we can safely update lastPNL
          state.currentTokenLastPNL = currentPNL;

          // Update display
          const currentProfit = currentPNL - state.currentTokenStartPNL;
          const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
          const totalProfit = completedProfit + currentProfit;
          const activeHours = getActiveTradeHours();
          const hourlyWage = activeHours > 0 ? totalProfit / activeHours : 0;

          // Debug: Log if session shows unexpected large loss
          if (totalProfit < -5 && now % 5000 < 1000) {
            debug(`DEBUG LOSS: completedProfit=${completedProfit.toFixed(2)}, currentProfit=${currentProfit.toFixed(2)}, startPNL=${state.currentTokenStartPNL}, axiomPNL=${currentPNL}`);
            if (state.sessionTrades.length > 0) {
              debug(`Trades: ${state.sessionTrades.map(t => `${t.tokenName}:${t.profit.toFixed(2)}`).join(', ')}`);
            }
          }

          // Only log every 10 seconds to reduce spam
          if (now % 10000 < 1000) {
            const activeMinsSecs = `${Math.floor(activeHours * 60)}m${Math.round((activeHours * 3600) % 60)}s`;
            debug(`TRACKING: PNL=${currentPNL.toFixed(2)}, Profit=${totalProfit.toFixed(2)}, ActiveTime=${activeMinsSecs}, $/hr=${hourlyWage.toFixed(2)}`);
          }

          statusText.textContent = `Tracking ${state.currentTokenName}`;
          updateWageDisplay(hourlyWage);
          // Show actual Axiom PNL for "Current", calculated session total for "Session"
          updatePNLDisplay(currentPNL, totalProfit);
          updateDockedWidget(hourlyWage);
          updateMinWageMultiple(hourlyWage);
          updateGoalDisplay(totalProfit);
        } else {
          // Position closed - save trade and clear

          // Don't save trade if we were still stabilizing (PnL never settled)
          if (state.pnlStabilizing) {
            debug(`SKIPPING TRADE SAVE: Position closed during stabilization period - PnL never settled`);
            state.currentTokenId = null;
            state.currentTokenName = null;
            state.currentTokenStartPNL = null;
            state.currentTokenLastPNL = null;
            state.currentTokenStartTime = null;
            state.pnlStabilizing = false;
            state.stabilizationStart = null;
            state.lastStablePNL = null;
            saveState();
            statusText.textContent = `No position (${state.sessionTrades.length} trades)`;
            return;
          }

          // IMPORTANT: Use previousLastPNL (captured BEFORE this update cycle) because Axiom's UI
          // can show corrupted values during the sell transaction
          // previousLastPNL is the last known good value from when we were still holding
          const lastStablePNL = previousLastPNL !== null ? previousLastPNL : currentPNL;

          // Sanity check: if the PNL jumped more than $3 from last known, something is wrong
          // Use the last known stable value instead (lowered from $10 to catch more glitches)
          let finalPNL = currentPNL;
          if (Math.abs(currentPNL - lastStablePNL) > 3) {
            debug(`WARNING: PNL jumped from ${lastStablePNL} to ${currentPNL} - using last stable value`);
            finalPNL = lastStablePNL;
          }

          const tradeProfit = finalPNL - state.currentTokenStartPNL;
          const tradeDurationSec = (Date.now() - state.currentTokenStartTime) / 1000;

          // Sanity check: reject trades with unreasonable profit values
          // Max $500 profit/loss or $2/sec (whichever is higher)
          const maxReasonableProfit = Math.max(500, tradeDurationSec * 2);
          const minReasonableProfit = -Math.max(500, tradeDurationSec * 2);

          debug(`POSITION CLOSED: AxiomPNL=${currentPNL}, LastStable=${lastStablePNL}, UsedPNL=${finalPNL}, StartPNL=${state.currentTokenStartPNL}, TradeProfit=${tradeProfit.toFixed(3)}, Holding=${holding}, Duration=${tradeDurationSec.toFixed(0)}s`);
          debug(`TRADE MATH: ${finalPNL.toFixed(2)} - ${state.currentTokenStartPNL.toFixed(2)} = ${tradeProfit.toFixed(2)} (if wrong, check startPNL capture)`);

          // REJECT trades with extreme values - don't save them
          if (tradeProfit > maxReasonableProfit || tradeProfit < minReasonableProfit) {
            debug(`REJECTED: Trade profit ${tradeProfit.toFixed(2)} is unreasonable (limit: ${minReasonableProfit.toFixed(0)} to ${maxReasonableProfit.toFixed(0)}) - NOT saving this trade`);
            // Clear tracking but don't save the bad trade
            state.currentTokenId = null;
            state.currentTokenName = null;
            state.currentTokenStartPNL = null;
            state.currentTokenLastPNL = null;
            state.currentTokenStartTime = null;
            state.pnlStabilizing = false;
            state.stabilizationStart = null;
            state.lastStablePNL = null;
            saveState();
            return; // Exit early, don't save this trade
          }

          const trade = {
            tokenId: state.currentTokenId,
            tokenName: state.currentTokenName,
            startPNL: state.currentTokenStartPNL,
            endPNL: finalPNL,
            profit: tradeProfit,
            startTime: state.currentTokenStartTime,
            endTime: Date.now()
          };
          state.sessionTrades.push(trade);

          // Log cumulative session info for debugging
          const totalSessionProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
          debug(`Session now has ${state.sessionTrades.length} trades, total profit: $${totalSessionProfit.toFixed(2)}`);

          // Save journal entry for this trade
          if (state.voiceRecordingEnabled || voiceRecorder.currentTokenTranscript) {
            saveJournalEntry(trade);
          }

          state.currentTokenId = null;
          state.currentTokenName = null;
          state.currentTokenStartPNL = null;
          state.currentTokenLastPNL = null;
          state.currentTokenStartTime = null;
          state.pnlStabilizing = false;
          state.stabilizationStart = null;
          state.lastStablePNL = null;
          saveState();

          const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
          const activeHours = getActiveTradeHours();
          const hourlyWage = activeHours > 0 ? completedProfit / activeHours : 0;

          statusText.textContent = `Closed (${state.sessionTrades.length} trades)`;
          updateWageDisplay(hourlyWage);
          // Show Axiom's PNL for "Current" (matches what user sees), total session profit for "Session"
          updatePNLDisplay(currentPNL, completedProfit);
          updateDockedWidget(hourlyWage);
          updateMinWageMultiple(hourlyWage);
          updateGoalDisplay(completedProfit);
        }
      } else if (hasPosition) {
        // Different token with a position - switch to it
        debug(`SWITCH TOKEN: From ${state.currentTokenId} to ${currentTokenId}, NewPNL=${currentPNL}, Holding=${holding}`);

        // Don't save trade from previous token if we were still stabilizing
        if (state.pnlStabilizing) {
          debug(`SWITCH during stabilization - not saving previous token's trade (PnL never settled)`);
        } else if (state.currentTokenId && state.currentTokenStartPNL !== null && state.currentTokenLastPNL !== null) {
          // Save current token's trade using last known PNL
          // IMPORTANT: Only save if we have a valid lastPNL that was captured while on that token page
          const lastPNL = state.currentTokenLastPNL;
          const tradeProfit = lastPNL - state.currentTokenStartPNL;

          // Sanity check: reject trades with unreasonable profit values
          // This catches corrupted data from Axiom UI glitches
          const tradeDurationSec = (Date.now() - state.currentTokenStartTime) / 1000;
          const maxReasonableProfit = Math.max(50, tradeDurationSec * 0.5); // Max $0.50/sec or $50 minimum
          const minReasonableProfit = -Math.max(50, tradeDurationSec * 0.5);

          if (tradeProfit > maxReasonableProfit || tradeProfit < minReasonableProfit) {
            debug(`WARNING: Rejecting suspicious trade profit=${tradeProfit.toFixed(2)} (duration=${tradeDurationSec.toFixed(0)}s, start=${state.currentTokenStartPNL}, end=${lastPNL})`);
            // Don't save this trade - it's likely corrupted data
          } else {
            debug(`Saving trade from switch: Start=${state.currentTokenStartPNL}, End=${lastPNL}, Profit=${tradeProfit.toFixed(3)}`);
            const trade = {
              tokenId: state.currentTokenId,
              tokenName: state.currentTokenName,
              startPNL: state.currentTokenStartPNL,
              endPNL: lastPNL,
              profit: tradeProfit,
              startTime: state.currentTokenStartTime,
              endTime: Date.now()
            };
            state.sessionTrades.push(trade);

            // Save journal entry for this trade (including voice notes)
            if (state.voiceRecordingEnabled || voiceRecorder.currentTokenTranscript) {
              saveJournalEntry(trade);
            }
          }
        } else if (state.currentTokenId) {
          debug(`Skipping trade save on switch - missing lastPNL (currentTokenLastPNL=${state.currentTokenLastPNL})`);
        }

        // Start tracking new token - enter stabilization mode first
        // Wait 3 seconds for Axiom PnL to stabilize before locking in startPNL
        state.currentTokenId = currentTokenId;
        state.currentTokenName = getTokenName();
        state.pnlStabilizing = true;
        state.stabilizationStart = now;
        state.lastStablePNL = currentPNL;
        state.currentTokenStartPNL = currentPNL; // Tentative, will update during stabilization
        state.currentTokenLastPNL = currentPNL;
        state.currentTokenStartTime = now;
        saveState();

        debug(`STABILIZING: ${state.currentTokenName} - initial PNL=${currentPNL} (RAW: "${pnlElement?.textContent?.trim()}")`);
        debug(`Waiting 3 seconds for Axiom to finish loading before locking startPNL...`);
        statusText.textContent = `Loading ${state.currentTokenName}...`;

        // Show current totals (just switched, current token profit is 0)
        const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
        const activeHours = getActiveTradeHours();
        const hourlyWage = activeHours > 0 ? completedProfit / activeHours : 0;
        updateWageDisplay(hourlyWage);
        updatePNLDisplay(0, completedProfit);
        updateDockedWidget(hourlyWage);
        updateMinWageMultiple(hourlyWage);
        updateGoalDisplay(completedProfit);
      } else {
        // On a DIFFERENT token page with no position on THIS token
        // But we might still have an open position on the token we're tracking!
        const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);

        // Check if we're still tracking an open position on another token
        if (state.currentTokenId && state.currentTokenStartPNL !== null) {
          // Still have an open trade on another token - show that info
          const lastKnownPNL = state.currentTokenLastPNL !== null ? state.currentTokenLastPNL : state.currentTokenStartPNL;
          const currentTokenProfit = lastKnownPNL - state.currentTokenStartPNL;
          const totalProfit = completedProfit + currentTokenProfit;
          const activeHours = getActiveTradeHours();
          const hourlyWage = activeHours > 0 ? totalProfit / activeHours : 0;

          // Only log occasionally
          if (now % 10000 < 1000) {
            debug(`BROWSING: Still holding ${state.currentTokenName}, LastPNL=${lastKnownPNL.toFixed(2)}, Profit=${currentTokenProfit.toFixed(2)}`);
          }

          statusText.textContent = `Holding ${state.currentTokenName}`;
          updateWageDisplay(hourlyWage);
          updatePNLDisplay(lastKnownPNL, totalProfit);
          updateDockedWidget(hourlyWage);
          updateMinWageMultiple(hourlyWage);
          updateGoalDisplay(totalProfit);
        } else {
          // No open position anywhere - show completed trades only
          debug(`NO POSITION: Token=${currentTokenId}, AxiomPNL=${currentPNL}, Holding=${holding}`);

          statusText.textContent = `No position (${state.sessionTrades.length} trades)`;

          const activeHours = getActiveTradeHours();
          const hourlyWage = activeHours > 0 ? completedProfit / activeHours : 0;
          updateWageDisplay(hourlyWage);
          updatePNLDisplay(currentPNL, completedProfit);
          updateDockedWidget(hourlyWage);
          updateMinWageMultiple(hourlyWage);
          updateGoalDisplay(completedProfit);
        }
      }
    } else {
      // Not on a trading page - show status
      const completedProfit = state.sessionTrades.reduce((sum, t) => sum + t.profit, 0);
      let currentTokenProfit = 0;
      let lastKnownPNL = 0;

      if (state.currentTokenId && state.currentTokenStartPNL !== null) {
        // Add current token's unrealized profit
        lastKnownPNL = state.currentTokenLastPNL !== null ? state.currentTokenLastPNL : state.currentTokenStartPNL;
        currentTokenProfit = lastKnownPNL - state.currentTokenStartPNL;
        statusText.textContent = `Browsing (${state.currentTokenName}: ${formatCurrency(lastKnownPNL)})`;
      } else if (state.sessionTrades.length > 0) {
        statusText.textContent = `${state.sessionTrades.length} trades completed`;
      } else {
        statusText.textContent = 'Waiting for trade...';
      }

      const totalProfit = completedProfit + currentTokenProfit;
      const activeHours = getActiveTradeHours();
      const hourlyWage = activeHours > 0 ? totalProfit / activeHours : 0;
      updateWageDisplay(hourlyWage);
      // Show last known Axiom PNL for tracked token
      updatePNLDisplay(lastKnownPNL, totalProfit);
      updateDockedWidget(hourlyWage);
      updateMinWageMultiple(hourlyWage);
      updateGoalDisplay(totalProfit);
    }
  }

  function updateWageDisplay(wage) {
    wageValue.textContent = formatCurrency(wage);

    // Color based on thresholds
    wageValue.className = 'wage-value';
    if (wage >= COLOR_THRESHOLDS.amazing) {
      wageValue.classList.add('tier-amazing');
    } else if (wage >= COLOR_THRESHOLDS.good) {
      wageValue.classList.add('tier-good');
    } else if (wage >= COLOR_THRESHOLDS.okay) {
      wageValue.classList.add('tier-okay');
    } else if (wage >= COLOR_THRESHOLDS.bad) {
      wageValue.classList.add('tier-meh');
    } else {
      wageValue.classList.add('tier-bad');
    }
  }

  function updateMinWageMultiple(wage) {
    const multiple = wage / MIN_WAGE;
    let text;

    if (multiple >= 1) {
      text = `${multiple.toFixed(1)}x min wage`;
    } else if (multiple > 0) {
      text = `${(multiple * 100).toFixed(0)}% of min wage`;
    } else if (multiple < 0) {
      text = `Losing ${Math.abs(multiple).toFixed(1)}x min wage`;
    } else {
      text = '0x min wage';
    }

    minWageMultiple.textContent = text;

    // Color it
    minWageMultiple.className = 'min-wage-multiple';
    if (multiple >= 5) {
      minWageMultiple.classList.add('tier-amazing');
    } else if (multiple >= 2) {
      minWageMultiple.classList.add('tier-good');
    } else if (multiple >= 1) {
      minWageMultiple.classList.add('tier-okay');
    } else if (multiple >= 0) {
      minWageMultiple.classList.add('tier-meh');
    } else {
      minWageMultiple.classList.add('tier-bad');
    }

    // Update tier message (only change when tier changes to avoid flickering)
    updateTierMessage(wage);
  }

  function updateTierMessage(hourlyWage) {
    // Determine current tier
    let currentTier;
    if (hourlyWage < -50) currentTier = 'disaster';
    else if (hourlyWage < 0) currentTier = 'losing';
    else if (hourlyWage < 15) currentTier = 'belowMin';
    else if (hourlyWage < 30) currentTier = 'minWage';
    else if (hourlyWage < 75) currentTier = 'decent';
    else if (hourlyWage < 150) currentTier = 'good';
    else if (hourlyWage < 500) currentTier = 'great';
    else currentTier = 'incredible';

    // Only change message when tier changes AND cooldown has passed (prevents spam)
    const now = Date.now();
    const cooldownPassed = (now - lastTierChangeTime) >= TIER_MESSAGE_COOLDOWN;

    if (currentTier !== lastTier && cooldownPassed) {
      lastTier = currentTier;
      lastTierChangeTime = now;
      lastTierMessage = getTierMessage(hourlyWage);
      if (tierMessage) {
        tierMessage.textContent = lastTierMessage;
        // Apply tier color class
        tierMessage.className = 'tier-message';
        if (currentTier === 'disaster' || currentTier === 'losing') {
          tierMessage.classList.add('tier-bad');
        } else if (currentTier === 'belowMin') {
          tierMessage.classList.add('tier-meh');
        } else if (currentTier === 'minWage') {
          tierMessage.classList.add('tier-okay');
        } else if (currentTier === 'decent' || currentTier === 'good') {
          tierMessage.classList.add('tier-good');
        } else {
          tierMessage.classList.add('tier-amazing');
        }
      }
    }
  }

  function updateElapsedTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    elapsedValue.textContent =
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0');
  }

  function updatePNLDisplay(currentProfit, sessionProfit) {
    // Current token P/L
    if (currentPnlValue) {
      currentPnlValue.textContent = formatCurrency(currentProfit);
      currentPnlValue.style.color = currentProfit >= 0 ? '#00ff88' : '#ff4466';
    }
    // Session total P/L
    if (sessionPnlValue) {
      sessionPnlValue.textContent = formatCurrency(sessionProfit);
      sessionPnlValue.style.color = sessionProfit >= 0 ? '#00ff88' : '#ff4466';
    }
  }

  function updateDockedWidget(hourlyWage) {
    if (dockedWidget) {
      const valueEl = dockedWidget.querySelector('.docked-value');
      if (valueEl) {
        valueEl.textContent = formatCurrency(hourlyWage);
        valueEl.style.color = hourlyWage >= 0 ? '#00ff88' : '#ff4466';
      }
    }
  }

  function updateGoalDisplay(currentSessionProfit = 0) {
    // SESSION goal - just this session's profit
    const sessionProfit = state.sessionActive ? currentSessionProfit : 0;
    const sessionPercentage = Math.min(100, Math.max(-100, (sessionProfit / state.dailyGoal) * 100));

    if (sessionGoalText) {
      sessionGoalText.textContent = `${formatCurrency(sessionProfit)} / ${formatCurrency(state.dailyGoal)}`;
    }
    if (sessionGoalProgress) {
      // Only fill bar for positive progress, negative shows as empty with red indicator
      const sessionFillWidth = sessionProfit < 0 ? 0 : Math.min(100, sessionPercentage);
      sessionGoalProgress.style.width = sessionFillWidth + '%';
      sessionGoalProgress.className = 'goal-progress session-goal-progress';
      if (sessionProfit < 0) {
        sessionGoalProgress.classList.add('goal-negative');
      } else if (sessionPercentage >= 100) {
        sessionGoalProgress.classList.add('goal-complete');
        // Show CASH OUT notification when SESSION goal is hit!
        if (!goalNotificationShown && state.sessionActive) {
          showCashOutNotification(sessionProfit);
          goalNotificationShown = true;
        }
      } else if (sessionPercentage >= 50) {
        sessionGoalProgress.classList.add('goal-half');
      }
    }

    // DAILY goal - all sessions today combined
    const todayEarnings = getTodayEarnings() + sessionProfit;
    const dailyPercentage = Math.min(100, Math.max(-100, (todayEarnings / state.dailyGoal) * 100));

    if (dailyGoalText) {
      dailyGoalText.textContent = `${formatCurrency(todayEarnings)} / ${formatCurrency(state.dailyGoal)}`;
    }
    if (dailyGoalProgress) {
      // Only fill bar for positive progress, negative shows as empty
      const dailyFillWidth = todayEarnings < 0 ? 0 : Math.min(100, dailyPercentage);
      dailyGoalProgress.style.width = dailyFillWidth + '%';
      dailyGoalProgress.className = 'goal-progress daily-goal-progress';
      if (todayEarnings < 0) {
        dailyGoalProgress.classList.add('goal-negative');
      } else if (dailyPercentage >= 100) {
        dailyGoalProgress.classList.add('goal-complete');
      } else if (dailyPercentage >= 50) {
        dailyGoalProgress.classList.add('goal-half');
      }
    }
  }

  // Find and click the 100% sell button on Axiom
  function clickSellButton() {
    // Look for the 100% sell button - it has text "100%" and class "text-decrease" (red/sell color)
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      // Check if this is the 100% sell button
      if (div.textContent.trim() === '100%' &&
        div.classList.contains('text-decrease') &&
        div.classList.contains('cursor-pointer')) {
        debug('AUTO-SELL: Found 100% sell button, clicking...');
        div.click();
        return true;
      }
    }

    // Fallback: look for any clickable element with 100% text near sell-related styling
    const buttons = document.querySelectorAll('[class*="decrease"][class*="cursor-pointer"]');
    for (const btn of buttons) {
      if (btn.textContent.trim() === '100%') {
        debug('AUTO-SELL: Found 100% button via fallback, clicking...');
        btn.click();
        return true;
      }
    }

    debug('AUTO-SELL: Could not find 100% sell button');
    return false;
  }

  // CASH OUT Notification with sound
  let cashOutAudioCtx = null; // Track audio context to stop it

  function showCashOutNotification(amount) {
    debug(`SESSION GOAL HIT! $${amount.toFixed(2)} - Showing CASH OUT notification`);

    // Play notification sound (cash register / success sound)
    cashOutAudioCtx = playCashOutSound();

    // Auto-sell if enabled (requires $WAGE access)
    let autoSellTriggered = false;
    if (state.autoSellOnGoal && hasWageAccess()) {
      debug('Auto-sell is enabled, attempting to sell...');
      // Small delay to let user see the notification first
      setTimeout(() => {
        autoSellTriggered = clickSellButton();
        if (autoSellTriggered) {
          debug('AUTO-SELL: Successfully clicked sell button!');
        }
      }, 500);
      autoSellTriggered = true; // Show in notification that we're attempting
    } else if (state.autoSellOnGoal && !hasWageAccess()) {
      debug('Auto-sell disabled - requires $WAGE tokens (testing mode: ' + WAGE_TESTING_MODE + ')');
    }

    // Create the notification bubble
    const notification = document.createElement('div');
    notification.className = 'cashout-notification';
    notification.innerHTML = `
      <div class="cashout-content">
        <div class="cashout-icon">${autoSellTriggered ? '🚀' : '💰'}</div>
        <div class="cashout-title">${autoSellTriggered ? 'AUTO-SELLING!' : 'CASH OUT!'}</div>
        <div class="cashout-subtitle">Session Goal Hit!</div>
        <div class="cashout-amount">${formatCurrency(amount)}</div>
        <div class="cashout-message">${autoSellTriggered ? 'Selling 100% automatically!' : 'Lock in your profits!'}</div>
        <button class="cashout-dismiss">Got it!</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Function to dismiss and stop sound
    const dismissNotification = () => {
      // Stop the sound
      if (cashOutAudioCtx) {
        try {
          cashOutAudioCtx.close();
        } catch (e) { }
        cashOutAudioCtx = null;
      }
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };

    // Dismiss button
    notification.querySelector('.cashout-dismiss').addEventListener('click', dismissNotification);

    // Click anywhere on notification to dismiss
    notification.addEventListener('click', dismissNotification);

    // Auto-dismiss after 7 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        dismissNotification();
      }
    }, 7000);
  }

  // Play cash out sound - single victory chime
  function playCashOutSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if suspended (required for some browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Victory fanfare - single play
      const notes = [
        { freq: 523.25, start: 0, duration: 0.15 },      // C5
        { freq: 659.25, start: 0.12, duration: 0.15 },   // E5
        { freq: 783.99, start: 0.24, duration: 0.15 },   // G5
        { freq: 1046.50, start: 0.36, duration: 0.5 },   // C6 (held)
      ];

      notes.forEach(note => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine'; // Sine wave - cleaner sound

        const noteStart = audioCtx.currentTime + note.start;
        gainNode.gain.setValueAtTime(0.4, noteStart);
        gainNode.gain.exponentialRampToValueAtTime(0.01, noteStart + note.duration);

        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration + 0.1);
      });

      debug('Cash out sound played');
      return audioCtx; // Return so we can stop it
    } catch (err) {
      debug(`Could not play sound: ${err.message}`);
      return null;
    }
  }

  function renderHistory() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const todaySessions = state.sessionHistory
      .filter(s => s.endTime >= todayTimestamp)
      .sort((a, b) => b.endTime - a.endTime);

    if (todaySessions.length === 0) {
      historyContainer.innerHTML = '<div class="history-empty">No sessions today</div>';
      return;
    }

    historyContainer.innerHTML = todaySessions.map(session => {
      const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Show active trade time if available, otherwise fall back to session duration
      const activeTradeMs = session.activeTradeTime || (session.trades ?
        session.trades.reduce((sum, t) => sum + (t.endTime - t.startTime), 0) :
        (session.endTime - session.startTime));
      const activeMins = Math.round(activeTradeMs / 60000);
      const activeSecs = Math.round((activeTradeMs % 60000) / 1000);

      // Handle both old format (single token) and new format (multiple tokens)
      const totalProfit = session.totalProfit !== undefined ? session.totalProfit : session.profit;
      const profitClass = totalProfit >= 0 ? 'profit-positive' : 'profit-negative';

      // Get token names
      let tokenNames;
      if (session.trades && session.trades.length > 0) {
        // New format with multiple trades
        const names = session.trades.map(t => t.tokenName).filter(n => n);
        tokenNames = names.length > 2
          ? `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
          : names.join(', ');
      } else {
        // Old format with single token
        tokenNames = session.tokenName || 'Unknown';
      }

      // Build trades breakdown for new format
      let tradesHtml = '';
      if (session.trades && session.trades.length > 0) {
        tradesHtml = `
          <div class="history-trades">
            ${session.trades.map(trade => {
          const tProfitClass = trade.profit >= 0 ? 'profit-positive' : 'profit-negative';
          return `<div class="history-trade-item">
                <span class="trade-token">${trade.tokenName}</span>
                <span class="${tProfitClass}">${formatCurrency(trade.profit)}</span>
              </div>`;
        }).join('')}
          </div>
        `;
      }

      // Format active time nicely
      const activeTimeStr = activeMins > 0 ? `${activeMins}m ${activeSecs}s` : `${activeSecs}s`;

      return `
        <div class="history-item">
          <div class="history-token">${tokenNames}</div>
          <div class="history-time">${startTime} - ${endTime} (active: ${activeTimeStr})</div>
          <div class="history-stats">
            <span class="${profitClass}">${formatCurrency(totalProfit)}</span>
            <span class="history-hourly">${formatCurrency(session.hourlyWage)}/hr</span>
          </div>
          ${tradesHtml}
        </div>
      `;
    }).join('');
  }

  function formatCurrency(value) {
    const absValue = Math.abs(value);
    let formatted;

    if (absValue >= 1000000) {
      formatted = '$' + (absValue / 1000000).toFixed(2) + 'M';
    } else if (absValue >= 1000) {
      formatted = '$' + (absValue / 1000).toFixed(2) + 'K';
    } else {
      formatted = '$' + absValue.toFixed(2);
    }

    return value < 0 ? '-' + formatted : formatted;
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
