#!/bin/bash

# VerifiAI Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, staging, production

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")

echo "🚀 Starting VerifiAI deployment to $ENVIRONMENT environment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: dev, staging, production"
    exit 1
fi

log_info "Deploying to $ENVIRONMENT environment"

# Change to project root
cd "$PROJECT_ROOT"

# Step 1: Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if required files exist
required_files=(
    "verifiai-site/package.json"
    "verifiai-site/prisma/schema.prisma"
    "verifiai-site/next.config.ts"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "Required file missing: $file"
        exit 1
    fi
done

log_success "Pre-deployment checks passed"

# Step 2: Environment-specific setup
case $ENVIRONMENT in
    "dev")
        log_info "Setting up development environment..."
        ENV_FILE="verifiai-site/.env.local"
        ;;
    "staging")
        log_info "Setting up staging environment..."
        ENV_FILE="verifiai-site/.env.staging"
        ;;
    "production")
        log_info "Setting up production environment..."
        ENV_FILE="verifiai-site/.env.production"
        ;;
esac

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    log_warning "Environment file not found: $ENV_FILE"
    log_info "Please create the environment file with required variables"
    
    # Create template if it doesn't exist
    if [[ "$ENVIRONMENT" == "dev" ]]; then
        log_info "Creating development environment template..."
        cat > "$ENV_FILE" << 'EOF'
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

# AI Provider (Optional for dev)
OPENAI_API_KEY="your-openai-api-key"

# Storage
STORAGE_TYPE="local"
STORAGE_LOCAL_PATH="./uploads"

# Billing (Test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
FILE_SIGNING_SECRET="your-file-signing-secret"
EOF
        log_success "Created development environment template: $ENV_FILE"
        log_warning "Please update the environment variables before continuing"
        exit 0
    fi
fi

# Step 3: Install dependencies
log_info "Installing dependencies..."
cd verifiai-site
npm ci
log_success "Dependencies installed"

# Step 4: Run tests (skip in production for speed)
if [[ "$ENVIRONMENT" != "production" ]]; then
    log_info "Running tests..."
    
    # Type checking
    log_info "Running type check..."
    npm run type-check
    log_success "Type check passed"
    
    # Unit tests
    if command -v jest &> /dev/null; then
        log_info "Running unit tests..."
        npm run test -- --passWithNoTests
        log_success "Unit tests passed"
    else
        log_warning "Jest not found, skipping unit tests"
    fi
    
    # Linting
    log_info "Running linter..."
    npm run lint
    log_success "Linting passed"
else
    log_warning "Skipping tests in production deployment"
fi

# Step 5: Database setup
log_info "Setting up database..."

# Generate Prisma client
log_info "Generating Prisma client..."
npm run db:generate
log_success "Prisma client generated"

# Run migrations
if [[ "$ENVIRONMENT" == "dev" ]]; then
    log_info "Pushing database schema (development)..."
    npm run db:push
else
    log_info "Running database migrations..."
    npm run db:deploy
fi
log_success "Database setup completed"

# Step 6: Build application
log_info "Building application..."
npm run build
log_success "Application built successfully"

# Step 7: Environment-specific deployment
case $ENVIRONMENT in
    "dev")
        log_info "Starting development server..."
        log_success "Development deployment completed!"
        log_info "Run 'npm run dev' to start the development server"
        ;;
    "staging")
        log_info "Preparing staging deployment..."
        
        # Create deployment package
        log_info "Creating deployment package..."
        tar -czf "../verifiai-staging-$(date +%Y%m%d-%H%M%S).tar.gz" \
            .next/ \
            public/ \
            package.json \
            package-lock.json \
            prisma/ \
            node_modules/.prisma/
        
        log_success "Staging deployment package created"
        log_info "Upload the package to your staging server and run 'npm start'"
        ;;
    "production")
        log_info "Preparing production deployment..."
        
        # Security check
        log_info "Running security checks..."
        if grep -r "console.log" .next/ 2>/dev/null; then
            log_warning "Console.log statements found in production build"
        fi
        
        # Create deployment package
        log_info "Creating production deployment package..."
        tar -czf "../verifiai-production-$(date +%Y%m%d-%H%M%S).tar.gz" \
            .next/ \
            public/ \
            package.json \
            package-lock.json \
            prisma/ \
            node_modules/.prisma/
        
        log_success "Production deployment package created"
        log_info "Upload the package to your production server"
        log_warning "Remember to run database migrations on production: npm run db:deploy"
        ;;
esac

# Step 8: Post-deployment checks
log_info "Running post-deployment checks..."

# Check if build artifacts exist
if [[ -d ".next" ]]; then
    log_success "Next.js build artifacts found"
else
    log_error "Next.js build artifacts missing"
    exit 1
fi

# Check if Prisma client is generated
if [[ -d "node_modules/.prisma" ]]; then
    log_success "Prisma client generated"
else
    log_error "Prisma client missing"
    exit 1
fi

log_success "Post-deployment checks passed"

# Step 9: Deployment summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $(date)"
echo "Build artifacts: ✅"
echo "Database: ✅"
echo "Dependencies: ✅"

if [[ "$ENVIRONMENT" != "dev" ]]; then
    echo ""
    echo "📦 Deployment package created"
    echo "Next steps:"
    echo "1. Upload the deployment package to your server"
    echo "2. Extract the package"
    echo "3. Set up environment variables"
    echo "4. Run 'npm start' to start the production server"
    echo "5. Configure reverse proxy (nginx/Apache)"
    echo "6. Set up SSL certificates"
fi

echo ""
log_success "Deployment to $ENVIRONMENT completed successfully! 🚀"
