# Security Implementation Guide

## Overview

This document describes the comprehensive security measures implemented in the Gold Inventory System backend.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Authorization](#authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [CSRF Protection](#csrf-protection)
5. [Rate Limiting & Brute Force Protection](#rate-limiting--brute-force-protection)
6. [Data Encryption](#data-encryption)
7. [Audit Logging](#audit-logging)
8. [File Upload Security](#file-upload-security)
9. [Security Headers](#security-headers)
10. [Environment Security](#environment-security)
11. [API Key Authentication](#api-key-authentication)

---

## Authentication Security

### JWT Token Security

- **Access Tokens**: Short-lived (15 minutes) for reduced exposure
- **Refresh Tokens**: Stored in httpOnly cookies to prevent XSS
- **Token Rotation**: Refresh tokens are rotated on each use
- **Token Blacklisting**: Revoked tokens are blacklisted until expiration

### Password Requirements

| Requirement | Value |
|------------|-------|
| Minimum Length | 8 characters |
| Maximum Length | 128 characters |
| Uppercase | Required |
| Lowercase | Required |
| Numbers | Required |
| Special Characters | Required (!@#$%^&*()_+-=[]{}|;:,.<>?) |
| Common Passwords | Blocked |

### Two-Factor Authentication (Optional)

- TOTP-based (Google Authenticator compatible)
- Backup codes for account recovery
- Can be enforced for admin users

### Session Management

- Maximum 5 concurrent sessions per user
- Sessions invalidated on password change
- Idle timeout: 30 minutes
- Absolute timeout: 24 hours

---

## Authorization

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| ADMIN | Full system access |
| MANAGER | Orders, factory, reports |
| WORKER | Assigned orders only |
| VIEWER | Read-only access |

### Endpoint Protection

```typescript
// Protected route example
router.get('/users', 
  authenticate,           // Verify JWT
  authorize('ADMIN'),     // Check role
  controller.getUsers
);
```

---

## Input Validation & Sanitization

### Zod Schema Validation

All API inputs are validated using Zod schemas:

```typescript
// Example: Order creation
const createOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  dueDate: z.coerce.date(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  items: z.array(orderItemSchema).min(1),
});
```

### XSS Prevention

- HTML tags stripped from inputs
- Special characters encoded
- Whitelist for allowed HTML (b, i, em, strong)

### SQL Injection Prevention

- Prisma ORM with parameterized queries
- Pattern detection for SQL injection attempts
- Request blocked if injection detected

### NoSQL Injection Prevention

- MongoDB operators ($gt, $where, etc.) blocked in inputs
- Object key validation

---

## CSRF Protection

### Implementation

- CSRF tokens generated per session
- Tokens rotated after each use
- Validation on all state-changing requests (POST, PUT, PATCH, DELETE)

### Usage

```http
# Token provided in response header and cookie
X-CSRF-Token: abc123...

# Send token back in request header
POST /api/orders HTTP/1.1
X-CSRF-Token: abc123...
```

### Excluded Paths

- `/api/webhooks` (external integrations)
- `/health` (health checks)

---

## Rate Limiting & Brute Force Protection

### Rate Limits

| Endpoint Type | Window | Max Requests |
|--------------|--------|--------------|
| Global | 15 min | 1000 |
| API | 1 min | 100 |
| Authentication | 15 min | 20 |
| Upload | 1 hour | 20 |
| Strict (sensitive) | 1 hour | 5 |

### Brute Force Protection

- **Max Attempts**: 5 failed logins
- **Lockout Duration**: 15 minutes
- **Tracking**: By IP and email
- **Progressive Delays**: 0s, 1s, 2s, 4s, 8s

### Unlock Account

Administrators can manually unlock accounts:

```bash
# Via API
POST /api/admin/unlock-account
{ "identifier": "user@example.com", "type": "email" }
```

---

## Data Encryption

### Algorithm

- **Cipher**: AES-256-GCM
- **Key Derivation**: scrypt
- **IV**: Random 16 bytes per encryption

### Encrypted Fields

| Model | Fields |
|-------|--------|
| orders | customerName, customerPhone, customerAddress |
| users | phoneNumber |

### Usage

```typescript
import { encrypt, decrypt } from './utils/encryption';

// Encrypt sensitive data before storage
const encrypted = encrypt(customerName);

// Decrypt when needed
const decrypted = decrypt(encrypted);
```

### Searchable Encrypted Data

Use deterministic hashing for searchability:

```typescript
import { createSearchHash } from './utils/encryption';

// Create searchable hash
const hash = createSearchHash(customerName);
// Store hash alongside encrypted data for search
```

---

## Audit Logging

### Logged Events

| Category | Events |
|----------|--------|
| Authentication | Login, logout, password change, 2FA |
| Authorization | Access granted/denied |
| Data Operations | Create, update, delete |
| File Operations | Upload, download, delete |
| Security | Brute force, CSRF violation, injection attempt |

### Log Entry Format

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "action": "UPDATE",
  "resource": "ORDER",
  "resourceId": "order_123",
  "userId": "user_456",
  "userEmail": "user@example.com",
  "ipAddress": "192.168.1.1",
  "changes": {
    "before": { "status": "PENDING" },
    "after": { "status": "IN_PROGRESS" },
    "fields": ["status"]
  }
}
```

### Sensitive Data Masking

Fields containing `password`, `token`, `secret`, `key` are automatically redacted.

### Storage Options

- **Database**: PostgreSQL AuditLog table
- **File**: JSON lines format with rotation
- **Both**: Dual storage for redundancy

### Retention

Default: 90 days (configurable via `AUDIT_LOG_RETENTION_DAYS`)

---

## File Upload Security

### Validation Layers

1. **Extension Check**: Whitelist of allowed extensions
2. **MIME Type Check**: Whitelist of allowed MIME types
3. **Magic Number Check**: File signature validation
4. **Image Dimensions**: Max 4096x4096, Min 10x10
5. **Malware Scan**: ClamAV integration (optional)

### Allowed File Types

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX

### File Size Limit

10MB (configurable via `MAX_FILE_SIZE`)

### Filename Handling

- Sanitized to remove dangerous characters
- Optional: Randomly generated names
- Path traversal prevention

---

## Security Headers

### Helmet Configuration

| Header | Value |
|--------|-------|
| Content-Security-Policy | Restricted to self, inline styles |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |

### CORS Configuration

```typescript
{
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400
}
```

---

## Environment Security

### Secret Generation

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 32
```

### Environment Files

| Environment | File | Purpose |
|-------------|------|---------|
| Development | .env.development | Local testing |
| Staging | .env.staging | Pre-production |
| Production | .env.production | Live system |

### Required Secrets

| Variable | Description | Rotation |
|----------|-------------|----------|
| JWT_SECRET | Access token signing | 90 days |
| JWT_REFRESH_SECRET | Refresh token signing | 90 days |
| ENCRYPTION_KEY | Data encryption | 180 days |
| CSRF_SECRET | CSRF token signing | 90 days |

### Secrets Management

For production, use:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

---

## API Key Authentication

### For External Integrations

```http
GET /api/orders HTTP/1.1
X-API-Key: gis_abc123...
```

### Key Format

- Prefix: `gis_`
- Body: 32 random hex characters
- Total: 36 characters

### Key Management

- Keys are hashed before storage
- Scopes limit access (read, write, admin, reports)
- IP whitelist per key (optional)
- Expiration date (optional)

---

## Error Handling

### Production Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "statusCode": 400
  }
}
```

### Internal Error Masking

Internal errors (database, redis, etc.) are masked in production:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred. Please try again later.",
    "statusCode": 500
  }
}
```

---

## Security Checklist

### Before Production

- [ ] Generate strong, unique secrets
- [ ] Configure CORS allowlist
- [ ] Enable CSRF protection
- [ ] Enable brute force protection
- [ ] Configure rate limiting
- [ ] Enable data encryption
- [ ] Enable audit logging
- [ ] Configure file upload limits
- [ ] Set up HTTPS/TLS
- [ ] Remove debug endpoints
- [ ] Disable stack traces in errors
- [ ] Set up monitoring and alerting

### Regular Maintenance

- [ ] Rotate secrets (every 90 days)
- [ ] Review audit logs
- [ ] Update dependencies
- [ ] Security vulnerability scanning
- [ ] Penetration testing (annually)
- [ ] Review access permissions
- [ ] Clean up inactive accounts

---

## Incident Response

### Security Event Detection

Monitor for:
- Multiple failed login attempts
- Unusual API patterns
- SQL/XSS injection attempts
- Unauthorized access attempts
- Unusual data exports

### Response Steps

1. **Detect**: Automated monitoring and logging
2. **Contain**: Disable compromised accounts/keys
3. **Investigate**: Review audit logs
4. **Remediate**: Fix vulnerability, rotate secrets
5. **Report**: Document incident and response

---

## Contact

For security concerns or to report vulnerabilities:
- Email: security@example.com
- Response time: 24 hours
