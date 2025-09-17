# VerifiAI Deployment Guide

This guide covers the deployment sequence from development to production for the VerifiAI contract analysis platform.

## Environment Overview

### 1. Development Environment
- **Database**: Local PostgreSQL or SQLite
- **File Storage**: Local disk (`./uploads/`)
- **AI Provider**: OpenAI API (optional for testing)
- **Authentication**: NextAuth with GitHub/Google (dev keys)
- **Billing**: Mock Stripe integration
- **Monitoring**: Console logging only

### 2. Staging Environment
- **Database**: PostgreSQL (managed service)
- **File Storage**: S3 EU (Frankfurt/Ireland)
- **AI Provider**: OpenAI API (production keys)
- **Authentication**: NextAuth with production OAuth apps
- **Billing**: Stripe test mode
- **Monitoring**: Sentry enabled

### 3. Production Environment
- **Database**: PostgreSQL (managed service with backups)
- **File Storage**: S3 EU with CDN
- **AI Provider**: OpenAI API (production keys)
- **Authentication**: NextAuth with production OAuth apps
- **Billing**: Stripe live mode
- **Monitoring**: Sentry + structured logging

## Deployment Steps

### Phase 1: Development Ready

#### Prerequisites
- [x] Local database setup (PostgreSQL recommended)
- [x] Environment variables configured
- [x] File storage working locally
- [x] AI analysis functional (with/without API key)
- [x] Authentication working
- [x] All tests passing

#### Environment Variables (.env.local)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/verifiai_dev"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# AI Provider
OPENAI_API_KEY="your-openai-api-key" # Optional for dev

# Storage
STORAGE_TYPE="local"
STORAGE_LOCAL_PATH="./uploads"

# Billing (Mock)
STRIPE_SECRET_KEY="sk_test_..." # Test key
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Test key
STRIPE_WEBHOOK_SECRET="whsec_..." # Test webhook secret

# Security
FILE_SIGNING_SECRET="your-file-signing-secret"

# Monitoring (Optional in dev)
SENTRY_DSN="" # Leave empty for dev
```

#### Development Commands
```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Run development server
npm run dev

# Run tests
npm test
npm run test:e2e
```

### Phase 2: Staging Deployment

#### Infrastructure Setup
1. **Database**: Set up managed PostgreSQL (AWS RDS, Railway, Supabase)
2. **File Storage**: Create S3 bucket in EU region
3. **Domain**: Configure staging subdomain (e.g., staging.verifiai.com)
4. **SSL**: Enable HTTPS with automatic certificates

#### Environment Variables (Staging)
```bash
# Database
DATABASE_URL="postgresql://user:pass@staging-db.region.rds.amazonaws.com:5432/verifiai_staging"

# NextAuth
NEXTAUTH_SECRET="staging-nextauth-secret-32-chars-min"
NEXTAUTH_URL="https://staging.verifiai.com"

# OAuth Providers (Staging Apps)
GITHUB_ID="staging-github-app-id"
GITHUB_SECRET="staging-github-app-secret"
GOOGLE_CLIENT_ID="staging-google-client-id"
GOOGLE_CLIENT_SECRET="staging-google-client-secret"

# AI Provider
OPENAI_API_KEY="sk-..." # Production OpenAI key

# Storage
STORAGE_TYPE="s3"
S3_BUCKET="verifiai-staging-eu"
S3_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="staging-aws-access-key"
AWS_SECRET_ACCESS_KEY="staging-aws-secret-key"

# Billing (Test Mode)
STRIPE_SECRET_KEY="sk_test_..." # Stripe test key
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Stripe test key
STRIPE_WEBHOOK_SECRET="whsec_..." # Staging webhook secret

# Price IDs (Test)
STRIPE_PRICE_PAY_PER_CONTRACT="price_test_..."
STRIPE_PRICE_PROFESSIONAL="price_test_..."
STRIPE_PRICE_ENTERPRISE="price_test_..."

# Security
FILE_SIGNING_SECRET="staging-file-signing-secret"

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
NODE_ENV="production"
```

#### Staging Deployment Commands
```bash
# Build application
npm run build

# Run database migrations
npx prisma deploy

# Start production server
npm start
```

### Phase 3: Production Deployment

#### Infrastructure Requirements
1. **Database**: Production PostgreSQL with automated backups
2. **File Storage**: S3 EU with CloudFront CDN
3. **Domain**: Production domain with SSL
4. **Load Balancer**: For high availability
5. **Monitoring**: Sentry, CloudWatch, or similar
6. **Backup Strategy**: Database and file backups

#### Environment Variables (Production)
```bash
# Database
DATABASE_URL="postgresql://user:pass@prod-db.region.rds.amazonaws.com:5432/verifiai_prod"

