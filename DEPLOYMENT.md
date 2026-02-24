# Deployment Guide

This guide covers deploying the Thirukural Learning Web App to various platforms.

## Platform Support

The app is designed to work on any platform that supports Node.js applications. Here are the most common deployment options:

## Replit (Recommended)

### Setup
1. Import repository to Replit
2. Set environment variables in Secrets tab:
   ```
   SESSION_SECRET=your-session-secret
   NODE_ENV=production
   ```
3. The app will automatically start with the configured workflow

### Features
- Zero-config deployment
- Automatic HTTPS
- Built-in domain (`.replit.app`)
- Environment variable management
- Automatic restarts

## Vercel

### Setup
1. Connect GitHub repository to Vercel
2. Configure build settings:
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
3. Set environment variables in dashboard
4. Deploy

### Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/$1"
    }
  ]
}
```

## Railway

### Setup
1. Connect GitHub repository
2. Railway will auto-detect Node.js app
3. Set environment variables
4. Deploy

### Configuration
Create `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

## Netlify

### Setup
1. Connect GitHub repository
2. Build settings:
   ```
   Build Command: npm run build
   Publish Directory: dist
   ```
3. Configure serverless functions for API routes
4. Set environment variables

### API Routes
Create `netlify/functions` directory and convert Express routes to Netlify functions.

## Heroku

### Setup
1. Create Heroku app
2. Connect GitHub repository
3. Set environment variables:
   ```bash
   heroku config:set SESSION_SECRET=your-secret
   heroku config:set NODE_ENV=production
   ```
4. Deploy

### Configuration
Create `Procfile`:
```
web: npm start
```

## Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - SESSION_SECRET=your-secret
      - NODE_ENV=production
```

## Custom VPS/Server

### Prerequisites
- Node.js 18+
- npm
- Process manager (PM2 recommended)

### Setup
1. Clone repository
2. Install dependencies: `npm ci --production`
3. Build application: `npm run build`
4. Set environment variables
5. Start with PM2: `pm2 start ecosystem.config.js`

### PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'thirukural-app',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
}
```

## Environment Variables

### Required
- `SESSION_SECRET` - Secret key for session management

### Optional
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

## SSL/HTTPS

### Automatic (Recommended)
Most platforms provide automatic HTTPS:
- Replit: Built-in HTTPS
- Vercel: Automatic SSL
- Netlify: Free SSL certificates
- Railway: HTTPS included

### Manual Setup
For custom servers, use:
- Let's Encrypt with Certbot
- Cloudflare proxy
- Load balancer with SSL termination

## Performance Optimization

### Build Optimization
```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
}
```

### CDN Integration
- Serve static assets from CDN
- Use image optimization services
- Enable gzip compression

### Caching
- Set proper cache headers
- Use service workers for offline support
- Implement Redis for session storage (if scaling)

## Monitoring

### Health Checks
Add health check endpoint:
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Logging
- Use structured logging (Winston, Pino)
- Monitor application metrics
- Set up error tracking (Sentry)

## Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement sticky sessions
- Consider Redis for session storage

### Performance
- Enable gzip compression
- Optimize bundle size
- Use lazy loading for components

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Runtime Errors**
   - Ensure environment variables are set
   - Check file permissions
   - Verify port availability

3. **Audio/Video Issues**
   - Confirm HTTPS is enabled (required for audio)
   - Test external media URLs
   - Check CORS policies

### Debug Mode
Enable debug logging:
```bash
DEBUG=* npm start
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Session secret is random and secure
- [ ] File upload restrictions (if applicable)
- [ ] Rate limiting configured
- [ ] Security headers set

## Backup and Recovery

### Data Backup
Since the app uses in-memory storage:
- Export kuraldata before deployments
- Keep Google Sheets as primary data source
- Document content update procedures

### Recovery Plan
1. Redeploy from GitHub
2. Restore environment variables
3. Sync content from Google Sheets
4. Verify functionality

## Cost Optimization

### Free Tiers
- Replit: Generous free tier
- Vercel: Free for small projects
- Netlify: Free tier available
- Railway: $5/month for starter

### Paid Options
- Choose based on traffic needs
- Monitor usage and costs
- Consider reserved instances for consistent traffic

---

Choose the deployment platform that best fits your needs, technical expertise, and budget. Replit is recommended for quick deployment and testing, while Vercel or Railway are excellent for production use.