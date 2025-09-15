# 🚀 MediChain Deployment Guide

## 📋 Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- Database (SQLite for development, PostgreSQL/MySQL for production)
- Web server (IIS, Nginx, Apache)

## 🔒 Security Configuration

### 1. JWT Secret Key
**CRITICAL**: Change the JWT secret key before deployment:

```bash
# Generate a secure 32+ character key
openssl rand -base64 32
```

Update in:
- `backend/appsettings.json` → `JWT.Key`
- Production environment variables

### 2. Environment Variables

**Backend (.NET):**
```bash
export JWT_SECRET_KEY="your-secure-jwt-key-here"
export JWT_ISSUER="MediChain.Api"
export JWT_AUDIENCE="MediChain.Client"
export ASPNETCORE_ENVIRONMENT="Production"
```

**Frontend (Next.js):**
```bash
export API_URL="https://your-api-domain.com"
export NEXT_PUBLIC_API_URL="https://your-api-domain.com"
```

## 🏗️ Build Process

### Backend
```bash
cd backend
dotnet restore
dotnet build --configuration Release
dotnet publish --configuration Release --output ./publish
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

## 🌐 Deployment Options

### Option 1: Docker (Recommended)

**Backend Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish/ .
EXPOSE 5001
ENTRYPOINT ["dotnet", "MediChain.Api.dll"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 2: Traditional Hosting

**Backend (IIS/Linux):**
1. Copy `publish/` folder to server
2. Configure web server to serve .NET application
3. Set environment variables
4. Start service

**Frontend (Static Hosting):**
1. Upload `out/` folder to CDN/static host
2. Configure redirects for SPA routing

### Option 3: Cloud Platforms

**Vercel (Frontend):**
```bash
npm install -g vercel
vercel deploy
```

**Railway/Heroku (Backend):**
- Connect GitHub repository
- Set environment variables
- Deploy automatically

## 🔧 Configuration Files

### Production Settings

**Backend** (`appsettings.Production.json`):
- ✅ Created with environment variable placeholders
- ✅ Reduced logging levels
- ✅ Secure JWT configuration

**Frontend** (`.env.production`):
- ✅ Created with production API URL placeholder
- ✅ Debug mode disabled
- ✅ Production-optimized settings

## 📝 Post-Deployment Checklist

### Security
- [ ] Change default JWT secret key
- [ ] Remove demo credentials (✅ Done)
- [ ] Enable HTTPS in production
- [ ] Configure CORS for production domains
- [ ] Review file upload permissions

### Configuration
- [ ] Set production database connection
- [ ] Configure file upload storage (local/cloud)
- [ ] Set up backup procedures
- [ ] Configure monitoring/logging

### Testing
- [ ] Test user registration
- [ ] Test authentication flow
- [ ] Test file upload functionality
- [ ] Test QR code generation/scanning
- [ ] Verify mobile responsiveness

## 🛡️ Security Recommendations

1. **Database Security:**
   - Use encrypted connections
   - Regular backups
   - Access restrictions

2. **API Security:**
   - Rate limiting
   - Input validation
   - HTTPS only

3. **File Security:**
   - Virus scanning
   - Size limitations (✅ Configured: 10MB)
   - Type restrictions (✅ Configured)

4. **Infrastructure:**
   - Firewall configuration
   - Regular security updates
   - Monitoring alerts

## 🔄 Environment Variables Reference

### Required Backend Variables
```bash
JWT_SECRET_KEY=<32-char-secret>
JWT_ISSUER=MediChain.Api
JWT_AUDIENCE=MediChain.Client
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<database-url>
```

### Required Frontend Variables
```bash
NEXT_PUBLIC_API_URL=<api-base-url>
API_URL=<api-base-url>
```

## 📞 Support

For deployment issues:
1. Check logs for error details
2. Verify environment variables
3. Confirm network connectivity
4. Review security settings

---

**⚠️ Important**: Never commit production secrets to version control. Use environment variables or secure secret management systems.