# NEXUS Security Features

This document outlines the security features implemented in NEXUS to protect your authentication system and user data.

## 🔐 Authentication Security

### JWT Token Management
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 24 hours (configurable via `NEXUS_TOKEN_EXPIRY`)
- **Storage**: HTTP-only cookies (prevents XSS attacks)
- **Transmission**: Secure flag enabled (HTTPS only)
- **CSRF Protection**: Strict SameSite policy

### Session Security
- Sessions automatically expire after 24 hours
- Tokens stored in HTTP-only cookies (not accessible via JavaScript)
- Secure flag ensures transmission only over HTTPS
- SameSite=strict prevents cross-site request forgery

## 🛡️ Password Security

### Password Complexity Requirements
All passwords (user creation, password changes) must meet these requirements:

- **Length**: Minimum 12 characters
- **Uppercase**: At least one uppercase letter (A-Z)
- **Lowercase**: At least one lowercase letter (a-z)
- **Numbers**: At least one digit (0-9)
- **Special Characters**: At least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)
- **Pattern Validation**:
  - No common passwords (e.g., "password", "12345678", "admin")
  - No repeated characters (e.g., "aaa" or "111")
  - No sequential characters (e.g., "abc" or "123")

### Password Storage
- **Hashing Algorithm**: bcrypt with 12 rounds
- Passwords are never stored in plain text
- Password hashes are one-way (cannot be reversed)

## ⏱️ Rate Limiting

### Login Rate Limiting
Protection against brute-force attacks:

- **Limit**: 5 failed login attempts
- **Window**: 15 minutes
- **Scope**: Per IP address
- **Lockout**: Automatic with countdown timer
- **Reset**: Rate limit resets on successful login

### Rate Limit Response
When rate limited, users receive:
- Clear error message with retry time
- `429 Too Many Requests` HTTP status
- `retryAfter` field with seconds until reset

## 🔧 Configuration Security

### Environment Variable Validation
On startup, NEXUS validates:

- **JWT Secret Presence**: `NEXUS_JWT_SECRET` or `JWT_SECRET` must be set
- **Minimum Length**: JWT secret must be at least 32 characters
- **Production Check**: Warns if using default/development secrets in production
- **Failure Mode**: Application exits if validation fails

### Secure Defaults
- No hardcoded default secrets in production
- Secure cookie flags always enabled
- HTTPS enforcement via secure cookie flag

## 📝 Audit Logging

### Logged Events
All security-relevant events are logged:

- **LOGIN**: Successful user login
- **LOGIN_FAILED**: Failed login attempts (with reason)
- **PASSWORD_CHANGED**: User password changes
- **USER_CREATED**: New user creation by admin
- **USER_UPDATED**: User modifications
- **USER_DELETED**: User deletion
- **ACCESS_GRANTED**: Application access granted to user
- **ACCESS_REVOKED**: Application access revoked from user

### Audit Log Data
Each audit entry includes:
- User ID (who performed the action)
- Action type
- Timestamp
- IP address
- User agent
- Additional details (varies by action)

## 🚨 Security Best Practices

### For Administrators

1. **Change Default Password**
   - Default admin credentials: `admin / admin`
   - System forces password change on first login
   - New password must meet complexity requirements

2. **Secure JWT Secret**
   - Generate a strong random secret: `openssl rand -base64 32`
   - Store in `.env` file (never commit to Git)
   - Use different secrets for development and production

3. **Enable HTTPS**
   - Always use HTTPS in production
   - Secure cookies require HTTPS to function properly

4. **Regular Audit Reviews**
   - Review audit logs at `/admin/audit` regularly
   - Monitor failed login attempts
   - Investigate suspicious patterns

5. **Database Backups**
   - Regularly back up `nexus.db`
   - Store backups securely (contains password hashes and user data)
   - Test restore procedures

### For Developers Integrating with NEXUS

1. **Protect JWT Secret**
   - Use the same JWT secret in your external applications
   - Store securely in environment variables
   - Never hardcode or commit to Git

2. **Verify Tokens**
   - Always verify JWT signatures
   - Check token expiration
   - Validate user permissions (`apps` array in payload)

3. **Secure Communication**
   - Use HTTPS for all communication
   - Set cookie domain appropriately
   - Implement proper CORS policies

## 🔍 Security Checklist

Before deploying NEXUS to production:

- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Set `NEXUS_JWT_SECRET` in environment variables
- [ ] Change default admin password
- [ ] Enable HTTPS
- [ ] Review rate limiting settings
- [ ] Configure proper firewall rules
- [ ] Set up database backups
- [ ] Test password complexity validation
- [ ] Verify audit logging is working
- [ ] Review security headers (use tools like securityheaders.com)

## 🚫 Known Limitations

### Current Limitations
- **No 2FA/MFA**: Multi-factor authentication not yet implemented
- **No Password Reset**: Users cannot reset passwords without admin
- **SQLite Concurrency**: Not suitable for high-concurrency production use (100+ concurrent users)
- **In-Memory Rate Limiting**: Rate limits reset on server restart
- **No Session Revocation**: Cannot invalidate tokens before expiration

### Planned Improvements
See the main README for roadmap and planned security enhancements.

## 📞 Reporting Security Issues

If you discover a security vulnerability in NEXUS:

1. **DO NOT** open a public GitHub issue
2. Contact the maintainer directly
3. Provide detailed information about the vulnerability
4. Allow time for a fix before public disclosure

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcrypt Security](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
