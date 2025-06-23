# 🚀 LocalPulse Dashboard Deployment Guide

## Architecture Overview
- **Frontend**: Netlify (Static hosting)
- **Backend**: Railway (Node.js/Express API)
- **APIs**: Miami 311, FL511 Traffic Cameras, OpenWeather

## 📋 Pre-Deployment Checklist

### 1. Get API Keys
- [ ] OpenWeather API key from [openweathermap.org](https://openweathermap.org/api)
- [ ] FL511 camera tokens (check browser network tab on FL511.com)

### 2. Prepare Repository
```bash
# Ensure you're in the project directory
cd FIU_V2/localpulse_clean

# Add all files to git
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 🔧 Backend Deployment (Railway)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### Step 2: Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your repository
3. Choose the `FIU_V2/localpulse_clean` folder as root
4. Railway will auto-detect Node.js and deploy

### Step 3: Configure Environment Variables
In Railway dashboard → Variables:
```
NODE_ENV=production
PORT=8080
OPENWEATHER_API_KEY=your_actual_key_here
CORS_ORIGIN=https://your-netlify-site.netlify.app
```

### Step 4: Get Backend URL
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Save this URL for frontend configuration

## 🌐 Frontend Deployment (Netlify)

### Step 1: Update API Configuration
Edit `js/secure-config.js` to point to your Railway backend:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-railway-app.railway.app',
    // ... rest of config
};
```

### Step 2: Update Netlify Configuration
Edit `netlify.toml` and replace `your-backend-url.railway.app` with your actual Railway URL.

### Step 3: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Set build settings:
   - **Build command**: `echo 'Static build'`
   - **Publish directory**: `FIU_V2/localpulse_clean`

### Step 4: Configure Custom Domain (Optional)
- Go to Site settings → Domain management
- Add custom domain if available

## 🔒 Security Configuration

### Update CORS in Backend
Edit `server.js` line ~15:
```javascript
app.use(cors({
    origin: 'https://your-netlify-site.netlify.app',
    // ... rest of CORS config
}));
```

### Environment Variables Security
Never commit actual API keys! Use Railway's environment variables.

## 🧪 Testing Deployment

### 1. Test Backend API
```bash
curl https://your-railway-app.railway.app/api/dashboard/summary
```

### 2. Test Frontend
Visit your Netlify URL and verify:
- [ ] Dashboard loads
- [ ] Real-time data appears
- [ ] Vehicle detection works
- [ ] Weather data loads
- [ ] No CORS errors in console

## 🚨 Troubleshooting

### Common Issues

#### CORS Errors
- Verify `CORS_ORIGIN` in Railway matches your Netlify URL
- Check `netlify.toml` redirects point to correct Railway URL

#### API Not Loading
- Check Railway logs: Dashboard → Deployments → View Logs
- Verify environment variables are set correctly

#### Camera Streams Not Working
- FL511 tokens expire regularly
- Update tokens in Railway environment variables
- Check browser network tab for new token format

#### Build Failures
- Ensure `package.json` has correct start script
- Check Railway build logs for specific errors

## 📊 Monitoring

### Railway Monitoring
- Dashboard shows CPU, memory, and request metrics
- Logs available in real-time
- Set up alerts for downtime

### Netlify Monitoring
- Analytics show page views and performance
- Build logs show deployment status
- Form submissions if using contact forms

## 🔄 Updates and Maintenance

### Updating Code
1. Push changes to GitHub
2. Railway auto-deploys backend
3. Netlify auto-deploys frontend

### Updating FL511 Tokens
1. Go to FL511.com
2. Open browser dev tools → Network tab
3. Find new HLS stream URLs with fresh tokens
4. Update in Railway environment variables

### Scaling (If Needed)
- Railway: Upgrade plan for more resources
- Netlify: Pro plan for advanced features

## 📱 Mobile Optimization

The dashboard is already mobile-responsive, but verify:
- [ ] Touch interactions work
- [ ] Charts render properly on mobile
- [ ] Video detection works on mobile browsers

## 🎯 Hackathon Demo Tips

1. **Prepare Backup Plan**: Have screenshots ready if live demo fails
2. **Test Beforehand**: Verify everything works 30 minutes before demo
3. **Monitor Status**: Keep Railway/Netlify dashboards open during demo
4. **Have Fallbacks**: Prepare static data if APIs are down

## 📞 Support

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **FL511 API**: [fl511.com](https://fl511.com)

---

**Ready to deploy? Follow steps in order and your LocalPulse dashboard will be live! 🚀** 