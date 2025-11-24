# Xavier's NMMS Scanner

A comprehensive MERN stack application for scanning and evaluating OMR (Optical Mark Recognition) sheets with AI-powered answer key generation.

## Features

### Admin Features
- **Authentication**: Secure admin login/registration
- **Question Paper Upload**: Upload 4-page question papers (PDF or images)
- **AI-Powered Processing**: Automatic question and option detection using OCR
- **Answer Key Generation**: AI finds correct answers using Google Gemini and stores answer keys (100 questions with 4 options each)

### Scanner Features
- **OMR Sheet Scanning**: Real-time camera scanning with automatic processing
- **Instant Results**: Compare scanned answers with stored answer keys
- **Detailed Analysis**: View correct/wrong answers with percentage scores
- **Result History**: Track all scanned results

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS v3
- **Backend**: Express.js (ES Modules)
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini 1.5 Flash for answer detection
- **OCR**: Tesseract.js for text and number recognition
- **Image Processing**: Sharp for image preprocessing
- **Authentication**: JWT tokens

## Quick Start (Development)

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   
   Create `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/xavier_nmms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB**:
   - Make sure MongoDB is running locally
   - Or use MongoDB Atlas connection string

4. **Start the application**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server: `http://localhost:5000`
   - Frontend server: `http://localhost:3000`

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to:
- **Backend**: Render
- **Frontend**: Vercel

## Project Structure

```
xavier-nmms-scanner/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # AI processing services
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # Uploaded files
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # Auth context
│   │   ├── config/      # Axios configuration
│   │   └── App.jsx      # Main app
│   └── package.json
└── package.json         # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Admin
- `POST /api/admin/upload-question-paper` - Upload question paper (admin only)
- `GET /api/admin/answer-keys` - Get all answer keys (admin only)
- `GET /api/admin/answer-keys/:id` - Get single answer key
- `DELETE /api/admin/answer-keys/:id` - Delete answer key (admin only)

### Scanner
- `POST /api/scanner/scan` - Scan OMR sheet
- `GET /api/scanner/results` - Get all scan results
- `GET /api/scanner/results/:id` - Get single scan result

## Environment Variables

### Development

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/xavier_nmms
JWT_SECRET=your_secret_key
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### Production

See `backend/env.production.example` and `frontend/env.production.example` for production environment variables.

## Usage

### Admin Workflow

1. **Register/Login** as admin
2. **Upload Question Paper**: 
   - Go to Admin Dashboard
   - Upload 4 pages of question paper (images or PDF)
   - AI will automatically detect questions and options
   - Gemini AI will find correct answers
   - Answer key will be generated and stored

### Scanner Workflow

1. **Select Answer Key** from dropdown
2. **Enter Student Name** (optional)
3. **Start Scanning** - Camera activates automatically
4. **Position OMR Sheet** - System automatically scans every 2 seconds
5. **View Results** - Results appear automatically when OMR sheet is detected

## Notes

- **AI Answer Detection**: Uses Google Gemini 1.5 Flash API to automatically find correct answers from questions and options.
- **OMR Detection**: Uses OCR (Tesseract.js) to detect numbers (1, 2, 3, 4) inside bubbles. Falls back to darkness-based detection if OCR fails.
- **OMR Sheet Format**: The OMR sheets should have numbers (1, 2, 3, 4) printed inside each answer bubble.
- **Real-time Scanning**: The scanner continuously captures and processes images automatically - no manual button clicks needed.
- Ensure good lighting and flat OMR sheets for best scanning results.

## License

ISC
