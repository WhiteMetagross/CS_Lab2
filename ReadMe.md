# IIITA Open Source Community Forum Repository:

## 1. Project Introduction:
1. This repository contains the complete implementation, vulnerability analysis, and security remediation for the IIIT Allahabad Open Source Community Forum web application.
2. The project demonstrates a real world scenario of Stored Cross Site Scripting (XSS) in an interactive web platform and provides an industry standard defense implementation.
3. The codebase is organized into two distinct standalone versions to contrast vulnerable code patterns against secure programming practices.

## 2. Repository Structure and Folder Contents:

### 2.1 Folder IIITAOSCommunityForumV1:
1. Purpose: Contains Version 1 of the web application which is intentionally vulnerable to Stored Cross Site Scripting.
2. Server Code: Contains the Express server, SQLite database initializers, authentication endpoints, discussion routes, and live chat handlers.
3. Client Code: Contains the React frontend with rich text rendering that inserts raw HTML strings directly into the DOM using innerHTML.
4. Documentation: Includes ReadMe.md with setup instructions and Vulnerable.md with a detailed attack manual and code breakdown.

### 2.2 Folder IIITAOSCommunityForumV2:
1. Purpose: Contains Version 2 of the web application where all Cross Site Scripting vulnerabilities have been thoroughly fixed.
2. Server Code: Contains the hardened Express server with Content Security Policy headers and HttpOnly SameSite cookie configuration.
3. Client Code: Contains the updated React frontend utilizing DOMPurify to sanitize and neutralize user supplied markup before DOM injection.
4. Documentation: Includes ReadMe.md and XSSAttackDefense.md explaining the exact defenses implemented and how they operate.

## 3. Technology Stack:
1. Backend: Node.js runtime environment using the Express web framework.
2. Database: Embedded SQLite 3 database engine utilizing native node:sqlite with persistent storage in forum.db.
3. Frontend: React user interface bundled with Vite and Vanilla CSS design tokens.
4. Styling: Clean professional white theme featuring full colored card borders and custom role badges.

## 4. Summary of the Stored XSS Vulnerability in Version 1:
1. Ingestion Flaw: The backend accepts discussion posts, comments, chat messages, and biographies without sanitization and saves them directly to SQLite.
2. Rendering Flaw: The React frontend uses innerHTML to render stored content so that users can format text, but inadvertently executes embedded script tags and event handlers.
3. Cookie Exposure: Authentication session cookies do not use the HttpOnly flag, allowing browser scripts to read authentication tokens via document.cookie.

## 5. How an Attack is Executed on Version 1:
1. An attacker registers or logs in with an account such as lucky with password lucky123.
2. The attacker navigates to an active discussion thread such as Welcome to the IIITA Open Source Community Forum.
3. The attacker posts a comment containing an image tag with an onerror event handler such as: <img src="invalid" onerror="alert('Stored XSS Triggered! Session Cookie: ' + document.cookie)">.
4. The server stores this comment permanently in the SQLite database.
5. When another user such as Dr. Mridankan Mandal (Administrator) views the discussion, the browser parses the unescaped markup.
6. The image fails to load and immediately triggers the onerror JavaScript payload, exposing the administrator session cookie.

## 6. How the Vulnerability is Defended in Version 2:
1. DOMPurify Sanitization: In file client/src/components/ContentRenderer.jsx, all user markup is sanitized using DOMPurify before DOM insertion, stripping dangerous script tags and event attributes.
2. HttpOnly Session Cookies: In file server/routes/auth.js, cookies are configured with httpOnly true and sameSite strict so JavaScript cannot access session tokens.
3. Content Security Policy: In file server/server.js, HTTP headers restrict script execution sources to self, preventing unauthorized script execution.

## 7. Preconfigured Community Accounts:
1. Mridankan Mandal: Username is mridankan and password is mridankan123 with Administrator role.
2. Ankit Ekka: Username is ankit and password is ankit123 with Contributor role.
3. Dhannu Meena: Username is dhannu and password is dhannu123 with Contributor role.
4. Aditya Pachauri: Username is aditya and password is aditya123 with Student role.
5. Sayan Samajpati: Username is sayan and password is sayan123 with Student role.
6. Lucky Raut: Username is lucky and password is lucky123 with Student role.

## 8. Setup and Execution Guide:
1. To run Version 1: Navigate to the IIITAOSCommunityForumV1 directory, run npm install, run npm run build, and run npm start.
2. To run Version 2: Navigate to the IIITAOSCommunityForumV2 directory, run npm install, run npm run build, and run npm start.
3. Web Application URL: The server runs locally on http://localhost:3000.

## 9. Comprehensive Explanations Document:
1. Please read Explainations.md located in the root of this repository for an in depth technical deep dive covering architecture, attack execution, and defense mechanics.
