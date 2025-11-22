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
