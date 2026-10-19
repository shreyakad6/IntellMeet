# OWASP ZAP Security Testing Workflow for IntellMeet

This document details the automated dynamic application security testing (DAST) procedures for identifying vulnerabilities across the IntellMeet API and web interface using OWASP ZAP (Zed Attack Proxy).

## 1. Security Baseline Focus Areas
- **Authentication & Session Management**: Validate JWT expiry, token confidentiality, Bearer header transmission, and brute-force mitigation via rate limiting.
- **Injection Attacks**: Test NoSQL injection against MongoDB schemas, XSS in chat messages, and command injection in upload filenames.
- **Cross-Origin Resource Sharing (CORS)**: Verify strict allowed origins and method permissions.
- **HTTP Security Headers**: Verify Helmet security headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`).

## 2. Running Automated Baseline Scan with Docker
Run a passive and baseline scan against the local backend server:

```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:5000 -r zap-report.html
```

## 3. Running API Scan (OpenAPI / Endpoints)
Run an active scan across specific endpoints:

```bash
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py -t http://host.docker.internal:5000 -f openapi -r zap-api-report.html
```

## 4. Remediation Measures Implemented in IntellMeet
- **Helmet.js** protection added to Express pipeline for robust HTTP header security.
- **Bcrypt hashing** (salt rounds = 10) ensures plaintext passwords are never stored or logged.
- **Mongoose strict typing & parameterized queries** protect against NoSQL injection.
- **Rate limiting middleware** restricts excessive brute-force authentication requests.
- **Centralized error handling** prevents database stack traces and internal system details from leaking to clients in production.
