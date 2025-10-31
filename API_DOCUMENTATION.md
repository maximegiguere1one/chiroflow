# ChiroFlow SaaS API Documentation

## Overview

ChiroFlow provides a comprehensive REST API for integrating with external systems. All API requests require authentication via API keys and are scoped to your organization.

## Base URL

```
Production: https://api.chiroflow.app/v1
Staging: https://staging-api.chiroflow.app/v1
```

## Authentication

All API requests must include an API key in the `Authorization` header:

```http
Authorization: Bearer cf_your_api_key_here
```

API keys can be generated from the Organization Settings page.

## Rate Limiting

- Default: 1000 requests per hour per API key
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

## Endpoints

### Organizations

#### Get Current Organization

```http
GET /organizations/current
```

Returns information about the organization associated with the API key.

**Response:**
```json
{
  "id": "uuid",
  "name": "Acme Chiropractic",
  "slug": "acme-chiropractic",
  "subscription_tier": "professional",
  "subscription_status": "active",
  "features_enabled": {
    "appointments": true,
    "billing": true,
    "analytics": true
  }
}
```

### Patients

#### List Patients

```http
GET /patients?page=1&limit=50
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)
- `status` (optional): Filter by status (active, inactive, archived)
- `search` (optional): Search by name, email, or phone

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "total_pages": 3
  }
}
```

#### Get Patient

```http
GET /patients/:id
```

**Response:**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St",
  "medical_history": "...",
  "status": "active",
  "total_visits": 15,
  "last_visit": "2024-01-15T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Create Patient

```http
POST /patients
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "gender": "male"
}
```

**Response:** `201 Created`

#### Update Patient

```http
PATCH /patients/:id
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "+9876543210"
}
```

**Response:** `200 OK`

### Appointments

#### List Appointments

```http
GET /appointments?start_date=2024-01-01&end_date=2024-01-31
```

**Query Parameters:**
- `start_date` (required): ISO date string
- `end_date` (required): ISO date string
- `status` (optional): Filter by status
- `patient_id` (optional): Filter by patient

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "duration_minutes": 30,
      "status": "confirmed",
      "reason": "Regular adjustment",
      "notes": "Patient reports improvement"
    }
  ]
}
```

#### Create Appointment

```http
POST /appointments
Content-Type: application/json

{
  "patient_id": "uuid",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "duration_minutes": 30,
  "reason": "Regular adjustment",
  "notes": "Follow-up visit"
}
```

**Response:** `201 Created`

#### Update Appointment

```http
PATCH /appointments/:id
Content-Type: application/json

{
  "status": "completed",
  "notes": "Treatment completed successfully"
}
```

**Response:** `200 OK`

### Invoices

#### List Invoices

```http
GET /invoices?status=paid&patient_id=uuid
```

**Query Parameters:**
- `status` (optional): Filter by status (draft, sent, paid, overdue, cancelled)
- `patient_id` (optional): Filter by patient

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-001",
      "patient_id": "uuid",
      "amount": 100.00,
      "tax": 13.00,
      "total": 113.00,
      "status": "paid",
      "due_date": "2024-02-01",
      "paid_date": "2024-01-25"
    }
  ]
}
```

#### Create Invoice

```http
POST /invoices
Content-Type: application/json

{
  "patient_id": "uuid",
  "amount": 100.00,
  "tax": 13.00,
  "due_date": "2024-02-01",
  "notes": "Adjustment session"
}
```

**Response:** `201 Created`

### Webhooks

ChiroFlow can send webhook notifications for important events:

#### Available Events

- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `patient.created`
- `patient.updated`
- `invoice.paid`
- `invoice.overdue`

#### Webhook Payload

```json
{
  "event": "appointment.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "scheduled_at": "2024-01-20T10:00:00Z"
  },
  "organization_id": "uuid"
}
```

#### Webhook Signature

All webhook requests include a signature in the `X-ChiroFlow-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The patient_id field is required",
    "details": {
      "field": "patient_id"
    }
  }
}
```

### Error Codes

- `AUTHENTICATION_FAILED`: Invalid or expired API key
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `INVALID_REQUEST`: Malformed request or missing required fields
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install @chiroflow/sdk`
- **Python**: `pip install chiroflow`
- **Ruby**: `gem install chiroflow`
- **PHP**: `composer require chiroflow/sdk`

### Example Usage (JavaScript)

```javascript
import { ChiroFlow } from '@chiroflow/sdk';

const client = new ChiroFlow({
  apiKey: 'cf_your_api_key_here'
});

// List patients
const patients = await client.patients.list({
  status: 'active',
  limit: 50
});

// Create appointment
const appointment = await client.appointments.create({
  patient_id: 'patient-uuid',
  scheduled_at: new Date('2024-01-20T10:00:00Z'),
  duration_minutes: 30,
  reason: 'Regular adjustment'
});
```

## Support

- **Documentation**: https://docs.chiroflow.app
- **API Status**: https://status.chiroflow.app
- **Support Email**: api-support@chiroflow.app
- **Developer Forum**: https://community.chiroflow.app
