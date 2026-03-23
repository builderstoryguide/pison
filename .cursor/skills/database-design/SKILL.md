---
name: database-design
description: Design and implement secure, normalized database schemas for the microfinance system with proper constraints, indexes, and migration strategies. Use when designing database tables, writing migrations, adding constraints or indexes, or optimizing queries.
---

# Database Design

## Quick start

- Prefer PostgreSQL for ACID compliance and integrity features.
- Use `DECIMAL(19,4)` for all monetary values.
- Use `UUID` for primary keys and `TIMESTAMP WITH TIME ZONE` for dates.
- Enforce data integrity with constraints and foreign keys.
- Add indexes on foreign keys and frequently queried fields.
- Use database transactions for financial operations.
- Implement audit logging and soft deletes for financial records.

## Workflow

1. Confirm scope: schema design, migrations, or query optimization.
2. Apply normalized schema patterns for core entities.
3. Add constraints, enums, and indexes.
4. Provide migration `up`/`down` steps.
5. Validate integrity and performance with checks.

## Required standards

- Never use `FLOAT` or `DOUBLE` for money.
- Enforce positive amounts and precision with `CHECK` constraints.
- Maintain audit logs for all critical operations.
- Avoid hard deletes for financial records.
- Use parameterized queries to prevent SQL injection.

## Examples of use

- "Design a loans table with constraints and indexes"
- "Create a migration for the commissions table"
- "Optimize transaction queries for reporting"

## Additional resources

- Full schema, migrations, and query examples: [reference.md](reference.md)
