# AnonHire Deployment Guide

Production deployment guide for AnonHire system.

## Overview

This guide covers:
- Smart contract deployment to mainnet
- Backend API deployment
- Frontend deployment
- Infrastructure setup
- Monitoring and maintenance

## Prerequisites

- All setup steps completed (see [SETUP.md](./SETUP.md))
- Production environment ready
- SSL certificates for HTTPS
- Domain names configured
- Production database
- Production-grade IPFS (Pinata Pro or own node)

## 1. Smart Contracts Deployment

### Prepare for Deployment

```bash
cd contracts

# Run all tests
npm test

# Run security checks
npm audit

# Generate gas report
REPORT_GAS=true npm test
```

### Deploy to Polygon Mainnet

```bash
# Configure .env for production
POLYGON_MAINNET_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_production_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Deploy
npm run deploy:polygon

# Verify on Polygonscan
npm run verify:polygon
```

### Post-Deployment

1. **Save Contract Addresses**
   ```bash
   # Update .env with deployed addresses
   CONTRACT_DID_REGISTRY=0x...
   CONTRACT_REVOCATION_REGISTRY=0x...
   CONTRACT_VERIFIABLE_CREDENTIAL=0x...
   ```

2. **Grant Roles**
   ```typescript
   // Script: contracts/scripts/setup-roles.ts
   import { ethers } from "hardhat";
   
   async function main() {
     const vcContract = await ethers.getContractAt(
       "VerifiableCredential",
       process.env.CONTRACT_VERIFIABLE_CREDENTIAL!
     );
     
     // Grant ISSUER_ROLE to universities/employers
     const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
     await vcContract.grantRole(ISSUER_ROLE, UNIVERSITY_ADDRESS);
     await vcContract.grantRole(ISSUER_ROLE, EMPLOYER_ADDRESS);
   }
   ```

3. **Test on Mainnet**
   - Issue test credential
   - Verify it works
   - Test revocation

## 2. Backend Deployment

### Option A: Docker + AWS ECS

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t anonhire-backend:latest .
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag anonhire-backend:latest \
     <account-id>.dkr.ecr.us-east-1.amazonaws.com/anonhire-backend:latest
   
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/anonhire-backend:latest
   ```

3. **ECS Task Definition**
   ```json
   {
     "family": "anonhire-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "containerDefinitions": [{
       "name": "backend",
       "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/anonhire-backend:latest",
       "portMappings": [{
         "containerPort": 3001,
         "protocol": "tcp"
       }],
       "environment": [
         {"name": "NODE_ENV", "value": "production"},
         {"name": "PORT", "value": "3001"}
       ],
       "secrets": [
         {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
         {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
       ]
     }]
   }
   ```

### Option B: Kubernetes

1. **Create Secrets**
   ```bash
   kubectl create secret generic anonhire-secrets \
     --from-env-file=.env.production
   ```

2. **Deployment YAML**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: anonhire-backend
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: anonhire-backend
     template:
       metadata:
         labels:
           app: anonhire-backend
       spec:
         containers:
         - name: backend
           image: anonhire-backend:latest
           ports:
           - containerPort: 3001
           envFrom:
           - secretRef:
               name: anonhire-secrets
           resources:
             requests:
               memory: "512Mi"
               cpu: "500m"
             limits:
               memory: "2Gi"
               cpu: "2000m"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: anonhire-backend
   spec:
     selector:
       app: anonhire-backend
     ports:
     - port: 80
       targetPort: 3001
     type: LoadBalancer
   ```

3. **Apply**
   ```bash
   kubectl apply -f k8s/backend-deployment.yaml
   ```

### Database Migration

```bash
# Run migrations on production
cd backend

# Backup first!
pg_dump $DATABASE_URL > backup.sql

# Run migration
npx prisma migrate deploy

# Verify
npx prisma db pull
```

## 3. Frontend Deployment

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Environment Variables**
   - Add in Vercel dashboard:
     - `NEXT_PUBLIC_API_URL`
     - `NEXT_PUBLIC_CHAIN_ID`
     - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### Option B: Docker + Nginx

1. **Build**
   ```bash
   cd frontend
   docker build -t anonhire-frontend:latest .
   ```

2. **Run**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e NEXT_PUBLIC_API_URL=https://api.anonhire.com \
     anonhire-frontend:latest
   ```

3. **Nginx Configuration**
   ```nginx
   server {
     listen 80;
     listen [::]:80;
     server_name anonhire.com www.anonhire.com;
     return 301 https://$server_name$request_uri;
   }
   
   server {
     listen 443 ssl http2;
     listen [::]:443 ssl http2;
     server_name anonhire.com www.anonhire.com;
     
     ssl_certificate /etc/letsencrypt/live/anonhire.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/anonhire.com/privkey.pem;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## 4. Infrastructure Setup

### Database (PostgreSQL)

**AWS RDS:**
```bash
aws rds create-db-instance \
  --db-instance-identifier anonhire-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username anonhire \
  --master-user-password <password> \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --multi-az \
  --vpc-security-group-ids sg-xxxxx
```

### Redis (Optional for caching)

```bash
docker run -d \
  --name anonhire-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass <password>
```

### Load Balancer

**AWS ALB:**
- Health check: `/health`
- Target group: Backend instances
- SSL certificate from ACM
- CORS headers configured

## 5. Monitoring

### Logging

**CloudWatch Logs:**
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

logger.add(new WinstonCloudWatch({
  logGroupName: 'anonhire-backend',
  logStreamName: `${process.env.NODE_ENV}-${Date.now()}`,
  awsRegion: 'us-east-1',
}));
```

### Metrics

**Prometheus + Grafana:**
```typescript
// backend/src/middleware/metrics.ts
import { register, Counter, Histogram } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Alerts

**CloudWatch Alarms:**
- CPU > 80%
- Memory > 80%
- Error rate > 1%
- Response time > 2s

## 6. Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Environment variables in secure vault
- [ ] Database encrypted at rest
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] API authentication enabled
- [ ] Smart contracts audited
- [ ] DDoS protection (CloudFlare)
- [ ] Security headers (Helmet.js)
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection

## 7. Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://api.anonhire.com/health

# Register test user
curl -X POST https://api.anonhire.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"address":"0x...","role":"CANDIDATE"}'

# Issue test credential
curl -X POST https://api.anonhire.com/api/v1/credentials/academic \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subjectAddress":"0x...","studentName":"Test","degree":"BS",...}'
```

### 2. Monitor

- Check logs for errors
- Monitor metrics dashboard
- Verify database connections
- Check IPFS uploads
- Test blockchain transactions

### 3. Backup

```bash
# Database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://anonhire-backups/
```

## 8. Rollback Plan

If issues occur:

1. **Revert Backend**
   ```bash
   kubectl rollout undo deployment/anonhire-backend
   ```

2. **Revert Frontend**
   ```bash
   vercel rollback
   ```

3. **Database Restore**
   ```bash
   gunzip < backup-YYYYMMDD.sql.gz | psql $DATABASE_URL
   ```

## 9. Maintenance

### Regular Tasks

- **Daily**: Check error logs
- **Weekly**: Review metrics, update dependencies
- **Monthly**: Security audit, performance review
- **Quarterly**: Disaster recovery test

### Updates

```bash
# Update dependencies
npm audit fix

# Test
npm test

# Deploy
npm run deploy:production
```

## Support

For production issues:
- On-call: [phone/pager]
- Email: ops@anonhire.com
- Slack: #anonhire-ops


