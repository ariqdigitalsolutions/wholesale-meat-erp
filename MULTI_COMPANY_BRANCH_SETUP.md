# AriQ Digital ERP — Multi-Company & Multi-Branch

This package adds the database and server-side foundation for multiple isolated companies and multiple branches per company.

## Structure
- One `erp_companies` record = one client company.
- One company can have unlimited `erp_branches`.
- Every ERP user has a `company_id` and a current `branch_id`.
- `erp_user_branches` records the branches a user is permitted to access.
- `erp_state` is scoped by `company_id + branch_id`, preventing branch data from being mixed.
- Company and branch access is protected with RLS.

## Admin model
Each client company has its own Admin account. An Admin can manage users and branches only inside that company. A user's branch can be changed only through the trusted server API.

## Database
Run `database_migration_v12_multicompany_multibranch.sql` after the existing v11 authentication migration. Do not put the Supabase service-role key in browser code.

## Server endpoint
`POST /api/branches` supports:
- `create` — create a branch for the Admin's company
- `update` — update a branch
- `switchUserBranch` — assign a company user to another branch

`GET /api/branches` lists the current user's company's branches.

## Application requirement
The frontend should store the authenticated user's `companyId` and `branchId` and scope its ERP state key as `companyId:branchId:main`. Sales, stock, purchases, dispatch, cashup and branch-level accounting must use the current branch state. Cross-branch stock transfers should be recorded in both source and destination branches.
