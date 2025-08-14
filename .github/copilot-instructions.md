# Job Portal - Custom Instructions for GitHub Copilot

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive Job Portal application built with Next.js, TypeScript, Tailwind CSS, and SQLite with Prisma ORM. The application features role-based access control, dynamic form builder, email notifications, and file upload capabilities.

## Architecture & Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based authentication with bcryptjs
- **File Upload**: Local file storage in /uploads directory
- **Email**: Nodemailer for SMTP email notifications
- **Forms**: React Hook Form with Zod validation

## Key Features
1. **Role-Based Access Control**: Admin, HR, Manager roles with different permissions
2. **Job Management**: Create, edit, pause, delete, and assign jobs
3. **Application Tracking**: Status management with email notifications
4. **Dynamic Form Builder**: Admin can create custom application forms
5. **Email Templates**: Dynamic templates with variable substitution
6. **File Upload**: Resume upload and storage
7. **Dashboard Widgets**: Role-specific statistics and insights

## Database Schema
- **Users**: Authentication and role management
- **Jobs**: Job postings with status and assignment
- **Applications**: Job applications with status tracking
- **FormFields**: Dynamic form configuration
- **EmailTemplates**: Customizable notification templates
- **Settings**: SMTP and system configuration

## Coding Standards
- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use Prisma for database operations
- Implement proper error handling
- Use Tailwind CSS for styling
- Follow responsive design principles
- Implement proper authentication middleware

## Security Considerations
- Validate all inputs with Zod schemas
- Use JWT tokens for authentication
- Implement role-based authorization
- Sanitize file uploads
- Use environment variables for sensitive data
