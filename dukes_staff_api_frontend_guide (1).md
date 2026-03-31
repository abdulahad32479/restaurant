# Duke's POS — Staff, Attendance, Payroll & Biometric API Guide for Frontend

This document explains the **Staff app API** for frontend integration.

It covers:

- authentication
- branch behavior
- list endpoints
- create/update endpoints
- payroll actions
- biometric sync flow
- filters
- pagination
- choices/enums
- important implementation notes

---

# 1. Authentication

All endpoints require JWT access token.

Use this header on requests:

```http
Authorization: Bearer <access_token>
```

For local testing from Swagger or browser, you may also see CSRF headers, but for normal frontend API calls with JWT, the main requirement is the `Authorization` header.

---

# 2. Base URL

All staff endpoints are under:

```http
/api/staff/
```

Examples:

```http
GET /api/staff/members/
POST /api/staff/payroll/generate/
POST /api/staff/biometric/sync-device/
```

---

# 3. Branch behavior

The backend is **branch-scoped**.

That means the following are **automatically taken from the logged-in user** and should usually **not** be sent from frontend:

- `branch` on staff members
- `branch` on attendance devices
- `branch` on staff ledger entries

## Important frontend rule
Do **not** send `branch` for endpoints where backend auto-fills it.

---

# 4. Pagination

These list endpoints are paginated:

- `GET /api/staff/members/`
- `GET /api/staff/devices/`
- `GET /api/staff/punches/`
- `GET /api/staff/attendance/`
- `GET /api/staff/ledger/`
- `GET /api/staff/payroll/`
- `GET /api/staff/payroll-lines/`

## Query params

```http
?page=1&page_size=20
```

- `page` = page number
- `page_size` = records per page
- default page size = `20`
- max page size = `100`

## Paginated response shape

```json
{
  "count": 125,
  "next": "http://127.0.0.1:8000/api/staff/members/?page=2",
  "previous": null,
  "results": []
}
```

Frontend should read actual data from `results`.

---

# 5. Choices / enums used in API

## Staff employment_status
- `active`
- `inactive`
- `terminated`

## Staff salary_type
- `monthly`
- `daily`

## AttendanceDevice device_type
- `biometric`
- `manual`

## BiometricPunch punch_type
- `in`
- `out`
- `unknown`

## BiometricPunch source
- `device`
- `import`
- `manual`

## StaffAttendance status
- `present`
- `absent`
- `leave`
- `half_day`

## StaffAttendance source
- `manual`
- `biometric`

## StaffLedgerEntry entry_type
- `advance`
- `late_penalty`
- `meal_deduction`
- `deduction`
- `bonus`
- `reimbursement`
- `adjustment`
- `salary_payment`

## StaffLedgerEntry direction
- `debit`
- `credit`

## PayrollRun status
- `draft`
- `finalized`
- `paid`

---

# 6. Endpoint groups

The app is split into these groups:

1. Staff roles
2. Staff members
3. Attendance devices
4. Biometric punches
5. Attendance records
6. Salary ledger
7. Payroll runs
8. Payroll lines
9. Payroll action endpoints
10. Biometric action endpoints

---

# 7. Staff Roles

## 7.1 List roles

```http
GET /api/staff/roles/
```

### Purpose
Load roles for dropdowns and role setup screens.

### Response
Array of roles.

---

## 7.2 Create role

```http
POST /api/staff/roles/
```

### Example body

```json
{
  "name": "cashier",
  "description": "Handles billing and payments",
  "is_active": true
}
```

### Purpose
Create roles like:
- waiter
- cashier
- manager
- kitchen staff
- delivery rider

---

## 7.3 Retrieve role

```http
GET /api/staff/roles/{id}/
```

---

## 7.4 Update role

```http
PATCH /api/staff/roles/{id}/
```

---

# 8. Staff Members

## 8.1 List staff members

```http
GET /api/staff/members/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `role` | UUID | Filter by role |
| `employment_status` | string | `active`, `inactive`, `terminated` |
| `is_active` | bool | `true` / `false` |
| `search` | string | Search by `full_name`, `employee_code`, `phone`, `biometric_code` |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/members/?employment_status=active&is_active=true&search=ahmad&page=1&page_size=20
```

