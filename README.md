# Kairos 刻 · AI Agent
### Temporal Intelligence — Netlify Edition

A premium black & teal AI productivity agent. Deploy in minutes to Netlify.

---

## ⚡ Quick Deploy

### 1. Get your Anthropic API key
→ https://console.anthropic.com/keys

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Kairos AI Agent"
git remote add origin https://github.com/YOUR_USER/kairos-agent.git
git push -u origin main
```

### 3. Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Connect your GitHub repo
3. Set **Build command**: _(leave blank)_
4. Set **Publish directory**: `/`
5. Click **Deploy site**

### 4. Add your API key
In Netlify dashboard → **Site Settings** → **Environment Variables**:
```
KAIROS_API_KEY = sk-ant-your-actual-key-here
```

Then in `index.html`, just before `</body>`, add:
```html
<script>window.KAIROS_API_KEY = "{{ KAIROS_API_KEY }}";</script>
```

Redeploy → ✅ Live!

---

## 📱 Install on Phone (PWA)

**Android:** Chrome → 3-dot menu → "Add to Home Screen"  
**iPhone:** Safari → Share → "Add to Home Screen"

---

## ✦ Features

| Feature | Details |
|---|---|
| **Dashboard** | Aurora city skyline hero, Priority inbox, Motivation, Scripture |
| **Mail Tab** | Full inbox view, filters, reply composer with AI draft |
| **Events Tab** | Google Calendar events, clickable details, prep tasks |
| **Web Search** | Live search with history sidebar |
| **Command** | AI agent chat with voice input |
| **Missions** | Task log with priority levels |

---

## 🔑 API Note

This app calls the Anthropic API directly from the browser.  
For production, consider routing through a Netlify serverless function to hide your key.

---

*Kairos (刻) — "the right, critical, or opportune moment"*
