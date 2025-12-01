# NMMS Scanner - Production Ready Setup

## 🎯 Overview
AI-powered OMR sheet scanning application that uses **Gemini 1.5 Flash** to extract questions from question papers (including text AND diagrams) and automatically generate answer keys.

## ✨ Key Features
- **Multimodal AI Processing**: Handles both text and diagram-based questions
- **Flexible Upload**: Upload 1-20 pages of question papers
- **Automatic Answer Generation**: AI solves questions and creates answer keys
- **OMR Sheet Scanning**: Scan student answer sheets and compare with answer keys
- **Real-time Results**: Instant scoring and detailed analytics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and Install Dependencies**
```bash
npm run install-all
```

2. **Configure Environment Variables**

Create `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI API Key (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS (for development)
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

3. **Start Development Servers**
```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 5173).

## 📖 Usage Guide

### For Admins

1. **Register/Login** as admin
2. **Upload Question Paper**:
   - Upload 1-20 pages of the question paper (JPG, PNG, WebP)
   - AI will extract all questions (text + diagrams)
   - AI will solve each question and generate the answer key
   - Wait 2-5 minutes for processing

3. **Manage Answer Keys**:
   - View all created answer keys
   - Delete outdated answer keys

### For Users

1. **Scan OMR Sheets**:
   - Select an answer key
   - Upload student's OMR sheet image
   - Get instant results with score and percentage

2. **View Results**:
   - See detailed question-by-question analysis
   - View correct vs selected answers
   - Track performance over time

## 🏗️ Production Deployment

### Environment Variables for Production

**Backend (`backend/.env`)**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_production_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=https://your-frontend-domain.com
```

**Frontend (`frontend/.env.production`)**:
```env
VITE_API_URL=https://your-backend-domain.com
```

### Deployment Options

#### Option 1: Vercel (Recommended)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel deployment instructions.

#### Option 2: Traditional Hosting

**Backend**:
```bash
cd backend
npm install --production
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm run build
# Serve the 'dist' folder with nginx or any static server
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET
- [ ] Configure CORS properly
- [ ] Set up MongoDB Atlas or production database
- [ ] Add Gemini API key
- [ ] Enable HTTPS
- [ ] Set up file upload limits
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all features thoroughly

## 🔧 Configuration

### File Upload Limits
- Maximum 20 pages per question paper upload
- Maximum 10MB per file
- Supported formats: JPG, PNG, WebP, HEIC

### AI Processing
- Model: Google Gemini 1.5 Flash
- Timeout: 5 minutes per upload
- Handles both text and diagram questions
- JSON-based structured output

### Database Models
- **User**: Authentication and roles (admin/user)
- **AnswerKey**: Stores questions and correct answers
- **ScanResult**: Stores OMR scan results and scores

## 🛠️ Development

### Project Structure
```
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic (AI processing, OMR)
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth context
│   │   └── config/      # Axios configuration
│   └── public/
└── package.json         # Root scripts
```

### Available Scripts

**Root**:
- `npm run dev` - Start both servers
- `npm run install-all` - Install all dependencies

**Backend**:
- `npm run dev` - Start with hot reload
- `npm start` - Start production server

**Frontend**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (admin/user)
- CORS configuration
- File type validation
- File size limits
- Input sanitization

## 🐛 Troubleshooting

### Common Issues

**1. "GEMINI_API_KEY is not defined"**
- Ensure you've added your Gemini API key to `backend/.env`
- Restart the backend server after adding the key

**2. "Failed to process question paper"**
- Check if images are clear and readable
- Ensure files are in supported formats (JPG, PNG, WebP)
- Check backend logs for specific errors
- Verify Gemini API key is valid

**3. "Connection refused" errors**
- Verify MongoDB is running and connection string is correct
- Check if ports 5000 and 5173 are available
- Ensure firewall isn't blocking connections

**4. CORS errors**
- Update `CLIENT_URL` in backend `.env`
- Ensure frontend is accessing correct API URL

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Admin Routes (Protected)
- `POST /api/admin/upload-question-paper` - Upload and process question paper
- `GET /api/admin/answer-keys` - Get all answer keys
- `GET /api/admin/answer-keys/:id` - Get specific answer key
- `DELETE /api/admin/answer-keys/:id` - Delete answer key

### Scanner Routes (Protected)
- `POST /api/scanner/scan` - Scan OMR sheet
- `GET /api/scanner/results` - Get all scan results
- `GET /api/scanner/results/:id` - Get specific result

## 📄 License
ISC

## 👨‍💻 Support
For issues and questions, please check the documentation files:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- [CORS_FIX.md](./CORS_FIX.md) - CORS troubleshooting
- [SETUP.md](./SETUP.md) - Initial setup guide
