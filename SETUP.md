# Setup Instructions

## Quick Start

1. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   
   Create `backend/.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/xavier_nmms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   GEMINI_API_KEY=AIzaSyBa8SSIb-3Ti2WxqMza2PyEshMbtXsp908
   ```

3. **Start MongoDB**:
   - Make sure MongoDB is running on your system
   - Or update `MONGODB_URI` to point to your MongoDB Atlas connection string

4. **Start the application**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server: `http://localhost:5000`
   - Frontend server: `http://localhost:3000`

## First Time Setup

1. **Register an Admin Account**:
   - Go to `http://localhost:3000/register`
   - Select "Admin" as the role
   - Create your admin account

2. **Login**:
   - Go to `http://localhost:3000/login`
   - Login with your admin credentials

3. **Upload Question Paper**:
   - Go to Admin Dashboard
   - Upload 4 pages of question paper
   - AI will automatically process and generate answer key

4. **Scan OMR Sheets**:
   - Go to Scanner page
   - Select answer key
   - Use camera or upload image to scan OMR sheet

## Features

### Gemini AI Integration
- Uses Google Gemini 1.5 Flash for intelligent answer detection
- Automatically finds correct answers from questions and options
- API key is already configured in the example

### OMR Detection
- Detects numbers (1, 2, 3, 4) inside bubbles using OCR
- Falls back to darkness-based detection if needed
- Optimized for OMR sheets with numbers printed inside bubbles

## Troubleshooting

- **MongoDB Connection Error**: Make sure MongoDB is running or check your connection string
- **Gemini API Error**: Verify your API key is correct in `.env` file
- **OCR Not Working**: Ensure good image quality and lighting for OMR sheets
- **Port Already in Use**: Change PORT in `.env` or stop the process using the port

