# Deployment Guide - AWS EU Region

This guide covers deploying the Microsoft Graph Dashboard MVP to AWS in the EU region for data residency compliance.

## Prerequisites

- AWS account with access to EU regions
- Domain name (optional, for production)
- SSL certificate (Let's Encrypt or AWS Certificate Manager)
- Microsoft Azure AD app registration configured with production URLs

## Architecture

```
┌─────────────┐
│  CloudFront │ (EU Edge Locations)
│  (Frontend) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  S3 Bucket  │ (EU Region: eu-west-1)
│  (Static)   │
└─────────────┘

┌─────────────┐
│  EC2/EB     │ (EU Region: eu-west-1)
│  (Backend)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Microsoft  │
│  Graph API  │
└─────────────┘
```

## Step 1: Backend Deployment

### Option A: EC2 Instance

1. **Launch EC2 Instance**:
   ```bash
   # In AWS Console or CLI
   # Region: eu-west-1 (Ireland) or eu-central-1 (Frankfurt)
   # Instance Type: t3.small or larger
   # OS: Ubuntu 22.04 LTS
   ```

2. **Connect and Setup**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Clone repository
   git clone <your-repo-url>
   cd microsoft-graph/backend
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   ```

3. **Configure Environment**:
   ```bash
   # Create .env file
   nano .env
   ```
   
   Add production values:
   ```env
   CLIENT_ID=your-production-client-id
   CLIENT_SECRET=your-production-client-secret
   TENANT_ID=common
   PORT=3001
   NODE_ENV=production
   SESSION_SECRET=generate-strong-random-secret
   FRONTEND_URL=https://your-frontend-domain.com
   REDIRECT_URI=https://your-backend-domain.com/auth/callback
   ```

4. **Start with PM2**:
   ```bash
   pm2 start dist/server.js --name graph-api
   pm2 save
   pm2 startup  # Follow instructions to enable on boot
   ```

5. **Configure Nginx (Reverse Proxy)**:
   ```bash
   sudo apt install nginx
   
   # Create config
   sudo nano /etc/nginx/sites-available/graph-api
   ```
   
   Nginx config:
   ```nginx
   server {
       listen 80;
       server_name your-backend-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/graph-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-backend-domain.com
   ```

### Option B: AWS Elastic Beanstalk

1. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**:
   ```bash
   cd backend
   eb init -p node.js -r eu-west-1
   ```

3. **Create Environment**:
   ```bash
   eb create graph-api-prod --region eu-west-1
   ```

4. **Set Environment Variables**:
   ```bash
   eb setenv CLIENT_ID=xxx CLIENT_SECRET=xxx ...
   ```

5. **Deploy**:
   ```bash
   npm run build
   eb deploy
   ```

## Step 2: Frontend Deployment

### Option A: S3 + CloudFront

1. **Create S3 Bucket** (EU Region):
   ```bash
   aws s3 mb s3://graph-dashboard-frontend --region eu-west-1
   ```

2. **Build Frontend**:
   ```bash
   cd frontend
   # Update VITE_API_URL in .env.production
   echo "VITE_API_URL=https://your-backend-domain.com" > .env.production
   npm run build
   ```

3. **Upload to S3**:
   ```bash
   aws s3 sync dist/ s3://graph-dashboard-frontend --region eu-west-1
   ```

4. **Configure S3 for Static Hosting**:
   - In S3 Console, enable static website hosting
   - Set index document: `index.html`
   - Set error document: `index.html` (for React Router)

5. **Create CloudFront Distribution**:
   - Origin: S3 bucket (or S3 website endpoint)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Default Root Object: `index.html`
   - Error Pages: 404 → `/index.html` (200)
   - Price Class: Use only EU edge locations
   - Alternate Domain Names: your-frontend-domain.com

6. **SSL Certificate**:
   - Request certificate in AWS Certificate Manager (ACM)
   - Must be in `us-east-1` for CloudFront
   - Add to CloudFront distribution

7. **Update DNS**:
   - Create CNAME record pointing to CloudFront distribution domain

### Option B: AWS Amplify

1. **Connect Repository**:
   - Go to AWS Amplify Console
   - Connect GitHub/GitLab repository
   - Select branch

2. **Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/dist
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```

3. **Environment Variables**:
   - Add `VITE_API_URL` in Amplify console

4. **Deploy**:
   - Amplify will automatically deploy on push

## Step 3: Azure AD Configuration

1. **Update App Registration**:
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Select your app
   - Add redirect URI: `https://your-backend-domain.com/auth/callback`
   - Update API permissions (ensure admin consent)
   - Note: Redirect URI must match exactly

2. **Update Environment Variables**:
   - Use production Client ID and Secret in backend `.env`

## Step 4: Security Hardening

1. **Security Groups**:
   - Backend: Allow HTTPS (443) from CloudFront only
   - Remove SSH access from public IPs (use VPN/Bastion)

2. **Environment Variables**:
   - Use AWS Systems Manager Parameter Store or Secrets Manager
   - Never commit `.env` files

3. **Rate Limiting**:
   - Consider adding rate limiting middleware
   - Use AWS WAF for CloudFront

4. **Monitoring**:
   - Set up CloudWatch alarms
   - Monitor API errors and response times
   - Set up PM2 monitoring (if using EC2)

## Step 5: Data Residency Verification

1. **Verify Region**:
   - EC2 instance: Check region in AWS Console
   - S3 bucket: Verify region in bucket properties
   - CloudFront: Confirm EU edge locations only

2. **Network Traffic**:
   - Ensure all traffic stays within EU
   - Monitor CloudWatch for any cross-region data transfer

## Troubleshooting

### Backend Not Starting
- Check PM2 logs: `pm2 logs graph-api`
- Verify environment variables: `pm2 env graph-api`
- Check port availability: `netstat -tulpn | grep 3001`

### Frontend Not Loading
- Check CloudFront distribution status
- Verify S3 bucket permissions
- Check browser console for CORS errors
- Verify `VITE_API_URL` in build

### Authentication Failing
- Verify redirect URI matches Azure AD configuration exactly
- Check backend logs for OAuth errors
- Verify Client ID and Secret are correct

## Cost Optimization

- Use EC2 Spot Instances for development
- Enable S3 lifecycle policies for old builds
- Use CloudFront caching effectively
- Monitor and optimize instance sizes

## Maintenance

1. **Updates**:
   ```bash
   # Backend
   git pull
   npm install
   npm run build
   pm2 restart graph-api
   
   # Frontend
   cd frontend
   git pull
   npm install
   npm run build
   aws s3 sync dist/ s3://graph-dashboard-frontend
   # CloudFront will auto-invalidate or manually invalidate cache
   ```

2. **Backups**:
   - Environment variables in Parameter Store
   - Code in version control
   - No database to backup (stateless)

## Support

For AWS-specific issues, refer to:
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

