# Comprehensive Technical Explanations of Cross Site Request Forgery and Defense:

## 1. Executive Summary of the Project:
1. This project investigates and demonstrates Problem 2: Cross Site Request Forgery (CSRF) within a fullstack web forum developed for the IIIT Allahabad Open Source Community.
2. The project delivers two separate editions of the application to facilitate a direct security comparison.
3. The first edition, located in folder `IIITAOSCommunityForumV1`, contains deliberate architectural flaws that allow cross origin request forgery.
4. The second edition, located in folder `IIITAOSCommunityForumV2`, implements an industry standard defense in depth strategy that completely eliminates CSRF vulnerabilities.

## 2. Directory Structure and Component Breakdown:

### 2.1 Directory `IIITAOSCommunityForumV1` (Vulnerable Edition):
1. Purpose: Implements the initial version of the forum where state changing operations rely solely on ambient session cookies without anti CSRF tokens or SameSite restrictions.
2. Backend (`server/`): Contains Express routes where POST and PUT handlers execute state changes without cryptographic token validation or origin checks.
3. Frontend (`client/`): Contains the React user interface for discussions, comments, member profiles, and live chat.
4. Attacker Exploit: Includes `public/attackerCsrfExploit.html` demonstrating cross origin hidden form auto submission against the live forum.
5. Storage: Embedded SQLite database `forum.db` storing discussion posts, comments, live chat messages, and user biographies.
6. Documentation: Contains `ReadMe.md` and `Vulnerable.md`.

### 2.2 Directory `IIITAOSCommunityForumV2` (Secured Edition):
1. Purpose: Implements the hardened version of the forum where all Cross Site Request Forgery vectors are mitigated.
2. Backend (`server/`): Implements Anti CSRF synchronizer token verification, `SameSite=Strict` cookie policies, and Origin and Referer validation middleware in `routes/auth.js`.
3. Frontend (`client/`): Configured in `client/src/App.jsx` to fetch the session CSRF token and attach the CSRF token header on state changing requests.
4. Storage: Embedded SQLite database `forum.db` operating alongside secure request verification pipelines.
5. Documentation: Contains `ReadMe.md` and `CSRFAttackDefense.md`.

## 3. Detailed Analysis of the Cross Site Request Forgery Flaw in Version 1:

### 3.1 What is Cross Site Request Forgery:
1. Definition: Cross Site Request Forgery is an attack where a malicious third party web application tricks a victim web browser into executing unauthorized state changing actions on a trusted web application in which the victim is currently authenticated.
2. Ambient Credential Mechanism: Web browsers automatically attach all stored cookies associated with a domain whenever an HTTP request is made to that domain, even if the request was initiated by an external site.
3. Danger for Authenticated Users: If an authenticated administrator visits an external malicious web page, that page can silently submit requests with administrative privileges without requiring user interaction.

### 3.2 Where the Code Flaws Exist in Version 1:
1. Missing Anti CSRF Tokens in `server/routes/auth.js`: The endpoint `POST /api/auth/profile` accepts state changes without requiring or verifying a unique unpredictable token.
```javascript
const handleProfileUpdate = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const fullName = req.body.fullName || req.body.full_name || req.user.full_name;
  const bio = req.body.bio !== undefined ? req.body.bio : req.user.bio;
  const db = getDB();
  db.prepare('UPDATE users SET full_name = ?, bio = ? WHERE id = ?').run(
    fullName,
    bio,
    req.user.id
  );
  return res.json({ message: 'Profile updated successfully' });
};
router.post('/profile', authenticate, handleProfileUpdate);
```
2. Unrestricted Cookie SameSite Configuration in `server/routes/auth.js`: The authentication cookie is issued without `SameSite=Strict` protection, meaning the browser attaches the cookie on cross origin form submissions.
```javascript
res.cookie('session_token', token, {
  path: '/'
});
```
3. Missing Origin and Referer Header Verification in `server/server.js`: The Express server accepts requests regardless of whether the `Origin` header matches the trusted application domain.

## 4. How to Execute a Cross Site Request Forgery Attack on Version 1:

