# $WAGE Tracker Widget (v2)

**"Are you a $500/hr trading god or a walmart greeter? now you'll know 💀"**

$WAGE Tracker is a Chrome Extension that calculates your real-time hourly wage while you trade. It sits on your screen, tracks your PnL (Profit and Loss), and either roasts you or hypes you up based on your performance.

## 🚀 Features

- **Real-time Hourly Wage**: See exactly how much you're making (or losing) per hour.
- **Session PnL**: Tracks profit across multiple tokens.
- **Vibe Check**: Dynamic messages that roast you when you're down and flex when you're up.
- **Persistent History**: Saves your daily performance even if you close the tab.
- **Share Your Wins**: "FLEX on X" button to tweet your results.

## 🛠️ Installation

### 1. Load the Extension
1.  Download or clone this repository.
2.  Open Chrome and go to `chrome://extensions`.
3.  Toggle **Developer mode** (top right corner).
4.  Click **Load unpacked**.
5.  Select the `AxiomHourlyWageWidget-v2` folder.

### 2. Configure Cloudflare Worker (Optional - For Devs)
This extension uses a Cloudflare Worker for feature flags and hiding API keys.
1.  Deploy `cloudflare-worker.js` to your Cloudflare account.
2.  Set your Helius API key as a secret variable `HELIUS_API_KEY`.
3.  Update the `WORKER_URL` in `background.js`.

## 🔮 Coming Soon & $WAGE Token

If this project gains traction, we're planning:
-   **$WAGE Token**: Holding unlocks PRO features.
-   **Voice Journaling**: Talk through your trades.
-   **Auto-Sell**: Automatically sell when you hit your hourly goal.
-   **AI Summaries**: Smart analysis of your trading session.

---
*Built by a degen, for degens.* ✌️
