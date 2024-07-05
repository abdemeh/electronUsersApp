# 🚀 Electron Users App

This project implements a simple Electron-based application for managing user profiles, login, and signup functionalities.

## 📄 Pages

### `index.html`
This is the main landing page of the application where users can check the status of Microsoft Word installation.

### `profil.html`
This page allows users to view and update their profile information such as name, email, and password.

### `login.html`
Users can log in using their email and password on this page. If successful, they are redirected to the `index.html` page.

### `signup.html`
New users can create an account by providing their name, email, and password. Upon successful signup, they are redirected to the `index.html` page.

## 🛠️ Technologies Used
- **Electron**: Framework for building cross-platform desktop applications using web technologies.
- **Node.js**: Backend environment for running JavaScript code.
- **SQLite**: Database used for storing user information securely.
- **bcrypt**: Library for hashing passwords securely before storing them.
- **Bootstrap**: CSS framework for responsive and mobile-first design.

## 📁 Scripts
- `main.js`: Contains the Electron main process code, handling windows, IPC (Inter-Process Communication), and database operations.
- `assets/`: Directory containing CSS, JavaScript, and image assets used across the application.

## 🚦 Getting Started
1. **Clone Repository**: `git clone <repository-url>`
2. **Install Dependencies**: 
   ```bash
   npm install
   npm install bcrypt electron-debug sqlite3 electron-builder --save-dev
3. **Run Application**: `npm start`

## ℹ️ Notes
- Ensure Node.js and npm are installed on your machine before running the application.
- This application uses Electron to create a desktop application experience using web technologies.

## 👥 Contributors
- [Abdellatif EL MAHDAOUI](https://github.com/abdemeh) - Developer

## 📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
