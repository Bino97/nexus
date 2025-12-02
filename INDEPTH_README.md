# NEXUS

> A modern, self-hosted authentication and application management hub for internal tools and services.

NEXUS is a centralized authentication system that provides single sign-on (SSO) for your internal applications. Built with Next.js 16, it offers a beautiful dashboard, comprehensive admin controls, and easy integration with any web framework.

![NEXUS Dashboard](https://via.placeholder.com/800x400/1a1a1a/3b82f6?text=NEXUS+Dashboard)

## ⚠️ Beta Status & Deployment Considerations

**NEXUS is currently in beta and optimized for lightweight, internal deployments.**

### Ideal Use Cases

- Small to medium-sized teams (5-100 users)
- Internal company tools and admin panels
- Homelab and personal self-hosted services
- Development, testing, and staging environments
- Non-critical applications and utilities

### Technical Limitations

- **Database:** Uses SQLite for simplicity - great for small-medium deployments but not designed for high-concurrency production systems
- **Scaling:** Single-instance design without built-in clustering
- **Security:** Basic authentication with JWT - lacks advanced features like 2FA, OAuth providers, or SSO integrations
- **Monitoring:** Basic audit logging without advanced analytics or alerting

### Not Recommended For

- Mission-critical production systems requiring 99.99% uptime
- Large-scale deployments with 100+ concurrent users
- Applications handling sensitive financial, medical, or PII data
- Systems requiring compliance certifications (SOC 2, HIPAA, PCI-DSS, etc.)
- High-traffic public-facing applications

## ✨ Features

### 🎨 Modern User Experience

- **Customizable Dashboard** - Personalize your app hub with custom colors, layouts, and favorites
- **Multiple View Modes** - Grid (compact/comfortable) or list view
- **Drag-and-Drop Ordering** - Arrange apps to your preference
- **Real-time Search** - Instantly find your applications
- **Health Monitoring** - Live status indicators for all connected apps
- **Card Opacity Control** - Adjust app card transparency from 0-100%
- **Background Images** - Set custom background images for your dashboard
- **Favorite Apps** - Star frequently used apps and optionally filter to favorites-only view
- **Custom Accent Colors** - Choose from 8 preset colors to personalize your dashboard theme

### 🔐 Robust Authentication

- **JWT-based Authentication** - Secure token-based auth with `jose` library
- **Session Management** - Persistent login sessions with secure cookies
- **Password Security** - bcrypt hashing with configurable rounds
- **Force Password Change** - Require users to update default passwords

### 👥 User Management

- **Admin Portal** - Full-featured admin dashboard with dedicated overview page
- **User CRUD** - Create, read, update, and delete users
- **Access Control** - Grant/revoke app access per user
- **Access Matrix** - Visual overview of user-app permissions
- **Audit Logging** - Track all authentication and admin actions
- **Site-wide Branding** - Customize site name, tagline, logo, and primary colors across all pages

### 🚀 Multi-Framework Support

- **Next.js** - Full TypeScript integration guide
- **Express** - Node.js middleware examples
- **Flask** - Python integration
- **Go** - Native Go implementation
- Built-in documentation with interactive code examples

### 📊 Application Management

- **App Registry** - Centralized catalog of all your tools
- **Health Checks** - Automatic monitoring of app availability
- **Custom Icons** - lucide-react icons for visual identification
- **Color Coding** - Organize apps with custom accent colors
- **Sorting** - Manual or automatic app ordering

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/nexus.git
   cd nexus
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:

   ```env
   NEXUS_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Access NEXUS**

   Open [http://localhost:4000](http://localhost:4000)

   **Default credentials:**

   - Username: `admin`
   - Password: `admin` (you'll be prompted to change this on first login)

## 📖 Documentation

NEXUS includes comprehensive integration documentation built right into the admin panel. Access it at `/admin/docs` after logging in.

### Integrating Your Apps

NEXUS works with **any web framework** that supports:

- HTTP cookies
- JWT verification
- Middleware/request interceptors

#### Quick Integration (Next.js)

1. **Install dependencies**

   ```bash
   npm install jose
   ```

2. **Add environment variables**

   ```env
   NEXUS_URL=http://localhost:4000
   NEXUS_APP_SLUG=your-app-slug
   JWT_SECRET=your-shared-secret
   ```

3. **Create middleware** (`middleware.ts`)

   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import * as jose from "jose";

   export async function middleware(request: NextRequest) {
     const token = request.cookies.get("nexus_token")?.value;

     if (!token) {
       return NextResponse.redirect(
         `${process.env.NEXUS_URL}/login?app=${process.env.NEXUS_APP_SLUG}`
       );
     }

     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
     const { payload } = await jose.jwtVerify(token, secret);

     // Add user info to headers
     const requestHeaders = new Headers(request.headers);
     requestHeaders.set("x-user-id", payload.sub as string);

     return NextResponse.next({ request: { headers: requestHeaders } });
   }
   ```

See the built-in documentation for **Express**, **Flask**, and **Go** examples.

## 🗄️ Architecture

### Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** SQLite with better-sqlite3
- **Auth:** JWT tokens with jose
- **Styling:** Tailwind CSS v4
- **Icons:** lucide-react
- **Password Hashing:** bcryptjs

### Database Schema

- `users` - User accounts and credentials
- `applications` - Registered applications
- `user_app_access` - User-application permissions
- `audit_log` - Authentication and admin activity logs
- `settings` - System configuration
- `user_preferences` - Dashboard customization settings (colors, opacity, backgrounds, favorites)
- `branding` - Site-wide branding configuration (name, tagline, logo, colors)

### Security Features

- ✅ JWT token verification
- ✅ Secure password hashing (bcrypt)
- ✅ HTTP-only cookies
- ✅ CSRF protection via Next.js
- ✅ Audit logging
- ✅ Force password changes
- ✅ Session validation

## 🛠️ Configuration

### Environment Variables

| Variable           | Required | Default       | Description                               |
| ------------------ | -------- | ------------- | ----------------------------------------- |
| `NEXUS_JWT_SECRET` | Yes      | -             | Secret key for JWT signing (min 32 chars) |
| `PORT`             | No       | `4000`        | Port to run NEXUS on                      |
| `NODE_ENV`         | No       | `development` | Environment mode                          |

### Health Check Configuration

Applications can be monitored by implementing a `/api/nexus/health` endpoint:

```typescript
export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

NEXUS will ping this endpoint when users load the dashboard.

## 📊 Admin Features

### User Management

- Create/edit/delete users
- Assign admin privileges
- Manage app access per user
- View user activity logs

### Application Management

- Register new applications
- Configure app metadata (name, description, icon, color)
- Enable/disable health monitoring
- Set custom sort order

### Access Control

- Visual access matrix showing user-app permissions
- Bulk grant/revoke access
- Per-user app assignment

### Branding & Customization

- **Site Name & Tagline** - Customize the name and tagline displayed across all pages
- **Custom Logo** - Upload a logo to replace the default NEXUS branding
- **Primary Color** - Set a custom primary color for buttons and accents site-wide
- **Live Preview** - Preview how branding appears on login, password reset, unauthorized, and dashboard pages
- **Default to NEXUS** - All branding defaults to NEXUS theme out of the box

### Audit Logging

- Track all logins
- Monitor admin actions
- View access changes
- Export audit logs

## 🎨 User Customization

Users can personalize their dashboard with:

- **View Modes:** Compact grid, comfortable grid, or list view
- **Accent Colors:** Choose from 8 preset colors (Blue, Purple, Green, Orange, Pink, Red, Teal, Indigo)
- **App Ordering:** Drag and drop to reorder applications
- **Favorites:** Star frequently used apps and optionally filter to show only favorites
- **URL Visibility:** Toggle display of application URLs
- **Card Opacity:** Adjust transparency of app cards from 0-100% (0 = fully transparent, 100 = solid)
- **Background Images:** Set custom background images with URL input
- **Show Favorites Only:** Toggle to display only starred applications

All preferences are automatically saved per-user in the database and persist across sessions.

## 🚧 Roadmap

- [ ] LDAP/Active Directory integration
- [ ] Multi-factor authentication (MFA)
- [ ] Role-based access control (RBAC)
- [ ] User groups and teams
- [ ] API key management
- [ ] OAuth2 provider support
- [ ] Docker image
- [ ] Backup/restore functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📧 Support

If you encounter any issues or have questions:

- Open an [issue](https://github.com/yourusername/nexus/issues)
- Check the [documentation](http://localhost:4000/admin/docs) (when running)

---

<div align="center">
  <strong>Made with ❤️ for internal tools everywhere</strong>
</div>
