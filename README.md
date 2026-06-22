# GPay Clone - Full Stack Payment App

A complete Google Pay clone built with **React Native (Expo)** frontend and **Laravel 11** backend with **PostgreSQL** database.

[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-black)](https://expo.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-11-red)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

---

## 📸 Screenshots

| Home Screen | Chat & Payments | Profile |
|:---:|:---:|:---:|
| ![Home](screenshots/home.png) | ![Chat](screenshots/chat.png) | ![Profile](screenshots/profile.png) |

*(Replace with actual screenshots)*

---

## 🚀 Features

### 🔐 Authentication
- Phone number + password login
- New user registration with auto-generated UPI ID
- Secure token-based authentication (Laravel Sanctum)
- Auto-login with encrypted token storage

### 💰 Payments
- **Send Money** - Search users by name/phone/UPI ID
- **Scan & Pay** - QR code scanner for instant payments
- **Bank Transfer** - IMPS/NEFT with account verification
- **Chat Payments** - Send money directly in conversations
- **Multiple Bank Accounts** - Add unlimited accounts with individual PINs

### 🔒 Security
- **Bank Account PIN** - Each account has its own 4-digit PIN
- **Secure PIN Screen** - Custom keypad, no system keyboard
- **PIN Verification** - Required for all transactions
- **Encrypted Storage** - PINs hashed with bcrypt

### 💬 Chat System
- Real-time style messaging
- Payment bubbles with amount display
- Transaction highlighting when opened from history
- Auto-scroll to linked transactions

### 👤 User Profile
- Profile picture upload
- QR code generation for receiving payments
- UPI ID display and copy
- Edit profile (name, email, photo)

### 📊 Transaction History
- Full transaction list with summaries
- Debit/credit indicators
- Tap to open chat with transaction highlight
- Pull-to-refresh updates

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native, Expo, TypeScript |
| **Navigation** | React Navigation 7 |
| **Icons** | Ionicons (Expo Vector Icons) |
| **QR Code** | react-native-qrcode-svg |
| **Camera** | expo-camera, expo-barcode-scanner |
| **Secure Storage** | expo-secure-store |
| **HTTP Client** | Axios |
| **Backend** | Laravel 11, PHP 8.2 |
| **Database** | PostgreSQL 15 |
| **Auth** | Laravel Sanctum |
| **Image Storage** | Laravel Storage (local) |

---

## 📦 Prerequisites

- **Node.js** 18+
- **PHP** 8.2+
- **Composer**
- **PostgreSQL** 15+
- **Expo Go** app (on Android/iOS)
- **Git**

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/joyal777/gpay-app.git
cd gpay-app
```

### 2. Backend Setup (Laravel)

```
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Configure your database in .env
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=gpay_db
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Create storage link (for profile photos)
php artisan storage:link

# Start server
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Frontend Setup (React Native/Expo)

```bash
cd ../GPayApp

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your computer's IP
# EXPO_PUBLIC_API_URL=http://YOUR_IP:8000

# Start Expo
npx expo start
```

### 4. Run on Phone

Install Expo Go from Play Store/App Store

Scan QR code from terminal

Or press a for Android / i for iOS

### 5. Project Structure

```bash
gpay-app/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── WalletController.php
│   │   │   │   ├── ChatController.php
│   │   │   │   ├── BankController.php
│   │   │   │   └── UserController.php
│   │   │   └── Middleware/
│   │   └── Models/
│   │       ├── User.php
│   │       ├── Wallet.php
│   │       ├── Transaction.php
│   │       ├── Message.php
│   │       ├── BankAccount.php
│   │       └── BankTransfer.php
│   ├── database/migrations/
│   └── routes/
│       └── api.php
│
└── GPayApp/                    # React Native App
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   ├── SendMoneyScreen.tsx
    │   │   ├── ChatScreen.tsx
    │   │   ├── PaymentScreen.tsx
    │   │   ├── SecurePinScreen.tsx
    │   │   ├── ScanScreen.tsx
    │   │   ├── BankTransferScreen.tsx
    │   │   ├── AddBankAccountScreen.tsx
    │   │   ├── TransactionsScreen.tsx
    │   │   └── SetPinScreen.tsx
    │   ├── components/
    │   │   └── AccountSelector.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   └── services/
    │       ├── api.ts
    │       └── config.ts
    ├── App.tsx
    └── .env
```
### 6. Usage Flow

1. Register with name, phone, email, password

2. Add Bank Account from Profile → Bank Accounts

3. Set Account PIN for each bank account

4. Send Money via Send, Scan, Chat, or Bank Transfer

5. Enter Secure PIN on custom keypad to confirm

6.Track all transactions in history

### 7. Troubleshooting

**"Network Error" on phone**

Ensure phone and computer are on same WiFi

Check EXPO_PUBLIC_API_URL in .env matches your IP

Run ipconfig (Windows) to find your IP

Restart backend with: php artisan serve --host=0.0.0.0

**"Login Failed"**
Check backend is running on port 8000

Verify database credentials in .env

Run php artisan migrate to ensure tables exist

**"UPI PIN Required"**
Add a bank account with PIN from Profile

Each bank account needs its own 4-digit PIN

**📄 License**
MIT License - feel free to use and modify!

**👨‍💻 Author**
Joyal - GitHub

**🙏 Acknowledgments**
Laravel

Expo

React Navigation

Ionicons

**Star this repo if you found it helpful!**
You can copy the entire code block above and save it directly as `README.md`. Then commit/push to your repository.

