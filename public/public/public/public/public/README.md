
EatHub
EatHub is a mobile-friendly digital menu and restaurant management platform designed for restaurants, hotels, cafés, and other food businesses.
Current project status
The project files are being prepared. Deployment and production use are not yet approved.
Some pages are previews only. Authentication, restaurant registration, administration, menu management, QR ordering, payments, and reporting must be implemented and tested before the system is ready for real business use.
Technology
Node.js
Express
Supabase PostgreSQL database
Supabase Row Level Security (RLS)
HTML, CSS, and JavaScript
Render hosting
GitHub source control
Project structure
eathub/
├── package.json
├── server.js
├── schema.sql
├── README.md
└── public/
    ├── index.html
    ├── menu.html
    ├── register.html
    ├── login.html
    ├── dashboard.html
    ├── admin.html
    ├── styles.css
    └── app.js
Database setup
Create a Supabase project.
Open the Supabase SQL Editor.
Run the reviewed schema.sql script.
Verify that the required tables exist.
Test all Row Level Security policies before using real customer or business data.
The database currently includes tables for restaurants, restaurant memberships, dishes, and menu views.
Environment variables
Configure the following variables in the hosting provider's environment settings:
SUPABASE_URL — your Supabase project URL.
SUPABASE_ANON_KEY — your Supabase public/anon key.
The current server needs these values to connect to Supabase.
Never commit passwords, private keys, access tokens, or the Supabase service-role key to GitHub. A service-role key must never be exposed in browser code.
Local development
Install Node.js 20 or later.
Install the project dependencies:
npm install
Set the required environment variables using your local environment or a private environment configuration method.
Start the server:
npm start
The default local address is:
http://localhost:3000
Health check
The server provides a health endpoint:
/api/health
It reports whether the application is running and whether Supabase configuration values are present. This alone does not prove that database queries, security policies, or all features work correctly.
Before deployment
[ ]
Connect and test Supabase authentication.
[ ]
Secure restaurant owner, staff, and platform administrator permissions.
[ ]
Review database RLS policies and database grants.
[ ]
Connect registration to a secure approval workflow.
[ ]
Connect the dashboard to restaurant-specific menu APIs.
[ ]
Test QR codes and restaurant-specific menu links.
[ ]
Add order management if ordering is enabled.
[ ]
Integrate M-Pesa using server-side payment verification if payments are enabled.
[ ]
Test on Android phones and desktop browsers.
[ ]
Verify health checks, logs, backups, and recovery.
[ ]
Test that one restaurant cannot access another restaurant's private data.
Deployment
Deployment will begin only after the files are committed, configuration is reviewed, and security and functionality checks are complete.
The production site must not be treated as ready for real business operations until the required features and security controls have been verified.