# NextAuth
NEXTAUTH_SECRET="production-nextauth-secret-64-chars-minimum"
NEXTAUTH_URL="https://app.verifiai.com"

# OAuth Providers (Production Apps)
GITHUB_ID="prod-github-app-id"
GITHUB_SECRET="prod-github-app-secret"
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="prod-google-client-secret"

# AI Provider
OPENAI_API_KEY="sk-..." # Production OpenAI key with higher limits

# Storage
STORAGE_TYPE="s3"
S3_BUCKET="verifiai-prod-eu"
S3_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="prod-aws-access-key"
AWS_SECRET_ACCESS_KEY="prod-aws-secret-key"

# CDN (Optional)
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"

# Billing (Live Mode)
STRIPE_SECRET_KEY="sk_live_..." # Stripe live key
STRIPE_PUBLISHABLE_KEY="pk_live_..." # Stripe live key
STRIPE_WEBHOOK_SECRET="whsec_..." # Production webhook secret

# Price IDs (Live)
STRIPE_PRICE_PAY_PER_CONTRACT="price_live_..."
STRIPE_PRICE_PROFESSIONAL="price_live_..."
STRIPE_PRICE_ENTERPRISE="price_live_..."

# Security
FILE_SIGNING_SECRET="production-file-signing-secret-64-chars"

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
NODE_ENV="production"

# Rate Limiting (Production values)
RATE_LIMIT_WINDOW_MS="900000" # 15 minutes
RATE_LIMIT_MAX_REQUESTS="100"
```

## Security Checklist

### Pre-Production Security Review
- [ ] All secrets are properly secured (not in code)
- [ ] Database connections use SSL
- [ ] File uploads are properly validated and scanned
- [ ] Rate limiting is enabled on all endpoints
- [ ] PII scrubbing is active in logs
- [ ] Signed URLs are used for file access
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information

### GDPR Compliance (EU)
- [ ] Data processing agreements in place
- [ ] User consent mechanisms implemented
- [ ] Data retention policies defined
- [ ] Right to deletion implemented
- [ ] Data export functionality available
- [ ] Privacy policy updated
- [ ] Cookie consent implemented

## Monitoring & Alerting

### Key Metrics to Monitor
- API response times and error rates
- Database connection pool usage
- File upload success/failure rates
- AI analysis completion rates
- User authentication success rates
- Billing webhook processing
- Storage usage and costs

### Alerts to Configure
- High error rates (>5% in 5 minutes)
- Database connection failures
- AI service unavailability
- Failed payment processing
- Unusual file upload patterns
- Security events (multiple failed logins)

## Backup Strategy

### Database Backups
- Automated daily backups with 30-day retention
- Point-in-time recovery capability
- Cross-region backup replication
- Regular restore testing

### File Storage Backups
- S3 versioning enabled
- Cross-region replication for critical files
- Lifecycle policies for cost optimization

## Rollback Plan

### Quick Rollback Steps
1. Revert to previous deployment
2. Restore database from backup if needed
3. Update DNS if necessary
4. Verify all services are operational
5. Communicate status to users

### Database Migration Rollbacks
- Always test migrations on staging first
- Keep rollback scripts for schema changes
- Use feature flags for risky changes
- Monitor closely after migrations

## Performance Optimization

### Production Optimizations
- Enable Next.js static optimization
- Configure CDN for static assets
- Implement database query optimization
- Use connection pooling
- Enable gzip compression
- Implement caching strategies

### Scaling Considerations
- Horizontal scaling with load balancers
- Database read replicas for analytics
- Separate AI processing to background jobs
- Implement queue system for heavy operations

## Cost Optimization

### AWS Cost Management
- Use S3 Intelligent Tiering
- Implement CloudWatch cost alerts
- Regular review of unused resources
- Reserved instances for predictable workloads

### Third-Party Service Costs
- Monitor OpenAI API usage and costs
- Optimize Stripe transaction fees
- Review Sentry event quotas
- Monitor Vercel/hosting costs

## Support & Maintenance

### Regular Maintenance Tasks
- Security updates (weekly)
- Dependency updates (monthly)
- Database maintenance (monthly)
- Log cleanup (weekly)
- Performance reviews (monthly)
- Cost reviews (monthly)

### Emergency Contacts
- Technical lead: [contact info]
- Infrastructure team: [contact info]
- Security team: [contact info]
- Business stakeholders: [contact info]
