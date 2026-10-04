# Job Search App

A backend REST API for a job-search platform that connects job seekers with companies. It handles users, companies, job postings, job applications, real-time HR/applicant chat, and an admin dashboard.

Built with **Node.js, TypeScript, Express, and MongoDB**.

## Features

### Authentication & Security
- Sign up with email verification via a hashed, expiring OTP
- Sign in with access token (1h) and refresh token (7d)
- Sign up / log in with Google
- Forgot-password flow with OTP and password reset
- Refresh-token endpoint that respects credential changes
- Password hashing (bcrypt) and encrypted phone numbers using Mongoose hooks
- Authentication and role-based authorization middleware (User / Admin)
- Rate limiting, Helmet, and CORS configuration
- Scheduled cleanup (cron, every 6 hours) that deletes expired OTP codes

### Users
- Update account details, change password, soft-delete account
- View own profile and other users' public profiles
- Upload and delete profile and cover pictures (Cloudinary)

### Companies
- Create, update, and soft-delete companies (owner or admin only)
- Upload and delete company logo and cover picture
- Search companies by name
- Get a company together with its jobs (virtual populate)
- Admin approval and ban/unban for companies

### Jobs & Applications
- Create, update, and delete jobs (company owner / HR permissions enforced)
- List jobs with filtering (working time, location, seniority level, title, technical skills), pagination, sorting, and total count
- Apply to a job with a PDF CV upload
- HR/owner can view applications for a job (with applicant data, paginated)
- Accept or reject an applicant, with an automatic email notification
- Real-time notification to HR when a new application arrives (Socket.IO)

### Chat
- Real-time messaging between HR/company owner and applicants (Socket.IO)
- Chat history between two users
- Conversations can only be started by HR or the company owner

### Admin Dashboard
- GraphQL query that returns all users and all companies in a single request
- Ban / unban users and companies
- Approve companies

### Data Integrity
- Request validation on every endpoint that accepts data
- Mongoose hooks that remove related documents when a document is deleted

## Tech Stack

| Area | Technology |
|---|---|
| Runtime / Language | Node.js, TypeScript |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Real-time | Socket.IO |
| Admin API | GraphQL |
| Auth | JWT, bcrypt, Google login |
| File storage | Cloudinary |
| Scheduling | Cron jobs |
| Security | Helmet, CORS, rate limiting |

## Data Models

- **User**: profile data, role, OTP list, ban / soft-delete state, profile and cover pictures
- **Company**: details, owner, HR list, approval and ban state, logo, cover, legal attachment
- **Job**: title, location type, working time, seniority, skills, company, closed flag
- **Application**: job, applicant, CV file, status (`pending`, `viewed`, `in consideration`, `accepted`, `rejected`)
- **Chat**: sender, receiver, and message history

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Cloudinary account
- Google OAuth credentials
- An email account / SMTP service for OTP and notification emails

### Installation

```bash
git clone https://github.com/Aya-Khader1/Job-Search-App.git
cd Job-Search-App
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MODE=DEVELOPMENT

# Database
DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/job_search_db

SALT_ROUNDS=10

# Email (SMTP)
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Tokens
ACCESS_USER_SIGNATURE=your_secret
REFRESH_USER_SIGNATURE=your_secret
ACCESS_ADMIN_SIGNATURE=your_secret
REFRESH_ADMIN_SIGNATURE=your_secret
ACCESS_TOKEN_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800

# Encryption (must be 32 characters)
ENCRYPTION_SECRET_KEY=your_32_character_secret_key

# CORS
WHITE_LIST=http://localhost:5500,http://localhost:3000

# Google login
CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run in Development

```bash
npm run dev
```

## Testing the API

All endpoints were tested with Postman. The exported collection is in the `postman/` folder: import it into Postman and set the base URL to your server.

For manual testing of real-time features, open the HTML clients in the `examples/` folder while the server is running.

## Project Structure

```
src/
  modules/      feature modules (auth, user, company, job, application, chat, admin)
  middleware/   authentication, authorization, validation
  DB/           models and connection
  utils/        helpers (email, OTP, uploads, ...)
```

## Author

**Ayah Khader**: Software Engineering student, backend developer
[GitHub](https://github.com/Aya-Khader1)
