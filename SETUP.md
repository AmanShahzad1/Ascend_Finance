# AscenD Finance - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Git (for cloning)

### 1. Database Setup

#### Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE ascend_finance;
CREATE USER ascend_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ascend_finance TO ascend_user;
\q
```

### 2. Environment Configuration

Update `.env.local` with your database credentials:
```env
# Database Configuration
DATABASE_URL=postgresql://ascend_user:your_secure_password@localhost:5432/ascend_finance
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ascend_finance
DB_USER=ascend_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# App Configuration
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database
```bash
npm run init-db
```

### 5. Start Development Server
```bash
npm run dev
```

## 🎯 What's Implemented

### ✅ Backend Features
- **PostgreSQL Integration**: Full database connection with connection pooling
- **User Authentication**: JWT-based authentication system
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Email, password, and username validation
- **API Endpoints**: 
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get current user

### ✅ Frontend Features
- **Authentication Context**: Global state management for user auth
- **Protected Routes**: Automatic redirects based on auth status
- **Form Validation**: Client-side validation with error handling
- **Responsive Design**: Mobile-first design with emerald/gold theme
- **Toast Notifications**: User feedback for all actions

### ✅ Database Schema
- **Users Table**: Complete user management
- **User Preferences**: Currency, language, timezone settings
- **Expense Categories**: System and user-defined categories
- **Transactions**: Expense/income tracking with categorization
- **Receipts**: File storage and OCR processing
- **Daily Messages**: AI-powered motivational messages
- **User Message History**: Track sent messages

## 🔧 API Usage Examples

### Register User
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    interests: ['Technology', 'Finance']
  })
});
```

### Login User
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!',
    rememberMe: true
  })
});
```

### Get Current User
```javascript
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🎨 Design System

### Color Palette
- **Primary**: Emerald Green (`emerald-950`, `emerald-900`, `emerald-600`)
- **Accent**: Gold/Amber (`amber-100`, `amber-200`, `amber-300`, `amber-400`)
- **Text**: White/Gold combinations for readability
- **Background**: Dark emerald gradient with subtle pattern

### Typography
- **Brand**: Serif font with custom weight distribution
- **Body**: Clean, readable sans-serif
- **Responsive**: Scales appropriately across all devices

## 🚀 Next Steps

1. **Test the Application**: Register a new user and test login
2. **Customize Environment**: Update database credentials and JWT secrets
3. **Add Features**: Implement expense tracking, receipt scanning, etc.
4. **Deploy**: Set up production database and deploy to Vercel/Netlify

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_ctl status`
- Check credentials in `.env.local`
- Ensure database exists: `psql -U ascend_user -d ascend_finance`

### Authentication Issues
- Check JWT_SECRET is set in environment
- Verify token format in Authorization header
- Clear localStorage if experiencing stale tokens

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors: `npm run lint`
- Verify all environment variables are set

## 📚 File Structure

```
ascend-finance/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── pages/             # Page components
│   └── layout.tsx         # Root layout with AuthProvider
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   ├── auth.ts           # JWT utilities
│   ├── database.ts       # PostgreSQL connection
│   ├── models/           # Database models
│   └── schema.ts         # Database schema setup
├── scripts/
│   └── init-db.ts        # Database initialization
└── .env.local            # Environment configuration
```

## 🎉 Success!

Your AscenD Finance application is now fully functional with:
- ✅ User registration and login
- ✅ JWT authentication
- ✅ PostgreSQL database
- ✅ Responsive design
- ✅ Error handling
- ✅ Form validation

Ready to build the next features! 🚀
