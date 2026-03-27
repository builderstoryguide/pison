# School Management App

A comprehensive school management system built with Next.js, TypeScript, and Tailwind CSS, designed for Pison Academy of Excellence.

## Features

### Student Management

- **Student Enrollment**: Complete multi-step enrollment process for new students
- **Student Records**: Comprehensive student information management
- **Parent Information**: Store and manage parent/guardian details
- **Medical Information**: Track student medical conditions and allergies
- **Emergency Contacts**: Manage emergency contact information
- **Fee Management**: Track student fees and payment status

### Database Support

- **Supabase Integration**: Full database support with PostgreSQL
- **Database-Only Storage**: All student data is stored in the database
- **Automatic Sync**: Seamless data synchronization between local and remote storage

### User Interface

- **Modern Design**: Clean, responsive interface built with Tailwind CSS
- **Multi-step Forms**: Intuitive enrollment process with progress tracking
- **Real-time Validation**: Form validation with helpful error messages
- **Success Notifications**: Clear feedback for completed actions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (optional, for database functionality)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd school-management-app
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Set up environment variables (optional for database):

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🐳 Docker Setup (Recommended for Teams)

For a consistent development environment across all team members:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Copy environment template:
   ```bash
   cp env.docker.example .env.docker
   ```
3. Update `.env.docker` with your Supabase credentials
4. Start all services:
   ```bash
   docker-compose up -d
   ```

**Services available:**

- **App**: http://localhost:3000 (with hot reload)
- **PostgreSQL**: localhost:5432 (local database for testing)
- **pgAdmin**: http://localhost:5050 (database management UI)

📚 **See [DOCKER-README.md](./DOCKER-README.md) for complete Docker setup guide**  
⚡ **Quick reference: [DOCKER-QUICKREF.md](./DOCKER-QUICKREF.md)**

**Why Docker?**

- ✅ Same environment for entire team
- ✅ No "works on my machine" issues
- ✅ Includes local PostgreSQL for testing
- ✅ Easy database management with pgAdmin
- ✅ One command to start everything

## Database Setup

For full functionality with database support:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL script in `scripts/create-tables.sql` in your Supabase SQL Editor
3. Add your Supabase credentials to `.env.local`
4. Set **`AUTH_SESSION_SECRET`** (at least 32 random characters, recommended) for signing the httpOnly session cookie used by report-card APIs (`GET /api/report-cards/[studentId]`, `GET /api/report-cards/pdf`). If it is unset, the server derives a deterministic fallback signing secret from **`SUPABASE_SERVICE_ROLE_KEY`** + **`NEXT_PUBLIC_SUPABASE_URL`** so production login does not fail from a single missing variable. **`SUPABASE_SERVICE_ROLE_KEY`** must be available on the server so those routes can verify users and enforce student/parent access. Rotating `SUPABASE_SERVICE_ROLE_KEY` also rotates that fallback secret and invalidates existing sessions.

See `scripts/setup-database.md` for detailed setup instructions.

## Student Enrollment Process

### For Administrators

1. Navigate to **Student Management** in the admin dashboard
2. Click **"Enroll Student"** button
3. Complete the 6-step enrollment form:
   - **Step 1**: Personal Information (name, birth details, etc.)
   - **Step 2**: Contact Information (email, address, etc.)
   - **Step 3**: Academic Information (subsystem, branch, class)
   - **Step 4**: Parent/Guardian Information
   - **Step 5**: Emergency & Medical Information
   - **Step 6**: Required Documents confirmation
4. Submit the form to complete enrollment
5. Receive student ID and parent access code

### Data Storage

- **Database Required**: All student data is stored in Supabase PostgreSQL database
- **No Local Storage**: Student enrollment and management requires database connection
- **Error Handling**: Clear error messages when database is unavailable

## Project Structure

```
school-management-app/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── ui/                # Reusable UI components
│   └── ...
├── lib/                   # Utility functions and contexts
├── scripts/               # Database setup scripts
└── public/                # Static assets
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Form Handling**: React Hook Form
- **Validation**: Zod schema validation

### PDF generation (report cards)

Report card **Download PDF** uses Puppeteer and Chromium’s native print-to-PDF (`GET /api/report-cards/pdf`) so the file matches the on-screen layout. Class list PDFs use the same stack (`lib/class-list-pdf-generator.ts`).

**Deployment requirements**

- A **Chrome/Chromium** binary must be usable on the host running the Next.js server. Puppeteer normally downloads a compatible Chromium; on minimal Linux or custom Docker images you may need system libraries or a packaged browser.
- Optional: set **`PUPPETEER_EXECUTABLE_PATH`** to the full path of `chrome` or `chromium` if you are not using Puppeteer’s bundled browser.
- Set **`NEXT_PUBLIC_APP_URL`** in production to your public site origin (for example `https://app.example.com`) so the PDF worker can open `/pdf/report-card?...`. If unset, the handler falls back to the incoming request’s host headers.
- **Serverless** platforms often cannot run full Puppeteer + Chromium as-is. Options: run PDF generation on a Node/Docker service with Chrome installed, or use a serverless-oriented Chromium build (for example **`@sparticuz/chromium`** with **`puppeteer-core`**) and wire `executablePath` / `PUPPETEER_EXECUTABLE_PATH` accordingly.

If server-side PDF generation fails, the UI shows an error toast so you can retry or investigate (for example Puppeteer logs in development).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
