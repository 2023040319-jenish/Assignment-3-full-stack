Q2 - EXPRESS LOGIN WITH FILE SESSION STORE

Requirements:
- Express
- express-session
- session-file-store
- Login
- Two protected routes
- Logout

RUN:
1. Open terminal in this folder.
2. Run:
   npm install
3. Run:
   npm start
4. Open:
   http://localhost:3001

LOGIN:
Username: admin
Password: admin123

ROUTES:
GET  /login
POST /login
GET  /dashboard       Protected Route 1
GET  /profile         Protected Route 2
GET  /logout

SESSION FILES:
Session data is stored automatically inside the sessions/ folder.

IMPORTANT:
Do not delete the sessions/ folder while the server is running.
