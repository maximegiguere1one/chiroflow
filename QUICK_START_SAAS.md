# ChiroFlow SaaS - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+
- Supabase account
- Docker (optional)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run Database Migrations
Execute these migrations in your Supabase SQL Editor (in order):
1. `supabase/migrations/create_saas_multi_tenant_foundation.sql`
2. `supabase/migrations/add_organization_id_to_existing_tables.sql`
3. `supabase/migrations/create_api_keys_and_rbac_system.sql`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
- Main App: http://localhost:5173
- Admin Signup: http://localhost:5173/admin/signup
- Onboarding: Will redirect automatically after signup

## 📋 First-Time Setup Checklist

### As Platform Admin
1. ✅ Sign up at `/admin/signup`
2. ✅ Complete onboarding flow
3. ✅ Create your organization
4. ✅ Invite team members
5. ✅ Choose subscription plan (starts with trial)

### Accessing Features
- **Dashboard**: `/admin/dashboard`
- **Organization Settings**: `/admin/organization/settings`
- **Platform Admin** (super-admin): `/saas/admin`

## 🏢 Multi-Tenant Architecture

### How It Works
Each organization is completely isolated:
- Separate data via `organization_id`
- Row-Level Security enforces isolation
- No cross-organization data access

### Creating a New Organization
```typescript
import { OrganizationService } from './lib/saas/organizationService';

const org = await OrganizationService.createOrganization({
  name: 'My Clinic',
  slug: 'my-clinic',
  email: 'contact@clinic.com',
  phone: '+1234567890'
});
```

### Getting Current Organization
```typescript
const org = await OrganizationService.getCurrentOrganization();
console.log(org.name, org.subscription_tier);
```

## 👥 Team Management

### Inviting Members
```typescript
await OrganizationService.inviteMember(
  organizationId,
  'user@example.com',
  'practitioner' // or 'admin', 'staff', 'billing'
);
```

### Roles & Permissions
- **Owner**: Full access, can delete organization
- **Admin**: Manage team, settings, all features
- **Practitioner**: Patient care, appointments, SOAP notes
- **Staff**: Scheduling, basic patient info
- **Billing**: Invoicing, payments, financial reports

## 🔑 API Keys

### Generate API Key
1. Go to Organization Settings → API Keys tab
2. Click "Generate New Key"
3. Copy the key (shown only once!)
4. Use in API requests:

```bash
curl https://api.chiroflow.app/v1/patients \
  -H "Authorization: Bearer cf_your_api_key_here"
```

### Using in Code
```typescript
import { APIKeyService } from './lib/saas/apiKeyService';

const { apiKey, plainKey } = await APIKeyService.createAPIKey(
  organizationId,
  'Integration Key',
  ['read', 'write'],
  365 // expires in 365 days
);
```

## 💳 Subscription Plans

### Available Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Price/month** | $29 | $79 | $199 |
| **Users** | 2 | 10 | Unlimited |
| **Patients** | 100 | 1,000 | Unlimited |
| **Appointments/month** | 200 | 2,000 | Unlimited |
| **API Access** | ❌ | ❌ | ✅ |
| **Analytics** | Basic | Advanced | Advanced |
| **Support** | Email | Email + Chat | Priority |

### Check Feature Access
```typescript
const hasAPI = await OrganizationService.checkFeatureAccess(
  organizationId,
  'api_access'
);

if (hasAPI) {
  // Show API settings
}
```

## 📊 Usage Tracking

### Track Usage
```typescript
// Automatically tracked when you create resources
await OrganizationService.trackUsage(
  organizationId,
  'appointments_created',
  1
);
```

### Get Usage Metrics
```typescript
const metrics = await OrganizationService.getUsageMetrics(
  organizationId,
  startDate,
  endDate
);

metrics.forEach(m => {
  console.log(`${m.metric_name}: ${m.metric_value}`);
});
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production Build
```bash
docker build -t chiroflow:latest .
docker run -p 3000:80 chiroflow:latest
```

### Kubernetes
```bash
kubectl apply -f k8s-deployment.yml
```

## 🔒 Security Best Practices

### Row-Level Security (RLS)
- ✅ Enabled on all tables
- ✅ Automatically filters by organization
- ✅ No manual filtering needed

### API Key Management
- ✅ Hashed with SHA-256
- ✅ Never stored in plaintext
- ✅ Revocable instantly
- ✅ Rate limited

### Audit Logging
All sensitive operations are logged:
```typescript
// Automatically logged
await supabase.from('appointments').insert({...});

// Check logs
const logs = await supabase
  .from('audit_logs')
  .select('*')
  .eq('organization_id', orgId);
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Type Check
```bash
npm run typecheck
```

## 📈 Monitoring

### Performance Monitoring
```typescript
import { PerformanceMonitor } from './lib/monitoring/PerformanceMonitor';

// Measure operation
const end = PerformanceMonitor.startMeasure('load-patients');
await loadPatients();
end();

// Get metrics
const metrics = PerformanceMonitor.getMetrics('load-patients');
console.log(`Average: ${metrics.avg}ms`);
```

### Error Tracking
```typescript
import { ErrorTracker } from './lib/monitoring/ErrorTracker';

try {
  await riskyOperation();
} catch (error) {
  ErrorTracker.captureException(error, {
    context: 'user-action',
    userId: user.id
  });
}
```

## 🔧 Common Tasks

### Add a New Table to Multi-Tenant System
```sql
-- 1. Create table
CREATE TABLE my_new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  -- your columns here
  created_at timestamptz DEFAULT now()
);

-- 2. Create index
CREATE INDEX idx_my_new_table_org ON my_new_table(organization_id);

-- 3. Enable RLS
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Organization members can view"
  ON my_new_table FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### Check Subscription Status
```typescript
const subscription = await OrganizationService.getCurrentSubscription(orgId);

if (subscription.status === 'past_due') {
  // Show payment reminder
} else if (subscription.status === 'trialing') {
  const daysLeft = calculateDaysLeft(subscription.trial_end);
  // Show trial expiration notice
}
```

### Upgrade Organization Plan
```typescript
// In Organization Settings → Billing tab
// User clicks "Upgrade Plan"
// Redirect to Stripe Checkout (to be implemented)
```

## 🆘 Troubleshooting

### Issue: Can't see other organization's data
✅ **This is correct behavior!** Multi-tenancy ensures complete data isolation.

### Issue: API key not working
- Check if key is active
- Verify it hasn't expired
- Ensure correct format: `Bearer cf_...`

### Issue: Permission denied
- Check user's role in organization
- Verify RLS policies are enabled
- Confirm organization membership is active

### Issue: Build fails
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 📚 Additional Resources

- **Full API Docs**: See `API_DOCUMENTATION.md`
- **Implementation Details**: See `SAAS_IMPLEMENTATION_COMPLETE.md`
- **Architecture**: See `README.md`
- **Migrations**: See `supabase/migrations/`

## 🎯 Next Steps

1. ✅ Complete onboarding
2. ✅ Invite your team
3. ✅ Import patient data
4. ✅ Configure clinic settings
5. ✅ Set up integrations (if Enterprise)
6. ✅ Launch to your staff!

## 💡 Pro Tips

- Use keyboard shortcuts (Ctrl+K for search)
- Bulk operations save time
- Set up email templates early
- Enable automated reminders
- Review analytics weekly
- Monitor usage to avoid quota limits

---

**Need Help?** Check the full documentation or contact support.
