# WeatherGPT Setup Guide

Complete installation and deployment guide for WeatherGPT with platform-specific instructions.

---

## 📋 Table of Contents

1. [Prerequisites by Platform](#prerequisites-by-platform)
2. [Windows Installation](#windows-installation)
3. [macOS Installation](#macos-installation)
4. [Linux Installation](#linux-installation)
5. [Docker Setup (All Platforms)](#docker-setup-all-platforms)
6. [Local Development Setup](#local-development-setup)
7. [Environment Configuration](#environment-configuration)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites by Platform

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space (10GB with Docker)
- **Internet**: Required for API calls and dependencies

### Software Requirements

| Component | Windows | macOS | Linux |
|-----------|---------|-------|-------|
| **Node.js** | 18.0+ | 18.0+ | 18.0+ |
| **Python** | 3.8+ | 3.8+ | 3.8+ |
| **Git** | 2.30+ | 2.30+ | 2.30+ |
| **Docker** (optional) | Docker Desktop | Docker Desktop | Docker Engine |

---

## Windows Installation

### Option 1: WSL2 (Recommended for Developers)

WSL2 provides a native Linux environment with better performance and compatibility.

#### Step 1: Install WSL2

**PowerShell (Run as Administrator):**
```powershell
# Enable WSL and Virtual Machine Platform
wsl --install

# Restart your computer when prompted
```

**After restart, set WSL2 as default:**
```powershell
wsl --set-default-version 2

# Install Ubuntu (or your preferred distro)
wsl --install -d Ubuntu-22.04
```

**Launch Ubuntu and create your user account**, then follow the [Linux Installation](#linux-installation) instructions inside WSL2.

#### Step 2: Install Windows Terminal (Optional but Recommended)

Download from Microsoft Store or:
```powershell
winget install Microsoft.WindowsTerminal
```

#### Step 3: Access Files

Your Windows files are accessible at `/mnt/c/` in WSL2. Project files should be in the Linux filesystem for best performance (`~/projects/`).

---

### Option 2: Native Windows Installation

#### Step 1: Install Git for Windows

**Download and install:**
- Visit: https://git-scm.com/download/windows
- Use default settings, select "Git Bash Here" context menu option

**Verify installation:**
```powershell
git --version
```

#### Step 2: Install Node.js

**Option A - Official Installer (Recommended for beginners):**
- Visit: https://nodejs.org/
- Download LTS version (20.x)
- Run installer with default settings
- Restart PowerShell/Command Prompt

**Option B - Using winget:**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Option C - Using nvm-windows (Recommended for developers):**
```powershell
# Download nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
# Install, then:
nvm install 20
nvm use 20
```

**Verify installation:**
```powershell
node --version
npm --version
```

#### Step 3: Install Python

**Option A - Official Installer:**
- Visit: https://www.python.org/downloads/
- Download Python 3.11 or 3.12
- **Important**: Check "Add Python to PATH" during installation
- Verify in new terminal:

```powershell
python --version
pip --version
```

**Option B - Using winget:**
```powershell
winget install Python.Python.3.12
```

**Option C - Using Microsoft Store:**
- Search "Python 3.12" in Microsoft Store
- Install (automatically added to PATH)

#### Step 4: Install Docker Desktop (Optional)

**Download and install:**
- Visit: https://www.docker.com/products/docker-desktop/
- Download Docker Desktop for Windows
- Run installer, enable WSL2 integration if available
- Restart computer

**Verify installation:**
```powershell
docker --version
docker-compose --version
```

#### Step 5: Clone and Setup Project

**Using PowerShell or Git Bash:**
```powershell
# Navigate to your projects folder
cd C:\Users\YourUsername\Projects

# Clone repository
git clone https://github.com/krishrana1430/SIH.git
cd SIH

# Copy environment template
copy .env.example .env

# Edit .env file (use notepad, VS Code, or any editor)
notepad .env
```

#### Step 6: Install Dependencies

**Backend:**
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# PowerShell:
.\venv\Scripts\Activate.ps1

# Command Prompt:
venv\Scripts\activate.bat

# If you get execution policy error in PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt
```

**Frontend:**
```powershell
cd frontend\web
npm install
cd ..\..
```

#### Step 7: Run the Application

**Terminal 1 - Backend:**
```powershell
# Activate venv if not already active
.\venv\Scripts\Activate.ps1

# Start backend
python start_server.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend\web
npm run dev
```

Access at: http://localhost:3000

### Windows-Specific Troubleshooting

**Path too long errors:**
```powershell
# Enable long paths support
git config --system core.longpaths true
```

**SSL certificate errors:**
```powershell
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

**npm permission errors:**
```powershell
# Run PowerShell as Administrator
npm config set prefix "%APPDATA%\npm"
```

---

## macOS Installation

### Step 1: Install Homebrew

Homebrew is the package manager for macOS.

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH (follow on-screen instructions)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Verify installation
brew --version
```

### Step 2: Install Xcode Command Line Tools

```bash
xcode-select --install
```

Click "Install" in the dialog that appears.

### Step 3: Install Git

```bash
# Git comes with Xcode Command Line Tools, but you can update it:
brew install git

# Verify
git --version
```

### Step 4: Install Node.js

**Option A - Using Homebrew (Recommended):**
```bash
# Install Node.js LTS
brew install node@20

# Link it
brew link node@20

# Verify
node --version
npm --version
```

**Option B - Using nvm (Recommended for developers):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.zshrc  # or ~/.bash_profile

# Install Node.js
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
```

### Step 5: Install Python

**macOS comes with Python, but install a modern version:**

**Option A - Using Homebrew (Recommended):**
```bash
# Install Python 3.11
brew install python@3.11

# Verify
python3 --version
pip3 --version
```

**Option B - Using pyenv (Recommended for developers):**
```bash
# Install pyenv
brew install pyenv

# Add to shell configuration
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

# Restart terminal or source
source ~/.zshrc

# Install Python
pyenv install 3.11.8
pyenv global 3.11.8

# Verify
python --version
```

### Step 6: Install Docker Desktop (Optional)

**Download and install:**
```bash
# Option A - Direct download
# Visit: https://www.docker.com/products/docker-desktop/

# Option B - Using Homebrew
brew install --cask docker

# Launch Docker Desktop from Applications
open -a Docker
```

**Verify installation:**
```bash
docker --version
docker-compose --version
```

### Step 7: Clone and Setup Project

```bash
# Navigate to projects folder
cd ~/Projects

# Clone repository
git clone https://github.com/krishrana1430/SIH.git
cd SIH

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use: open -e .env for TextEdit
```

### Step 8: Install Dependencies

**Backend:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend/web
npm install
cd ../..
```

### Step 9: Run the Application

**Terminal 1 - Backend:**
```bash
# Activate venv
source venv/bin/activate

# Start backend
python start_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend/web
npm run dev
```

Access at: http://localhost:3000

### Apple Silicon (M1/M2/M3) Considerations

Most dependencies work natively on Apple Silicon. If you encounter architecture issues:

```bash
# Install Rosetta 2 (if not already installed)
softwareupdate --install-rosetta

# For specific packages, use arch flag
arch -arm64 brew install <package>

# Or force x86_64 if needed
arch -x86_64 brew install <package>
```

### macOS-Specific Troubleshooting

**Permission denied errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**SSL certificate errors:**
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

**Port already in use:**
```bash
# Find process on port 8000
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)
```

---

## Linux Installation

Instructions for Debian/Ubuntu-based distributions. For other distributions, adapt package manager commands.

### Ubuntu/Debian

#### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### Step 2: Install Git

```bash
sudo apt install git -y

# Verify
git --version
```

#### Step 3: Install Node.js

**Option A - Using apt (Ubuntu 22.04+):**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verify
node --version
npm --version
```

**Option B - Using nvm (Recommended for developers):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source
source ~/.bashrc

# Install Node.js
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
```

#### Step 4: Install Python

```bash
# Install Python 3.11 and pip
sudo apt install python3.11 python3.11-venv python3-pip -y

# Verify
python3.11 --version
pip3 --version

# Create symbolic links (optional, for convenience)
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1
sudo update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1
```

#### Step 5: Install Docker (Optional)

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Log out and log back in for group changes to take effect
# Then verify
docker --version
docker compose version
```

#### Step 6: Clone and Setup Project

```bash
# Navigate to projects folder
cd ~/projects  # or mkdir -p ~/projects && cd ~/projects

# Clone repository
git clone https://github.com/krishrana1430/SIH.git
cd SIH

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or vim .env
```

#### Step 7: Install Dependencies

**Backend:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend/web
npm install
cd ../..
```

#### Step 8: Run the Application

**Terminal 1 - Backend:**
```bash
# Activate venv
source venv/bin/activate

# Start backend
python start_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend/web
npm run dev
```

Access at: http://localhost:3000

---

### Fedora/RHEL/CentOS

```bash
# Update system
sudo dnf update -y

# Install Git
sudo dnf install git -y

# Install Node.js
sudo dnf install nodejs npm -y

# Install Python
sudo dnf install python3.11 python3-pip -y

# Install Docker
sudo dnf install docker docker-compose -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Follow same setup steps as Ubuntu from Step 6
```

---

### Arch Linux

```bash
# Update system
sudo pacman -Syu

# Install Git
sudo pacman -S git

# Install Node.js
sudo pacman -S nodejs npm

# Install Python
sudo pacman -S python python-pip

# Install Docker
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Follow same setup steps as Ubuntu from Step 6
```

---

### Linux-Specific Troubleshooting

**Permission denied on Docker:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

**Port already in use:**
```bash
# Find process
sudo lsof -ti:8000

# Kill it
sudo kill -9 $(sudo lsof -ti:8000)
```

**npm EACCES errors:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## Docker Setup (All Platforms)

Recommended for production deployment and simplified setup.

### Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- 4GB RAM minimum
- Docker Compose v2+

### Quick Start

**1. Clone and configure:**
```bash
git clone https://github.com/krishrana1430/SIH.git
cd SIH

cp .env.example .env
# Edit .env with your API keys (optional - users provide their own)
```

**2. Start services:**
```bash
docker-compose up -d
```

**3. Verify deployment:**
```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Backend health check
curl http://localhost:8000/health
```

**4. Access application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build

# Stop and remove all data
docker-compose down -v

# Execute command in container
docker-compose exec backend bash
```

---

## Local Development Setup

For developers who want hot-reloading and faster iteration.

### Backend Setup

**Requirements:**
- Python 3.8+ (3.11 recommended)
- pip and venv

**Steps:**

```bash
# Create virtual environment
python3 -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Windows Command Prompt)
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Add your API keys

# Start development server
python start_server.py

# Alternative: Direct uvicorn
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: http://localhost:8000

---

### Frontend Setup

**Requirements:**
- Node.js 18+ (20 LTS recommended)
- npm 10+

**Steps:**

```bash
# Navigate to frontend
cd frontend/web

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Start development server
npm run dev
```

Frontend runs at: http://localhost:3000

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **Backend** | `--reload` (auto-restart) | gunicorn workers |
| **Frontend** | `npm run dev` (hot reload) | `npm run build` + `npm start` |
| **Database** | SQLite (file-based) | PostgreSQL (containerized) |
| **Logs** | Debug level | Warning/Error level |
| **CORS** | localhost allowed | Specific domains |

---

## Environment Configuration

### User-Provided API Keys Model

WeatherGPT uses a zero-cost deployment model:

1. **Users provide their own free API keys** at first login:
   - Groq API (Primary): https://console.groq.com
   - Gemini API (Secondary): https://aistudio.google.com/app/apikey

2. **Keys are encrypted** and stored per user in the database

3. **Automatic fallback**: Groq (primary) → Gemini (secondary)

4. **No API costs** for deployment

### Environment Variables

Create `.env` from template:

```bash
cp .env.example .env
```

**Key variables:**

```env
# Optional Admin-Level Keys (for system operations)
LLM_PRIMARY_API_KEY=your-groq-api-key-here
LLM_SECONDARY_API_KEY=your-gemini-api-key-here

# Database Configuration
DATABASE_URL=sqlite:///./data/weathergpt.db  # Development (SQLite)
# DATABASE_URL=postgresql://user:pass@postgres:5432/weathergpt  # Production

# API Security
API_SECRET_KEY=your-random-secret-key-here
API_DEBUG=true

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Rate Limiting
MAX_QUESTIONS_PER_DAY=50

# Voice Features
STT_PROVIDER=groq
TTS_PROVIDER=web

# SMS Alerts (Optional)
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Generate Secure Secrets

**Linux/macOS/Git Bash:**
```bash
openssl rand -hex 32
```

**PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Python:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Production Deployment

### Security Checklist

Before deploying to production:

**1. Change all default secrets:**
```bash
# Generate secure API secret
openssl rand -hex 32

# Update .env
API_SECRET_KEY=<generated-secret>
```

**2. Use environment variables:**
- Never commit `.env` to version control
- Use cloud provider secrets management:
  - AWS Secrets Manager
  - GCP Secret Manager
  - Azure Key Vault
  - Heroku Config Vars

**3. Enable HTTPS:**
- Configure SSL/TLS certificates
- Use Let's Encrypt for free certificates
- Set up reverse proxy (nginx/Traefik)

**4. Configure firewall rules:**
- Restrict backend API access
- Only expose necessary ports (80, 443)
- Use security groups/network policies

**5. Set production environment:**
```env
ENVIRONMENT=production
LOG_LEVEL=warning
CORS_ORIGINS=["https://your-domain.com"]
```

### Docker Compose Production

**Production docker-compose.yml:**

```yaml
version: '3.8'

services:
  backend:
    build: .
    env_file: .env
    environment:
      - ENVIRONMENT=production
      - LOG_LEVEL=warning
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend/web
    env_file: .env
    depends_on:
      - backend

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Deploy:**
```bash
docker-compose -f docker-compose.yml up -d --build
```

### Cloud Deployment Options

#### AWS Deployment
- **ECS/Fargate**: Deploy containers directly
- **Elastic Beanstalk**: Multi-container application
- **Lambda + API Gateway**: Serverless backend
- **CloudFront + S3**: Frontend static hosting

#### GCP Deployment
- **Cloud Run**: Serverless containers
- **GKE**: Kubernetes orchestration
- **App Engine**: Managed service
- **Firebase Hosting**: Frontend hosting

#### Azure Deployment
- **Container Instances**: Quick container deployment
- **AKS**: Kubernetes-based deployment
- **App Service**: Managed web app hosting
- **Azure Static Web Apps**: Frontend hosting

#### Other Platforms
- **Heroku**: Quick deployment with buildpacks
- **DigitalOcean App Platform**: Managed containers
- **Render**: Modern cloud platform
- **Fly.io**: Global edge deployment
- **Railway**: Developer-friendly platform

---

## Troubleshooting

### Common Issues

#### 1. Docker daemon not running

**Error**: `Cannot connect to Docker daemon`

**Solution:**
- Ensure Docker Desktop/Engine is running
- Check system tray (Windows) or menu bar (macOS)
- Linux: `sudo systemctl start docker`

---

#### 2. Port already in use

**Error**: `Port 8000 already in use`

**Windows:**
```powershell
# Find process
netstat -ano | findstr :8000

# Kill process
taskkill /PID <process-id> /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

**Change port (alternative):**
Edit `docker-compose.yml` or use different port:
```bash
uvicorn backend.api.main:app --reload --port 8001
```

---

#### 3. Invalid API key

**Error**: `Authentication failed` or `Invalid API key`

**Solution:**
1. Verify API key in `.env` file
2. Check for extra spaces or newlines
3. Regenerate key from provider console:
   - Groq: https://console.groq.com
   - Gemini: https://aistudio.google.com/app/apikey
4. Restart services after updating `.env`

---

#### 4. Frontend can't connect to backend

**Error**: `Network Error` or `Failed to fetch`

**Solution:**

```bash
# 1. Check backend is running
curl http://localhost:8000/health

# 2. Verify CORS configuration
# Ensure frontend URL is in CORS_ORIGINS in .env

# 3. Check frontend environment
# frontend/web/.env.local should contain:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > frontend/web/.env.local

# 4. Restart frontend
cd frontend/web
npm run dev
```

---

#### 5. Module not found errors

**Backend (Python):**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\Activate.ps1  # Windows PowerShell

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Frontend (Node.js):**
```bash
cd frontend/web

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

#### 6. Database connection errors

**Error**: `Could not connect to database`

**SQLite (Development):**
```bash
# Ensure data directory exists
mkdir -p data

# Check database path in .env
DATABASE_URL=sqlite:///./data/weathergpt.db
```

**PostgreSQL (Production):**
```bash
# Check container is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Verify connection string
DATABASE_URL=postgresql://user:pass@postgres:5432/weathergpt
```

---

#### 7. Permission errors

**Linux/macOS npm permissions:**
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**Docker permission denied (Linux):**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Python venv activation (Windows PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

#### 8. Build failures

**Error**: Build fails during `docker-compose up`

**Solution:**
```bash
# Clean rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d

# Check logs for specific errors
docker-compose logs backend
docker-compose logs frontend
```

---

#### 9. LLM provider timeouts

**Error**: `Request timeout` or `Provider unavailable`

**Solution:**
1. Check internet connectivity
2. Verify API key is valid
3. Check provider status:
   - Groq: https://status.groq.com
   - Gemini: https://status.google.com
4. System automatically falls back to secondary provider
5. View logs to see which tier is being used:
   ```bash
   docker-compose logs backend | grep "tier:"
   ```

---

### Platform-Specific Issues

#### Windows WSL2 Issues

**WSL2 not starting:**
```powershell
# Restart WSL
wsl --shutdown
wsl

# Update WSL
wsl --update
```

**File permission issues:**
```bash
# Files should be in Linux filesystem (/home/user/)
# Not in Windows filesystem (/mnt/c/)
```

---

#### macOS Rosetta Issues

**Architecture mismatch on Apple Silicon:**
```bash
# Install Rosetta 2
softwareupdate --install-rosetta

# Use native ARM build
arch -arm64 brew install <package>
```

---

#### Linux firewall Issues

**Port blocked by firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw allow 8000

# Fedora/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

---

### Getting Help

**Check service health:**
```bash
# Backend health
curl http://localhost:8000/health

# Check all services (Docker)
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

**Enable debug logging:**
```bash
# Add to .env
LOG_LEVEL=debug
API_DEBUG=true

# Restart services
docker-compose restart backend
```

**Run system check:**
```bash
python system_check.py
```

---

## Useful Commands Reference

### Development Commands

```bash
# Backend (Python)
python start_server.py                           # Start dev server
uvicorn backend.api.main:app --reload            # Alternative start
pip install -r requirements.txt                  # Install dependencies
pip freeze > requirements.txt                    # Update requirements

# Frontend (Node.js)
npm run dev                                      # Start dev server
npm run build                                    # Production build
npm run start                                    # Start production server
npm test                                         # Run tests

# Testing
python -m pytest backend/tests/ -v               # Run backend tests
python -m pytest backend/tests/ --cov=backend    # With coverage
npm test                                         # Run frontend tests
```

### Docker Commands

```bash
# Service management
docker-compose up -d                             # Start all services
docker-compose down                              # Stop all services
docker-compose restart                           # Restart all services
docker-compose ps                                # Check service status

# Logs and debugging
docker-compose logs -f                           # View all logs
docker-compose logs -f backend                   # View backend logs
docker-compose logs --tail=100 backend           # Last 100 lines

# Rebuilding
docker-compose up -d --build                     # Rebuild and start
docker-compose build --no-cache                  # Force clean build

# Cleanup
docker-compose down -v                           # Stop and remove volumes
docker system prune -a                           # Clean all unused data

# Execute commands in container
docker-compose exec backend bash                 # Backend shell
docker-compose exec frontend sh                  # Frontend shell
```

### Git Commands

```bash
# Update repository
git pull origin main

# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "Description"

# Push changes
git push origin feature/your-feature
```

---

## Next Steps

After successful setup:

1. **Test the application:**
   - Open http://localhost:3000
   - Register with your email and occupation
   - Provide your free Groq and Gemini API keys
   - Ask weather questions in different languages
   - Test real-time weather data retrieval
   - Test alert generation and storage

2. **Explore the API:**
   - Visit http://localhost:8000/docs for interactive documentation
   - Try different endpoints
   - Test with curl or Postman

3. **Customize configuration:**
   - Configure alert thresholds
   - Adjust rate limiting settings
   - Configure additional cities
   - Customize role-specific prompts

4. **Deploy to production:**
   - Follow security checklist
   - Set up monitoring and logging
   - Configure backups
   - Set up CI/CD pipeline

---

## Additional Resources

- **Main README**: [README.md](README.md) - Project overview and features
- **Quick Start**: [HOW_TO_RUN.md](HOW_TO_RUN.md) - Rapid deployment guide
- **Local Development**: [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) - Development workflow
- **API Documentation**: [docs/API.md](docs/API.md) - Complete API reference
- **Authentication Guide**: [AUTHENTICATION.md](AUTHENTICATION.md) - User authentication system
- **Alert System**: [ALERT_DISSEMINATION_ARCHITECTURE.md](ALERT_DISSEMINATION_ARCHITECTURE.md) - Alert architecture
- **Testing Guide**: [TESTING.md](TESTING.md) - Test suite documentation
- **Documentation Index**: [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - All available docs

---

**Support:**
- GitHub Issues: https://github.com/krishrana1430/SIH/issues
- Documentation: See files above
- Check logs: `docker-compose logs -f` or `tail -f server.log`

---

**Last Updated**: 2026-08-29
**Version**: 1.1.0
