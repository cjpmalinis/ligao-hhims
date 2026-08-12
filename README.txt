LIGAO CITY CENTRALIZED HHIMS - V10
CLEAN RESET + RERUNNABLE SUPABASE INSTALLER

WHY V10
You received:
ERROR: 42710: type "app_role" already exists

That happened because an earlier setup script partially ran and created some database objects.

V10 fixes that by:
- cleaning the previous HHIMS schema;
- dropping old HHIMS triggers/functions/tables/type safely;
- recreating everything;
- using DROP IF EXISTS / CREATE IF NOT EXISTS where appropriate;
- dropping old RLS policies before recreating them;
- rebuilding profiles for Auth users that already exist.

IMPORTANT
The V10 installer resets HHIMS DATA.

It deletes:
- public.households
- public.household_members
- public.profiles

It does NOT delete accounts from:
Supabase -> Authentication -> Users

USE THIS ONLY WHILE THE SYSTEM IS STILL TEST/EMPTY.

STEP-BY-STEP

STEP 1
Open your Supabase project.

STEP 2
Click:
SQL Editor

STEP 3
Click:
New query

STEP 4
Open:
supabase_setup.sql

Copy ALL the SQL.

STEP 5
Paste it into Supabase SQL Editor.

STEP 6
Click:
Run

You should get:
Success. No rows returned
or another successful completion message.

STEP 7 - CREATE ADMIN ACCOUNT
Go to:
Authentication -> Users

Create your email/password account if it does not exist.

STEP 8
Return to SQL Editor and run:

update public.profiles
set role='admin'
where email='YOUR-EMAIL@example.com';

Replace YOUR-EMAIL@example.com with your actual Admin email.

STEP 9
Verify:

select id,email,full_name,role,is_active
from public.profiles
order by created_at;

Your account should show:
role = admin

NORMAL USERS
Create additional accounts under Authentication -> Users.

Their profiles automatically become:
role = user
is_active = true

Both ADMIN and USER can:
- encode all 55 barangays;
- view all 55 barangays;
- search household records;
- add household members;
- update records.

ADMIN additionally has database permission to:
- delete households;
- delete members;
- manage user profile roles/status.

ONE HOUSEHOLD HEAD RULE
The database has a unique partial index so each Household ID can have only ONE Household Head.

MULTIPLE FAMILIES
Use:
family_number = 1, 2, 3, etc.

Every non-head person records:
relationship_to_head

Example:
HOUSEHOLD HEAD: JUAN DELA CRUZ

Family 1:
MARIA DELA CRUZ - WIFE
PEDRO DELA CRUZ - SON

Family 2:
ANA SANTOS - DAUGHTER
JOSE SANTOS - SON-IN-LAW
MAY SANTOS - GRANDDAUGHTER

Family 3:
LUCIA REYES - DAUGHTER
MARIO REYES - SON-IN-LAW

Still only ONE Household Head.

CONFIGURE WEBSITE
After database setup succeeds, edit:
config.js

Insert your:
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY

Never use the service_role key in config.js.

FILES INCLUDED
- index.html
- styles.css
- app.js
- config.js
- supabase_setup.sql
- RESET_HHIMS_ONLY.sql
- README.txt


V11 CHANGES
- Edit Household and Household Head
- Edit household members
- Admin-only Delete Household
- Admin-only Delete Member
- Export Excel (.xlsx): Master Household Data + Household Heads sheet
- Import Excel (.xlsx) using Household ID and Family Number
- Both Admin and User can edit.
- Delete remains Admin-only by design.

NOTE: Excel uses the SheetJS browser library, so Excel import/export requires internet access when opening the website unless you later bundle the library locally.
