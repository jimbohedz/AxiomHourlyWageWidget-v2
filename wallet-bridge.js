// Wallet Bridge - Runs in MAIN world to access Phantom wallet
// This script can directly access window.solana (Phantom)

(function () {
  'use strict';

  // console.log('[WalletBridge] Initializing in MAIN world...');

  // Listen for messages from content script
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'axiom-wage-widget') return;

    const { action, id } = event.data;

    if (action === 'checkPhantom') {
      const hasPhantom = !!(window.solana && window.solana.isPhantom);
      // console.log('[WalletBridge] checkPhantom:', hasPhantom);
      window.postMessage({
        source: 'axiom-wage-page',
        id: id,
        result: hasPhantom
      }, '*');
    }

    if (action === 'connectWallet') {
      try {
        if (!window.solana || !window.solana.isPhantom) {
          throw new Error('Phantom not found');
        }
        // console.log('[WalletBridge] Connecting to Phantom...');
        const response = await window.solana.connect();
        const publicKey = response.publicKey.toString();
        // console.log('[WalletBridge] Connected:', publicKey.substring(0, 8) + '...');
        window.postMessage({
          source: 'axiom-wage-page',
          id: id,
          result: { success: true, publicKey: publicKey }
        }, '*');
      } catch (err) {
        // console.log('[WalletBridge] Connection error:', err.message);
        window.postMessage({
          source: 'axiom-wage-page',
          id: id,
          result: { success: false, error: err.message }
        }, '*');
      }
    }

    if (action === 'disconnectWallet') {
      try {
        if (window.solana && window.solana.disconnect) {
          await window.solana.disconnect();
        }
        // console.log('[WalletBridge] Disconnected');
        window.postMessage({
          source: 'axiom-wage-page',
          id: id,
          result: { success: true }
        }, '*');
      } catch (err) {
        // console.log('[WalletBridge] Disconnect error:', err.message);
        window.postMessage({
          source: 'axiom-wage-page',
          id: id,
          result: { success: false, error: err.message }
        }, '*');
      }
    }
  });

  // Signal that bridge is ready
  window.postMessage({ source: 'axiom-wage-page', action: 'ready' }, '*');
  // console.log('[WalletBridge] Ready');
})();
