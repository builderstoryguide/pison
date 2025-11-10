# Bursar Report Generation Permissions

## Overview

By default, bursars are **not permitted** to generate reports until an admin explicitly grants them the `generate_reports` permission. This ensures that report generation is controlled and only authorized personnel can access sensitive financial data.

## Default Bursar Permissions

When a new bursar account is created, they receive the following permissions by default:

- `manage_finances` - Manage financial operations
- `track_payments` - Track payment records
- `send_fee_notices` - Send fee notices to parents/students
- `view_financial_records` - View financial records

**Note:** `generate_reports` is **NOT** included in default permissions.

## Granting Report Generation Permission

To grant a bursar the ability to generate reports, an admin must:

1. Go to the User Management section
2. Find the bursar user
3. Edit their permissions
4. Add the `generate_reports` permission to their account

## Protected Endpoints

The following API endpoints now require the `generate_reports` permission:

- `GET /api/bursar/reports/collection` - Collection reports
- `GET /api/bursar/reports/outstanding` - Outstanding fees reports  
- `GET /api/bursar/reports/revenue` - Revenue reports
- `POST /api/financial-reports` - PDF report generation

## Error Response

When a bursar without the `generate_reports` permission attempts to access these endpoints, they will receive:

```json
{
  "error": "Insufficient permissions",
  "message": "This action requires the 'generate_reports' permission. Please contact an administrator to grant you access.",
  "requiredPermission": "generate_reports"
}
```

## Implementation Details

- Permission validation is handled by the `validatePermission` utility function in `lib/permission-utils.ts`
- The system checks the user's permissions array for either `'all'` or the specific required permission
- All report generation endpoints now include permission checks at the beginning of their handlers

## Security Benefits

1. **Controlled Access**: Only authorized personnel can generate reports
2. **Audit Trail**: Admins can track who has report generation permissions
3. **Granular Control**: Permissions can be granted/revoked on a per-user basis
4. **Default Security**: New bursar accounts start with minimal permissions

## Admin Actions

Admins can:
- Grant `generate_reports` permission to specific bursars
- Revoke `generate_reports` permission from bursars
- View all available permissions for each role
- Update user permissions through the access rights management system