### 4.1 Step by Step Attack Walkthrough:
1. Step 1: The victim logs into the forum platform using credentials for `mridankan` with password `mridankan123`.
2. Step 2: The browser receives the `session_token` cookie and stores it for `localhost:3000`.
3. Step 3: The attacker hosts an external webpage `attackerCsrfExploit.html` containing an invisible HTML form.
```html
<form id="csrfForm" action="http://localhost:3000/api/auth/profile" method="POST">
  <input type="hidden" name="fullName" value="Mridankan Mandal (Hijacked via CSRF)" />
  <input type="hidden" name="bio" value="Account profile compromised via Cross Site Request Forgery." />
</form>
<script>
  window.onload = function() { document.getElementById('csrfForm').submit(); };
</script>
```
4. Step 4: The victim visits the attacker web page while keeping the forum session active in another browser tab.
5. Step 5: The malicious page triggers immediate form submission targeting `http://localhost:3000/api/auth/profile`.
6. Step 6: The victim browser automatically includes the valid `session_token` cookie.
7. Step 7: The backend server receives the request, verifies the session cookie, and executes the biography update.
8. Step 8: The administrator biography is updated without victim knowledge or consent.

### 4.2 Advanced Attack Scenario: Forged Community Announcements:
1. Payload.
```html
<form action="http://localhost:3000/api/posts" method="POST">
  <input type="hidden" name="title" value="Emergency Society Announcement" />
  <input type="hidden" name="category" value="Announcements" />
  <input type="hidden" name="content" value="Phishing message broadcasted on behalf of the administrator." />
</form>
```
2. Explanation: Exploits administrative credentials to publish misleading notices across the entire student community.

## 5. Detailed Breakdown of the Defense Mechanisms in Version 2:

### 5.1 Defense 1: Cryptographic Anti CSRF Synchronizer Tokens:
1. Implementation Location: In file `IIITAOSCommunityForumV2/server/routes/auth.js`.
2. How It Operates: Upon login, the server generates a cryptographically random 256 bit token using `crypto.randomBytes(32)` and stores it in the active session record.
3. Code Implementation.
```javascript
function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const submittedToken = req.headers['x_csrf_token'] || req.body?.csrfToken || req.body?.csrf_token;
  const expectedToken = req.user?.csrfToken;
  if (!submittedToken || !expectedToken || submittedToken !== expectedToken) {
    return res.status(403).json({
      error: 'CSRF Protection: Missing or invalid Anti CSRF synchronizer token.'
    });
  }
  next();
}
```
4. Security Guarantee: Because of the Same Origin Policy, external malicious sites cannot read the CSRF token from the application, making it impossible to forge a valid request.

### 5.2 Defense 2: Session Cookie Hardening with SameSite Strict:
1. Implementation Location: In file `IIITAOSCommunityForumV2/server/routes/auth.js`.
2. How It Operates: The server configures the authentication cookie with `sameSite: 'strict'` and `httpOnly: true`.
3. Code Implementation.
```javascript
res.cookie('session_token', token, {
  httpOnly: true,
  sameSite: 'strict',
  path: '/'
});
```
4. Security Guarantee: The browser strictly refuses to attach the `session_token` cookie when a cross origin form or script initiates an HTTP request targeting `localhost:3000`.

### 5.3 Defense 3: Origin and Referer Request Header Validation:
1. Implementation Location: In file `IIITAOSCommunityForumV2/server/routes/auth.js`.
2. How It Operates: Security middleware inspects the `Origin` and `Referer` headers on all state changing requests.
3. Code Implementation.
```javascript
const origin = req.headers.origin;
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (origin && !allowedOrigins.includes(origin)) {
  return res.status(403).json({
    error: 'CSRF Blocked: Cross origin state modification rejected. Untrusted Origin: ' + origin
  });
}
```
4. Security Guarantee: Requests arriving from foreign origins are rejected immediately before touching the database.

## 6. Demonstration of Attack Neutralization in Version 2:

### 6.1 Testing the Forged Exploit on Version 2:
1. The attacker attempts to trigger the identical forged request against `http://localhost:3000/api/auth/profile`.
2. In Version 2, the browser suppresses the `session_token` cookie due to `SameSite=Strict`.
3. The server middleware detects the missing CSRF token header and foreign `Origin`.
4. The server rejects the request with HTTP 403 Forbidden.
```json
{
  "error": "CSRF Protection: Missing or invalid Anti CSRF synchronizer token."
}
```
5. The administrator profile remains completely intact and secure.

## 7. Direct Technical Comparison Between Version 1 and Version 2:
1. CSRF Protection: Version 1 has zero token verification while Version 2 validates a cryptographic synchronizer token on all state changing routes.
2. Cookie Policy: Version 1 uses default unrestricted cookies while Version 2 enforces `SameSite=Strict` and `HttpOnly`.
3. Request Origin Validation: Version 1 allows any origin while Version 2 strictly whitelists trusted origins.
4. Attack Outcome: In Version 1, CSRF succeeds silently and alters user profiles. In Version 2, all forged requests are rejected with HTTP 403 Forbidden and user accounts remain completely protected.