### Purpose
Used for:
- staff listing screen
- payroll staff selection
- attendance staff selection
- ledger entry staff selection

---

## 8.2 Create staff member

```http
POST /api/staff/members/
```

### Important notes
- `branch` is auto-filled from logged-in user
- `role` must be a valid StaffRole UUID
- `biometric_code` should match the employee ID in biometric machine

### Example body

```json
{
  "user": null,
  "employee_code": "EMP-001",
  "full_name": "Ahmad Khan",
  "phone": "03001234567",
  "address": "Gujranwala",
  "role": "ROLE_UUID_HERE",
  "joining_date": "2026-03-01",
  "employment_status": "active",
  "salary_type": "monthly",
  "base_salary": "30000.00",
  "default_late_penalty": "200.00",
  "default_meal_deduction": "150.00",
  "biometric_code": "12",
  "is_delivery_staff": false,
  "is_kitchen_staff": true,
  "is_cashier": false,
  "is_manager": false,
  "is_active": true
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `user` | UUID/null | no | Optional linked login user |
| `employee_code` | string | yes | Must be unique |
| `full_name` | string | yes | Staff full name |
| `phone` | string | no | Contact number |
| `address` | string | no | Address |
| `role` | UUID | yes | StaffRole UUID |
| `joining_date` | date | yes | `YYYY-MM-DD` |
| `employment_status` | string | yes | `active`, `inactive`, `terminated` |
| `salary_type` | string | yes | `monthly`, `daily` |
| `base_salary` | decimal | yes | Base salary |
| `default_late_penalty` | decimal | no | Default late penalty |
| `default_meal_deduction` | decimal | no | Default meal deduction |
| `biometric_code` | string | no | Must match K70 employee ID |
| `is_delivery_staff` | bool | no | Delivery staff flag |
| `is_kitchen_staff` | bool | no | Kitchen staff flag |
| `is_cashier` | bool | no | Cashier flag |
| `is_manager` | bool | no | Manager flag |
| `is_active` | bool | no | Active flag |

---

## 8.3 Retrieve one staff member

```http
GET /api/staff/members/{id}/
```

---

## 8.4 Update staff member

```http
PATCH /api/staff/members/{id}/
```

### Example partial update

```json
{
  "phone": "03111222333",
  "base_salary": "32000.00",
  "is_kitchen_staff": false,
  "is_cashier": true
}
```

---

# 9. Attendance Devices

## 9.1 List devices

```http
GET /api/staff/devices/
```

### Pagination
Supports `page` and `page_size`.

---

## 9.2 Create device

```http
POST /api/staff/devices/
```

### Purpose
Create attendance device configuration.

### Example body

```json
{
  "name": "Main K70",
  "device_type": "biometric",
  "ip_address": "192.168.1.150",
  "port": 4370,
  "machine_identifier": "K70_FRONT",
  "api_url": null,
  "is_active": true
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Friendly device name |
| `device_type` | string | yes | `biometric` or `manual` |
| `ip_address` | string | no | Device LAN IP |
| `port` | int | no | Usually `4370` for ZKTeco |
| `machine_identifier` | string | no | Optional custom identifier |
| `api_url` | string/null | no | Optional if cloud/API based |
| `is_active` | bool | no | Device active flag |

### Important note for K70
For ZKTeco K70 usually:
- `device_type = biometric`
- `port = 4370`

---

## 9.3 Retrieve / update device

```http
GET /api/staff/devices/{id}/
PATCH /api/staff/devices/{id}/
```

---

# 10. Biometric Punches

## 10.1 List punches

```http
GET /api/staff/punches/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `staff` | UUID | Filter by staff |
| `biometric_code` | string | Filter by biometric employee code |
| `date` | date | Exact date `YYYY-MM-DD` |
| `is_processed` | bool | `true` / `false` |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/punches/?date=2026-03-29&is_processed=false&page=1&page_size=20
```

### Purpose
Read-only endpoint used for:
- troubleshooting sync
- audit
- verifying punches before attendance processing

### Important fields in response
- `biometric_code`
- `punch_time`
- `staff`
- `staff_name`
- `device`
- `device_name`
- `is_processed`
- `raw_payload`

---

## 10.2 Retrieve one punch

```http
GET /api/staff/punches/{id}/
```

---

# 11. Staff Attendance

## 11.1 List attendance

```http
GET /api/staff/attendance/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `staff` | UUID | Filter by staff |
| `status` | string | `present`, `absent`, `leave`, `half_day` |
| `source` | string | `manual`, `biometric` |
| `date` | date | Exact date |
| `start_date` | date | Date range start |
| `end_date` | date | Date range end |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/attendance/?staff=STAFF_UUID&start_date=2026-03-01&end_date=2026-03-31
```

---

## 11.2 Create manual attendance

```http
POST /api/staff/attendance/
```

### Purpose
Use for:
- manual correction
- leave marking
- absence entry
- fallback if biometric is unavailable

### Example body

```json
{
  "staff": "STAFF_UUID_HERE",
  "date": "2026-03-29",
  "check_in": "2026-03-29T09:05:00+05:00",
  "check_out": "2026-03-29T18:00:00+05:00",
  "late_minutes": 5,
  "early_leave_minutes": 0,
  "status": "present",
  "source": "manual",
  "note": "Manual correction"
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `staff` | UUID | yes | StaffMember UUID |
| `date` | date | yes | `YYYY-MM-DD` |
| `check_in` | datetime | no | Optional |
| `check_out` | datetime | no | Optional |
| `late_minutes` | int | no | Default `0` |
| `early_leave_minutes` | int | no | Default `0` |
| `status` | string | yes | `present`, `absent`, `leave`, `half_day` |
| `source` | string | yes | `manual` or `biometric` |
| `note` | string | no | Optional note |

---

## 11.3 Update attendance

```http
PATCH /api/staff/attendance/{id}/
```

---

# 12. Staff Ledger

This is the most important payroll adjustment table.

## 12.1 List ledger entries

```http
GET /api/staff/ledger/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `staff` | UUID | Filter by staff |
| `entry_type` | string | See choices below |
| `direction` | string | `debit`, `credit` |
| `start_date` | date | Entry date range start |
| `end_date` | date | Entry date range end |
| `payroll_year` | int | Payroll reference year |
| `payroll_month` | int | Payroll reference month |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/ledger/?staff=STAFF_UUID&entry_type=advance&start_date=2026-03-01&end_date=2026-03-31
```

---

## 12.2 Create ledger entry

```http
POST /api/staff/ledger/
```

### Core rules
- `debit` reduces payable salary
- `credit` increases payable salary

### Common combinations

| Use case | entry_type | direction |
|---|---|---|
| Advance | `advance` | `debit` |
| Late penalty | `late_penalty` | `debit` |
| Meal deduction | `meal_deduction` | `debit` |
| Other deduction | `deduction` | `debit` |
| Bonus | `bonus` | `credit` |
| Reimbursement | `reimbursement` | `credit` |
| Manual adjustment | `adjustment` | `debit` or `credit` |
| Salary payment audit | `salary_payment` | auto-created by backend |

### Example: advance

```json
{
  "staff": "STAFF_UUID_HERE",
  "entry_date": "2026-03-29",
  "entry_type": "advance",
  "direction": "debit",
  "amount": "5000.00",
  "note": "Advance before Eid",
  "payroll_period_year": 2026,
  "payroll_period_month": 3,
  "is_active": true
}
```

### Example: meal deduction

```json
{
  "staff": "STAFF_UUID_HERE",
  "entry_date": "2026-03-29",
  "entry_type": "meal_deduction",
  "direction": "debit",
  "amount": "300.00",
  "note": "2 meals",
  "payroll_period_year": 2026,
  "payroll_period_month": 3,
  "is_active": true
}
```

### Example: bonus

```json
{
  "staff": "STAFF_UUID_HERE",
  "entry_date": "2026-03-29",
  "entry_type": "bonus",
  "direction": "credit",
  "amount": "1000.00",
  "note": "Performance bonus",
  "payroll_period_year": 2026,
  "payroll_period_month": 3,
  "is_active": true
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `staff` | UUID | yes | StaffMember UUID |
| `entry_date` | date | yes | `YYYY-MM-DD` |
| `entry_type` | string | yes | See choices above |
| `direction` | string | yes | `debit` or `credit` |
| `amount` | decimal | yes | Amount |
| `note` | string | no | Optional explanation |
| `payroll_period_year` | int | no | Optional payroll reference |
| `payroll_period_month` | int | no | Optional payroll reference |
| `is_active` | bool | no | Soft active flag |

### Important backend behavior
`branch`, `created_by`, and `updated_by` are auto-filled by backend.

---

## 12.3 Update ledger entry

```http
PATCH /api/staff/ledger/{id}/
```

---

# 13. Payroll Runs

## 13.1 List payroll runs

```http
GET /api/staff/payroll/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `year` | int | Filter by year |
| `month` | int | Filter by month |
| `status` | string | `draft`, `finalized`, `paid` |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/payroll/?year=2026&month=3&status=finalized
```

### Purpose
Used for payroll history screen.

---

## 13.2 Retrieve one payroll run

```http
GET /api/staff/payroll/{id}/
```

### Purpose
Returns a payroll run with nested `lines`.

Useful for payroll detail screen.

---

# 14. Payroll Lines

## 14.1 List payroll lines

```http
GET /api/staff/payroll-lines/
```

### Filters

| Param | Type | Description |
|---|---|---|
| `payroll_run` | UUID | Filter by payroll run |
| `staff` | UUID | Filter by staff |
| `is_paid` | bool | `true` / `false` |
| `page` | int | Pagination |
| `page_size` | int | Pagination |

### Example

```http
GET /api/staff/payroll-lines/?payroll_run=PAYROLL_UUID&is_paid=false
```

### Purpose
Used for:
- payroll tables
- unpaid salary screens
- salary disbursement screen

---

## 14.2 Retrieve one payroll line

```http
GET /api/staff/payroll-lines/{id}/
```

---

# 15. Payroll Action Endpoints

These are custom endpoints, not router CRUD endpoints.

## 15.1 Generate payroll

```http
POST /api/staff/payroll/generate/
```

### Purpose
Creates or regenerates a **draft payroll** for a selected month.

### What backend does
1. Finds all active staff in current branch
2. Reads their ledger entries for the selected month
3. Reads attendance summary for that month
4. Creates or regenerates payroll lines

### Body

```json
{
  "year": 2026,
  "month": 3
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `year` | int | yes | Example: `2026` |
| `month` | int | yes | `1` to `12` |

### Example usage
Generate March 2026 payroll.

### Important note
If the payroll run is already not in `draft`, backend may block regeneration.

---

## 15.2 Finalize payroll

```http
POST /api/staff/payroll/{id}/finalize/
```

### Purpose
Locks a draft payroll into finalized state.

### What backend does
- changes payroll run status from `draft` to `finalized`
- stops normal regeneration flow

### Path param
- `{id}` = PayrollRun UUID

### Request body
No body required.

---

## 15.3 Mark payroll line paid

```http
POST /api/staff/payroll-line/{id}/mark-paid/
```

### Purpose
Marks one staff salary line as paid.

### What backend does
- sets line as paid
- stores paid amount and note
- stores paid timestamp
- auto-creates `salary_payment` ledger entry for audit

### Path param
- `{id}` = PayrollLine UUID

### Body

```json
{
  "paid_amount": "25500.00",
  "note": "Paid in cash"
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `paid_amount` | decimal | no | If omitted, backend uses `net_salary` |
| `note` | string | no | Optional payment note |

---

# 16. Biometric Action Endpoints

These endpoints are for K70 sync workflow.

## Important deployment note
These endpoints should be called only from a backend/server/PC that is on the **same local network** as the biometric device.

They should **not** be expected to work from Railway/cloud directly unless device/network is exposed appropriately.

---

## 16.1 Sync biometric device

```http
POST /api/staff/biometric/sync-device/
```

### Purpose
Pull raw punch logs from one device and save them into `BiometricPunch`.

### What backend does
1. Finds selected device
2. Connects to it by IP and port
3. Pulls punch logs
4. Saves new logs
5. Skips already saved logs

### Body

```json
{
  "device_id": "DEVICE_UUID_HERE"
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `device_id` | UUID | yes | AttendanceDevice UUID |

### Example response

```json
{
  "device_id": "2af1d9f0-1111-2222-3333-abcdef123456",
  "device_name": "Main K70",
  "created_count": 38,
  "existing_count": 120,
  "unmatched_count": 2,
  "last_synced_at": "2026-03-29T16:10:22Z"
}
```

### Response field meaning

| Field | Meaning |
|---|---|
| `created_count` | Newly inserted punches |
| `existing_count` | Already existed and skipped |
| `unmatched_count` | Punches saved but no `StaffMember` matched by `biometric_code` |

### Very important rule
`StaffMember.biometric_code` must match employee ID in K70.

---

## 16.2 Process biometric attendance

```http
POST /api/staff/biometric/process-attendance/
```

### Purpose
Convert raw punches into daily attendance.

### What backend does
1. Reads all punches for target date
2. Groups punches by employee
3. Uses first punch as `check_in`
4. Uses last punch as `check_out`
5. Creates or updates `StaffAttendance`
6. Marks punches as processed

### Body

```json
{
  "target_date": "2026-03-29"
}
```

### Field notes

| Field | Type | Required | Notes |
|---|---|---|---|
| `target_date` | date | yes | `YYYY-MM-DD` |

---

# 17. Recommended frontend workflow

## Daily attendance workflow
1. Create or maintain staff records
2. Ensure each staff member has correct `biometric_code`
3. Create K70 device record once
4. Use:
   - `POST /api/staff/biometric/sync-device/`
   - then `POST /api/staff/biometric/process-attendance/`
5. Show results in attendance screen

## Payroll workflow
1. Add ledger entries throughout month:
   - advances
   - meal deductions
   - penalties
   - bonuses
2. Generate payroll at month end
3. Review payroll run
4. Finalize payroll
5. Mark payroll lines paid

---

# 18. Important frontend rules

## Rule 1
Do not send `branch` where backend auto-fills it.

## Rule 2
For list endpoints, always read data from `results`.

## Rule 3
Use exact enum values from this document. Do not invent custom values.

## Rule 4
For ledger:
- `debit` reduces salary
- `credit` increases salary

## Rule 5
For biometric sync:
- device must be reachable from backend machine
- biometric codes must match staff records

---

# 19. Known router/custom endpoint note

Custom action endpoints were intentionally separated from normal router endpoints to avoid conflicts such as:

- `/payroll/generate/`
- `/payroll/{id}/finalize/`
- `/payroll-line/{id}/mark-paid/`

Frontend should use these exact paths and methods.

---

# 20. Quick endpoint summary

## Roles
- `GET /api/staff/roles/`
- `POST /api/staff/roles/`
- `GET /api/staff/roles/{id}/`
- `PATCH /api/staff/roles/{id}/`

## Members
- `GET /api/staff/members/`
- `POST /api/staff/members/`
- `GET /api/staff/members/{id}/`
- `PATCH /api/staff/members/{id}/`

## Devices
- `GET /api/staff/devices/`
- `POST /api/staff/devices/`
- `GET /api/staff/devices/{id}/`
- `PATCH /api/staff/devices/{id}/`

## Punches
- `GET /api/staff/punches/`
- `GET /api/staff/punches/{id}/`

## Attendance
- `GET /api/staff/attendance/`
- `POST /api/staff/attendance/`
- `GET /api/staff/attendance/{id}/`
- `PATCH /api/staff/attendance/{id}/`

## Ledger
- `GET /api/staff/ledger/`
- `POST /api/staff/ledger/`
- `GET /api/staff/ledger/{id}/`
- `PATCH /api/staff/ledger/{id}/`

## Payroll
- `GET /api/staff/payroll/`
- `GET /api/staff/payroll/{id}/`
- `GET /api/staff/payroll-lines/`
- `GET /api/staff/payroll-lines/{id}/`

## Payroll actions
- `POST /api/staff/payroll/generate/`
- `POST /api/staff/payroll/{id}/finalize/`
- `POST /api/staff/payroll-line/{id}/mark-paid/`

## Biometric actions
- `POST /api/staff/biometric/sync-device/`
- `POST /api/staff/biometric/process-attendance/`

---

# 21. Backend / infrastructure note

Production deployment currently has a separate Railway database configuration issue where the app is trying to connect to PostgreSQL at `127.0.0.1:5432` with missing database credentials. That must be fixed before production login and production API usage will work reliably. fileciteturn0file0

---

# 22. Final note for frontend developer

If Swagger shows enum values, descriptions, and examples, follow Swagger as the source of truth for field-level behavior. This document is the high-level integration guide, while Swagger is the live contract.
