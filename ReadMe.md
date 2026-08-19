# IIITA Open Source Community Forum Repository:

### Group Members:
1. Mridankan Mandal: IIB2024017.
2. Aditya Pachauri: IIB2024001.
3. Ankit Ekka: IIB2024012.
4. Dhannu Ram Meena: IIB2024033.

## 1. Project Introduction:
1. This repository contains the complete implementation, vulnerability analysis, and security remediation for the IIIT Allahabad Open Source Community Forum web application.
2. The project focuses on Problem 2: Cross Site Request Forgery (CSRF), demonstrating how ambient browser session cookies can be exploited by an attacker to execute unauthorized state changing actions.
3. The codebase is organized into two standalone versions to contrast vulnerable code patterns against industry standard defense mechanisms.

## 2. Repository Structure and Folder Contents:

### 2.1 Folder `IIITAOSCommunityForumV1`:
1. Purpose: Contains Version 1 of the web application which is intentionally vulnerable to Cross Site Request Forgery.
2. Server Code: Contains the Express server in `server/server.js`, SQLite database initializers in `server/database.js`, authentication endpoints in `server/routes/auth.js`, discussion routes in `server/routes/posts.js`, and live chat handlers in `server/routes/chat.js`.
3. Client Code: Contains the React frontend bundled via Vite in `client/` and served through `public/`.
4. Attacker Exploit: Includes `public/attacker_csrf_exploit.html` demonstrating cross origin hidden form auto submission against the live forum.
5. Documentation: Includes `ReadMe.md` with setup instructions and `Vulnerable.md` with a detailed attack manual and code breakdown.

### 2.2 Folder `IIITAOSCommunityForumV2`:
1. Purpose: Contains Version 2 of the web application where all Cross Site Request Forgery vulnerabilities have been mitigated.
2. Server Code: Contains the hardened Express server with Anti CSRF synchronizer token verification, `SameSite=Strict` and `HttpOnly` cookie policies, and Origin validation in `server/routes/auth.js`.
3. Client Code: Contains the updated React frontend in `client/src/App.jsx` configured to automatically fetch and attach the CSRF token header on state changing requests.
4. Documentation: Includes `ReadMe.md` and `CSRFAttackDefense.md` explaining the exact defenses implemented and how they operate.

## 3. Technology Stack:
1. Backend: Node.js runtime environment using the Express web framework.
2. Database: Embedded SQLite 3 database engine utilizing native `node:sqlite` with persistent storage in `server/forum.db`.
3. Frontend: React user interface bundled with Vite into static production assets in `public/`.
4. Styling: Clean professional white theme featuring full colored card borders and custom role badges.

## 4. Summary of the Cross Site Request Forgery Vulnerability in Version 1:
1. Ambient Cookie Attachment: The browser automatically attaches stored authentication session cookies to all requests targeting `http://localhost:3000`, including requests initiated by third party web pages.
2. Missing Anti CSRF Tokens: The backend accepts state changing POST and PUT requests without verifying unique unpredictable cryptographic tokens.
3. Unrestricted Cookie Configuration: Session cookies lack the `SameSite=Strict` directive, allowing cross origin form submissions to transmit session credentials.
4. Missing Origin Verification: The server processes incoming requests without validating whether the request originated from the trusted application domain.

## 5. How an Attack is Executed on Version 1:
1. A legitimate user or administrator logs into the forum platform using credentials such as `mridankan` with password `mridankan123`.
2. The browser receives the session cookie and retains it in storage for `localhost:3000`.
3. While the session is active, the victim is lured into opening an external malicious page such as `attacker_csrf_exploit.html`.
4. The malicious page contains an invisible HTML form targeting `http://localhost:3000/api/auth/profile` with forged input values.
```html
<form id="csrfForm" action="http://localhost:3000/api/auth/profile" method="POST">
  <input type="hidden" name="full_name" value="Mridankan Mandal (Hijacked via CSRF)" />
  <input type="hidden" name="bio" value="Account profile compromised via Cross Site Request Forgery." />
</form>
<script>
  window.onload = function() { document.getElementById('csrfForm').submit(); };
</script>
```
5. The victim browser submits the form and automatically attaches the valid `session_token` cookie.
6. The backend server authenticates the request through the attached cookie and modifies the administrator biography without victim consent.

## 6. How the Vulnerability is Defended in Version 2:
1. Anti CSRF Synchronizer Tokens: In file `server/routes/auth.js`, a unique cryptographic token is generated per session and verified on all state changing requests.
```javascript
function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const submittedToken = req.headers['x_csrf_token'] || req.body?.csrf_token;
  const expectedToken = req.user?.csrfToken;
  if (!submittedToken || !expectedToken || submittedToken !== expectedToken) {
    return res.status(403).json({ error: 'CSRF Protection: Missing or invalid Anti CSRF synchronizer token.' });
  }
  next();
}
```
2. SameSite Strict Session Cookies: In file `server/routes/auth.js`, authentication cookies are configured with `sameSite: 'strict'` and `httpOnly: true`.
```javascript
res.cookie('session_token', token, {
  httpOnly: true,
  sameSite: 'strict',
  path: '/'
});
```
3. Origin and Referer Header Verification: In file `server/routes/auth.js`, security middleware rejects requests dispatched from untrusted foreign origins.
```javascript
const origin = req.headers.origin;
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (origin && !allowedOrigins.includes(origin)) {
  return res.status(403).json({ error: 'CSRF Blocked: Untrusted Origin header.' });
}
```

## 7. Preconfigured Community Accounts:
1. Mridankan Mandal: Username is `mridankan` and password is `mridankan123` with `Administrator` role.
2. Ankit Ekka: Username is `ankit` and password is `ankit123` with `Contributor` role.
3. Dhannu Meena: Username is `dhannu` and password is `dhannu123` with `Contributor` role.
4. Aditya Pachauri: Username is `aditya` and password is `aditya123` with `Student` role.
5. Sayan Samajpati: Username is `sayan` and password is `sayan123` with `Student` role.
6. Lucky Raut: Username is `lucky` and password is `lucky123` with `Student` role.

## 8. Setup and Execution Guide:
1. To run Version 1.
```bash
cd IIITAOSCommunityForumV1
npm install
npm run build
npm start
```
2. To run Version 2.
```bash
cd IIITAOSCommunityForumV2
npm install
npm run build
npm start
```
3. Web Application URL: The server runs locally on `http://localhost:3000`.

## 9. Comprehensive Explanations Document:
1. Please read `Explainations.md` located in the root of this repository for an in depth technical deep dive covering architecture, attack execution, and defense mechanics.
