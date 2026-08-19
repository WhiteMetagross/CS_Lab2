# IIIT-A Open Source Community Forum:

## 1. Project Overview:
- This project is a full-stack community chatting and discussion forum designed for the IIIT Allahabad Open Source Community.
- The web application allows students, faculty members, and project coordinators to create discussion threads, leave comments, participate in live community chats, and manage member profiles.
- This repository represents Version 1 (V1) of the platform, which is intentionally designed with a Stored Cross-Site Scripting (XSS) vulnerability for educational security demonstration.

## 2. Technology Stack:
- Backend: Node.js with Express.js framework for REST API routing and session management.
- Database: Embedded SQLite 3 database using node:sqlite storing records in forum.db.
- Frontend: React.js bundled via Vite into static assets served directly by Express.
- User Interface: Clean, professional white theme with vibrant colored card borders, custom badges, and zero emojis.

## 3. Core System Features:
- User Authentication: Registration and login using username and password credentials.
- Categorized Discussions: Forum categories for Announcements, Guides, General Discussion, and Bug Reports.
- Interactive Comment Threads: Users can read and post replies on any community discussion.
- Real-Time Community Chat: Live messaging stream with automatic synchronization.
- Member Directory: Public member profiles displaying user roles and editable biographies.

## 4. Pre-Configured Community Accounts:
- Mridankan Mandal: Username is mridankan and password is mridankan123 with Administrator role.
- Ankit Ekka: Username is ankit and password is ankit123 with Contributor role.
- Dhannu Meena: Username is dhannu and password is dhannu123 with Contributor role.
- Aditya Pachauri: Username is aditya and password is aditya123 with Student role.
- Sayan Samajpati: Username is sayan and password is sayan123 with Student role.
- Lucky Raut: Username is lucky and password is lucky123 with Student role.

## 5. Local Setup and Installation:
- Prerequisites: Ensure Node.js version 18 or higher and npm are installed on the system.
- Step 1: Clone the repository or navigate to the project directory.
- Step 2: Install dependencies by running npm install in the terminal.
- Step 3: Compile the frontend assets by running npm run build.
- Step 4: Launch the server by executing npm start.
- Step 5: Open http://localhost:3000 in your web browser.

## 6. Vulnerability Documentation:
- Please refer to Vulnerable.md for the complete exploitation guide, attack examples, code analysis, and demonstration steps.
