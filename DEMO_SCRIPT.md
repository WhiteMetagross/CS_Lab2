# Step-by-Step Video Demonstration Script
### Assignment 2: Problem 1 — Stored Cross-Site Scripting (XSS)
**Target Length:** 8 - 10 Minutes Total  
**Application:** IIIT-A Open Source Community Chatting Forum  
**Tone:** Clear, Academic, Structured

---

## Act 1: Normal Intended Functionality Walkthrough (2.5 Minutes)
*Goal: Introduce the platform, show user roles, post creation, comments, and chat without hinting at any vulnerability.*

- **Screen Action:** Open `http://localhost:3000` in browser.
- **Narration:**
  > "Hello everyone. Today I will be demonstrating our web application project titled 'IIIT-A Open Source Community chatting forum' for Cyber Security Assignment 2, Problem 1: Stored Cross-Site Scripting.
  > 
  > Our application is a full-stack platform built with Node.js, Express, React, and an embedded SQLite database. It features user authentication, discussion threads, member profiles, and a live community chat room.
  > 
  > As you can see on the screen, we have a clean discussion feed with categorized posts such as Announcements, Guides, and General Discussions. Currently, I am logged in as Alice, a second-year student contributor.
  > 
  > If we click into the first post, 'Welcome to the IIIT-A Open Source Community Forum', we can read the post guidelines and review comments left by other students and faculty coordinators. We can also submit a new comment.
  > 
  > Next, switching to the 'Live Community Chat' tab, we see real-time message synchronization where members can exchange quick updates. In the 'Member Profiles' tab, we can view registered community members and edit our own user biography."

---

## Act 2: Live Stored XSS Attack Demonstration (3 Minutes)
*Goal: Inject a stored payload as the attacker, then switch to the victim account to show automated execution and cookie theft.*

- **Screen Action:** 
  1. Click the Demo User dropdown in the top-right and select **`attacker`**.
  2. Navigate to the **`Exploit Inspector & Code Walkthrough`** tab.
  3. Select **`Payload 2: Session Cookie Exfiltration (Stealer)`** or click **`Inject Directly into Post #1 Comments`**.
  4. Switch the user back to **`admin`** or **`alice`**.
  5. Go to **`Discussions & Posts`** tab and open **`Post #1`**.
- **Narration:**
  > "Now, let us demonstrate an attack scenario. In our scenario, a malicious user account named 'attacker' submits a comment containing an unneutralized HTML and JavaScript payload into Discussion #1.
  > 
  > Notice that the server accepts the payload and writes it permanently into the SQLite database.
  > 
  > Now, let us imagine that Dr. Admin or another student, Alice, logs into the platform and opens Discussion #1 to review project comments.
  > 
  > As soon as Alice opens the post, the browser loads the stored comments from the database. Because the application fails to neutralize the stored content, the payload executes immediately in Alice's browser session.
  > 
  > If we switch to the 'Exploit Inspector' tab and look at the Attacker Exfiltration Receiver logs, we can see that Alice's active session identifier was quietly stolen and transmitted to the attacker's server in the background without any user interaction."

---

## Act 3: Explaining the Underlying Code Flaw (2 Minutes)
*Goal: Point out the exact vulnerable lines in the backend and frontend.*

- **Screen Action:** Show the side-by-side code diff in the **`Exploit Inspector & Code Walkthrough`** tab or open the code in VS Code.
- **Narration:**
  > "Let us examine why this vulnerability occurred in our codebase.
  > 
  > In `server/routes/posts.js`, the backend server accepts user input and writes it directly to the SQLite database using an SQL query without stripping hazardous tags or performing strict input validation.
  > 
  > However, the root flaw exists on the client side in `SafeRenderer.jsx`. In Vulnerable Mode, the component takes the stored raw string and sets `element.innerHTML = rawContent`.
  > 
  > When the browser encounters tags like `<img src=x onerror=...>` or `<script>`, the browser treats them as executable code rather than plain text. 
  > 
  > Furthermore, because our session cookie in `server/routes/auth.js` was not configured with the `HttpOnly` flag, the executing script could easily access `document.cookie` and exfiltrate the authentication token."

---

## Act 4: Mitigation and Fixed Version Verification (2 Minutes)
*Goal: Switch to Secure Mode, reload the post, and prove that the exploit is neutralized.*

- **Screen Action:**
  1. Click the top-right button: **`Switch to Secure`**.
  2. Clear the attacker logs.
  3. Revisit Discussion #1 in the **`Discussions & Posts`** tab.
  4. Show that the injected script is safely neutralized and displayed harmlessly as text.
- **Narration:**
  > "To fix this vulnerability comprehensively, we implemented a multi-layered mitigation.
  > 
  > First, in `SafeRenderer.jsx`, we introduced DOMPurify sanitization. In Secure Mode, all dangerous tags, inline event handlers, and JavaScript URIs are sanitized before being added to the DOM.
  > 
  > Second, in `server/routes/auth.js`, we enabled the `HttpOnly: true` and `SameSite: strict` flags on session cookies. This ensures that even if an XSS flaw existed, scripts cannot access the session token.
  > 
  > Third, the server sends Content-Security-Policy (CSP) headers that forbid unauthorized inline script execution.
  > 
  > If we now switch our application to 'Secure Mode' and revisit Discussion #1, you will see that the payload is safely neutralized and rendered harmlessly as plain text. No scripts execute, and no cookies are exfiltrated.
  > 
  > Thank you for watching our demonstration."
