# React App – CSE442 Fall 2025

This is the proof-of-concept React app for our CSE442 project.  
It was bootstrapped using **Vite + React**.

---

## 🚀 Getting Started

### 1. Clone the Repository

### 2. Install Dependencies
Make sure you have **Node.js (>=18)** installed.  
Then run:
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
- The app will start on: [http://localhost:5173](http://localhost:5173)
- Any changes in the `src/` folder will hot-reload automatically.

### 4. Build for Production
```bash
npm run build
```
- Output will be in the `dist/` folder.
- You can deploy the contents of `dist/` to the UB server:
  ```
  /data/web/CSE442/2025-Fall/cse-442z/
  ```

---

## 🗄️ Database Connection (with PHP backend)
- The React app communicates with a `db.php` backend for MySQL access.
- `db.php` should be uploaded to the same server folder as `index.html`.
- In production, the React app should fetch data from:
  ```
  https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442z/db.php
  ```

---

## 📂 Project Structure
```
├── public/          # Static assets
├── src/             # React source code
│   ├── App.jsx
│   └── ...
├── index.html       # Entry point
├── package.json     # Project dependencies & scripts
└── vite.config.js   # Vite configuration
```

---

## ✅ Common Commands
- `npm run dev` → Start dev server
- `npm run build` → Build for production
- `npm run preview` → Preview build locally

---

## 👥 Team Notes
- Do **not** commit `node_modules/` or `dist/` (they are ignored in `.gitignore`).
- Always pull the latest changes before starting work:
  ```bash
  git pull origin main
  ```
- If dependencies change, run `npm install` again.  
