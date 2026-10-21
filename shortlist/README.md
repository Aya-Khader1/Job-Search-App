# Shortlist: frontend for Job-Search-App

React 19 + TypeScript + Vite + Tailwind 4 + TanStack Query + Socket.IO client.
Talks to the backend in [Aya-Khader1/Job-Search-App](https://github.com/Aya-Khader1/Job-Search-App).

## Run it

```bash
npm install
cp .env.example .env     # set VITE_API_URL (default http://localhost:3000)
npm run dev              # http://localhost:5173
```

The backend allows any origin (`cors({ origin: "*" })`), so no proxy is needed.
Optional: set `VITE_GOOGLE_CLIENT_ID` (same as the backend's `CLIENT_ID`) to show "Continue with Google", and add `http://localhost:5173` to the authorised JavaScript origins in Google Cloud.

## What's in it

| Area | Screens |
|---|---|
| Account | Sign in, sign up, email OTP confirmation, forgot/reset password, Google sign-in, silent token refresh |
| Seekers | Sentence-style job search (title, level, schedule, location, skills), master/detail job view, apply with a PDF CV, company directory and company pages, profile (photo, covers, details, password, delete account) |
| Employers | Register company, post/edit/close/delete jobs, review applications (CV link, accept/reject, message), logo and cover uploads, company settings, Excel export by day |
| Chat and alerts | Live messages over Socket.IO, unread badges, live "new application" notifications |
| Admin | Users and companies (GraphQL), ban/unban, approve companies |

## Backend changes this frontend needs

I read the backend source and found issues that block features. The UI is built to cope where it can, but these are worth fixing.

### 1. Socket.IO is never started (chat and live notifications won't work)
In `src/app.controller.ts` the call is commented out and `app.listen` isn't kept:

```ts
const httpServer = app.listen(Number(env.PORT), () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
intializeSocket(httpServer);
```

### 2. Rate limiter allows 3 requests per minute per IP
`src/Middlewares/rate-limit.middleware.ts` has `RATE_LIMIT = 3`. One page load uses more than that, so everything returns 429 and the IP is blocked for a minute. Raise it (for example `100`) for development. The UI shows a clear message on 429 and avoids retries and refetch-on-focus.

### 3. Applications query populates paths that don't exist
In `job.service.ts`, `getAllApplication` populates `user`, and `updateApplicationStatus` populates `user` and `job`. The Application schema only has `userId` and `jobId`, so Mongoose 7's strict populate should throw and both endpoints return 500. Change the paths to `userId` and `jobId`. The UI reads either shape. I did not run this against a live database, so confirm it on your side.

### 4. Notification module bugs (the bell and notifications page depend on these)
The UI follows the intended contract (`GET /notifications?page&limit&isRead`, `GET /unread-count`, `PATCH /mark-as-read/:id`, `PATCH /mark-all-read`, `DELETE /:id`, socket event `newNotification`). I found these in the code:

- **Not mounted on GitHub:** `app.controller.ts` needs `app.use("/api/v1/notification", notificationController);`.
- **Type enum mismatch (breaks applying):** `job.service.ts` creates notifications with `"new_application"` and `"application_status"`, but the model's enum is uppercase (`NEW_APPLICATION`, `APPLICATION_STATUS`). Mongoose rejects them, so `apply-job` fails with an error right after saving the application. Use `NotificationTypeEnum.NEW_APPLICATION` / `.APPLICATION_STATUS`.
- **List validation:** `getNotificationQuerySchema` validates `params`, and `isRead` is a required boolean, so the list always returns 400. It should be:
  ```ts
  export const getNotificationQuerySchema = {
    query: z.strictObject({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      isRead: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
    }),
  };
  ```
  (and read it from `req.query`, with `INotificationQuerySchema` inferred from `.query`).
- **Inverted check in `markAsRead`:** `if (updated) throw ...` should be `if (!updated) throw ...`. The UI refetches after every change, so it still shows the right state, but the API returns 400 on success today.
- **`/mark-all-read` calls the wrong handler:** use `notificationService.markAllAsRead`.
- **The company owner is never notified:** recipients are `company.HRs` only, and there's no endpoint to add HRs. Include `company.createdBy`.
- **Status notification is hard-coded:** it always says "accepted" and "for the  position". Use `status` and `job.jobTitle` from the populated job.

### 5. Things the UI works around
- **No "list companies" endpoint:** the UI calls `/company/search?name=.` (a regex that matches every name). Cached once, it powers the directory, company names on jobs, and "your companies".
- **No "my applications" or "my conversations" endpoints:** applied jobs and conversation lists are remembered in `localStorage` per user, so they're per-device.
- **`get` and `get-applications` don't default `page`/`limit`:** the UI always sends both.
- **Update profile requires `DOB`** (it isn't marked optional), so the profile form requires it.
- **Sign-up splits `username` into first and last name:** a one-word name breaks the model, so the form asks for two words.
- **No endpoint to add HRs:** only the company creator can manage a company.

## Structure

```
src/
  lib/         api client (refresh, errors), endpoints, auth, realtime, toast
  components/  ui kit, layout, job rows and detail, forms
  pages/       Auth, Jobs, Companies, Employer, Messages, Profile, Admin
```

## Verified

Type-checked and built, then exercised in a headless browser against a mock server that reproduces the backend's response shapes: login, search with highlighting, apply, post job, accept applicant, two-way live chat, admin, mobile layout. It has not been run against the real backend, because that needs MongoDB, Cloudinary and SMTP.
