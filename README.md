# Adetop Tech Services Limited — Frontend

This is a static, responsive frontend mock for "Adetop Tech Services Limited".

Files created:
- `index.html` — main page
- `styles.css` — styles and colorful section utilities
- `script.js` — small interactive behaviors (nav toggle, form handling)


How to view locally (frontend only):
1. Open `index.html` in your browser (double-click or right-click → Open With).
2. Or run a simple static server for the folder (recommended) in PowerShell:

```powershell
# Python 3
python -m http.server 8000

# Or using npx http-server (Node.js)
npx http-server -p 8000
```

Then open http://localhost:8000 in your browser.

Run the auth backend (Node/Express):

1. Ensure you have Node.js installed.
2. Open PowerShell in this folder and install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

By default the server listens on port 4000. The frontend is wired to call `http://localhost:4000/api/*` when served from `localhost`.

Testing signup and login
1. Start the auth server as above (`npm install` then `npm start`).
2. Serve the frontend from a static server (recommended) or open `index.html` from a `http://localhost` origin so the frontend points to the local API.
3. Click "Sign up" in the header, fill the form, and create an account. The server stores users in `users.json`.
4. After signup the UI should show you as logged in. You can sign out and then sign in again using the "Login" button.

If you see errors, check the terminal running `npm start` for server logs and verify `users.json` has the new user.

Notes:
- Images referenced in `index.html` live in the `images/` folder; if missing, placeholders are hidden.

Notes:
- The contact form is a demo and does not send network requests.
- The auth server is a simple demo implementation intended for local testing only. Do not use the default JWT secret in production. Consider using environment variables and a secure production store for users (database).

Feel free to ask for tweaks: color palette changes, copy edits, or adding backend form submission.
