# Billify Database Architecture & Reference Manual

This document is the definitive technical manual for the **Billify** persistence tier, detailing schema models, multi-tenancy mechanics, indexing strategies, operational maintenance, and disaster recovery procedures.

---

## 1. Architectural Overview

- **Engine**: Microsoft SQL Server 2022 (Express Edition, 10 GB maximum database ceiling).
- **Multi-Tenancy Model**: Shared-schema, isolated rows partitioned by `BusinessID` (integer tenant boundary).
- **Soft-Deletion**: Enforced on transaction-sensitive tables (`Bills`, `BillItems`, `Payments`, `ReturnExchanges`, `Users`, `Shops`).
- **Data Compression**: `PAGE` compression applied to hot transactional tables (`Bills`, `BillItems`, `Payments`, `ReturnExchanges`) to maximize working-set cache efficiency and stay well below storage limits.

---

## 2. Entity-Relationship Diagram (ASCII)

```
       ┌────────────────┐
       │   Businesses   │ (Tenancy Boundary)
       └───────┬────────┘
               │ 1:N
     ┌─────────┴──────────────────────┬────────────────────────┐
     │ 1:N                            │ 1:N                    │ 1:N
┌────▼──────────┐            ┌────────▼───────┐       ┌────────▼───────┐
│     Users     │            │     Shops      │       │ShopBillSequences
└────┬──────────┘            └────┬───────────┘       └────────────────┘
     │ 1:N                        │ 1:N
     │               ┌────────────┴─────────────┐
     │               │ 1:N                      │ 1:N
┌────▼─────────────┐ │                 ┌────────▼──────────┐
│ UserShopAccesses ◄─┘                 │       Bills       │
└──────────────────┘                   └────┬──────────────┘
     │                                      │ 1:N
     ├──────────────────────┬───────────────┴───────────────┐
     │ 1:N                  │ 1:N                           │ 1:N
┌────▼────────────────┐┌────▼──────────────┐       ┌────────▼──────────┐
│  UserRefreshTokens  ││    BillItems      │       │     Payments      │
└─────────────────────┘└───────────────────┘       └───────────────────┘
     │ 1:N                                                  ▲
┌────▼────────────────┐                                     │
│ PasswordResetTokens │                            ┌────────┴──────────┐
└─────────────────────┘                            │  ReturnExchanges  │
                                                   └───────────────────┘

[Platform Realm - Separate Domain]
┌───────────────────┐ 1:N ┌─────────────────────┐
│   PlatformUsers   ├─────►  PlatformAuditLogs  │
└───────────────────┘     └─────────────────────┘
```

---

## 3. Comprehensive Table Reference

### 1. Businesses
- **Purpose**: Master tenant account records.
- **Soft-delete**: No.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | INT | NO | IDENTITY(1,1) | Primary Key (Tenant Boundary) |
| `Name` | NVARCHAR(150) | NO | | Legal entity or business name |
| `Slug` | NVARCHAR(50) | NO | | Unique lowercase URL identifier |
| `GST` | NVARCHAR(15) | YES | NULL | 15-character Indian GSTIN |
| `IsActive` | BIT | NO | 1 | If 0, immediate HTTP 403 Forbidden |
| `StrictBillingMode` | BIT | NO | 0 | If 1, negotiated total mandatory |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Tenant registration timestamp |
| `UpdatedAt` | DATETIMEOFFSET | YES | NULL | Last modification timestamp |

- **Indexes**:
  - `PK_Businesses`: Clustered on `ID`
  - `UQ_Businesses_Slug`: Unique Non-Clustered on `Slug`

---

### 2. Users
- **Purpose**: Authenticated user accounts associated with a business tenant.
- **Soft-delete**: Yes (`IsDeleted`, `DeletedAt`).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `Email` | NVARCHAR(256) | NO | | Normalized lowercase email |
| `Mobile` | NVARCHAR(20) | NO | | E.164 phone number |
| `PasswordHash` | NVARCHAR(500) | NO | | PBKDF2 with SHA-256 (100k iter) |
| `Role` | NVARCHAR(50) | NO | 'Staff' | `BusinessAdmin`, `Manager`, `Staff` |
| `IsDeleted` | BIT | NO | 0 | Soft-delete flag |
| `DeletedAt` | DATETIMEOFFSET | YES | NULL | Timestamp of deactivation |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Creation timestamp |
| `UpdatedAt` | DATETIMEOFFSET | YES | NULL | Modification timestamp |

- **Indexes**:
  - `PK_Users`: Clustered on `ID`
  - `IX_Users_BusinessID_Email`: Unique on `(BusinessID, Email)` WHERE `IsDeleted = 0`

---

### 3. Shops
- **Purpose**: Physical retail outlets or branch locations under a tenant.
- **Soft-delete**: Yes (`IsDeleted`, `DeletedAt`).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `Name` | NVARCHAR(150) | NO | | Branch name |
| `Address` | NVARCHAR(300) | NO | | Physical address |
| `Mobile` | NVARCHAR(20) | NO | | Contact phone number |
| `GST` | NVARCHAR(15) | YES | NULL | Branch-level GSTIN |
| `LogoUrl` | NVARCHAR(500) | YES | NULL | Receipt image asset URL |
| `ExchangePolicyDays`| INT | NO | 5 | Max days to accept return/exchange |
| `ReceiptFooter` | NVARCHAR(300) | YES | NULL | Custom receipt signoff text |
| `PrinterType` | NVARCHAR(50) | YES | NULL | E.g. 'Thermal', 'Laser' |
| `PrinterName` | NVARCHAR(100) | YES | NULL | Printer model or network name |
| `WhatsAppEnabled` | BIT | NO | 0 | Enables WhatsApp digital receipts |
| `NotificationEmail` | NVARCHAR(256) | YES | NULL | Store alert dispatch address |
| `NotificationSms` | BIT | NO | 0 | Send SMS notifications |
| `IsDeleted` | BIT | NO | 0 | Soft-delete flag |
| `DeletedAt` | DATETIMEOFFSET | YES | NULL | Deletion timestamp |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Branch creation date |
| `UpdatedAt` | DATETIMEOFFSET | YES | NULL | Last settings update |

- **Indexes**:
  - `PK_Shops`: Clustered on `ID`
  - `IX_Shops_BusinessID`: Non-Clustered on `BusinessID`

---

### 4. UserShopAccesses
- **Purpose**: Maps store managers and staff to assigned shop branches.
- **Soft-delete**: No.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `UserID` | UNIQUEIDENTIFIER | NO | | FK to `Users(ID)` |
| `ShopID` | UNIQUEIDENTIFIER | NO | | FK to `Shops(ID)` |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |

- **Indexes**:
  - `PK_UserShopAccesses`: Composite Clustered on `(UserID, ShopID)`
  - `IX_UserShopAccesses_ShopID`: Non-Clustered on `ShopID`

---

### 5. ShopBillSequences
- **Purpose**: Atomic per-shop sequential invoice numbering (`000001`, `000002`).
- **Soft-delete**: No.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ShopID` | UNIQUEIDENTIFIER | NO | | Primary Key, FK to `Shops(ID)` |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `LastBillNumber` | INT | NO | 0 | Incremented via atomic UPDATE OUTPUT |

- **Indexes**:
  - `PK_ShopBillSequences`: Clustered on `ShopID`

---

### 6. Bills
- **Purpose**: Transaction header recording customer, amounts, and discounts.
- **Soft-delete**: Yes (`IsDeleted`, `DeletedAt`).
- **Compression**: `PAGE`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `ShopID` | UNIQUEIDENTIFIER | NO | | FK to `Shops(ID)` |
| `BillNumber` | NVARCHAR(20) | NO | | 6-digit zero-padded number |
| `CustomerName` | NVARCHAR(150) | YES | NULL | Optional customer name |
| `CustomerPhone`| NVARCHAR(20) | YES | NULL | E.164 customer phone |
| `Subtotal` | DECIMAL(18,2) | NO | | Sum of gross line item totals |
| `Discount` | DECIMAL(18,2) | NO | 0.00 | Total discount applied |
| `Total` | DECIMAL(18,2) | NO | | Final payable invoice total |
| `NegotiatedTotal`| DECIMAL(18,2)| YES | NULL | Populated if StrictBillingMode |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Order timestamp |
| `CreatedByUserID`| UNIQUEIDENTIFIER| NO | | FK to `Users(ID)` |
| `IsDeleted` | BIT | NO | 0 | Soft-delete flag |
| `DeletedAt` | DATETIMEOFFSET | YES | NULL | Timestamp of voiding |

- **Indexes**:
  - `PK_Bills`: Clustered on `ID`
  - `IX_Bills_BusinessID_CreatedAt`: Non-Clustered on `(BusinessID, CreatedAt DESC)` INCLUDE `(ShopID, BillNumber, Total, IsDeleted)`
  - `IX_Bills_ShopID_BillNumber`: Unique on `(ShopID, BillNumber)`

---

### 7. BillItems
- **Purpose**: Individual products or services billed on an invoice.
- **Soft-delete**: Yes (`IsDeleted`, `DeletedAt`).
- **Compression**: `PAGE`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `ShopID` | UNIQUEIDENTIFIER | NO | | FK to `Shops(ID)` |
| `BillID` | UNIQUEIDENTIFIER | NO | | FK to `Bills(ID)` |
| `ItemName` | NVARCHAR(150) | NO | | Name / description of item |
| `Qty` | INT | NO | | Quantity billed (> 0) |
| `Price` | DECIMAL(18,2) | NO | | Net unit selling price |
| `DiscountPct` | DECIMAL(5,2) | NO | 0.00 | Percentage discount |
| `OriginalPrice` | DECIMAL(18,2)| NO | | Original unit catalog price |
| `DiscountAmount`| DECIMAL(18,2)| NO | 0.00 | Total line discount |
| `TaxableAmount` | DECIMAL(18,2)| YES | NULL | Value subject to GST |
| `GstRate` | DECIMAL(5,2) | NO | 0.00 | Combined GST percentage (e.g. 5, 12, 18) |
| `GstAmount` | DECIMAL(18,2)| YES | NULL | Total GST for line item |
| `LineTotal` | DECIMAL(18,2)| YES | NULL | Net line item total |
| `IsDeleted` | BIT | NO | 0 | Soft-delete flag |
| `DeletedAt` | DATETIMEOFFSET | YES | NULL | Deletion timestamp |

- **Indexes**:
  - `PK_BillItems`: Clustered on `ID`
  - `IX_BillItems_BillID`: Non-Clustered on `BillID`

---

### 8. Payments
- **Purpose**: Split and multi-tender settlement records.
- **Soft-delete**: Yes (`IsDeleted`, `DeletedAt`).
- **Compression**: `PAGE`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `ShopID` | UNIQUEIDENTIFIER | NO | | FK to `Shops(ID)` |
| `BillID` | UNIQUEIDENTIFIER | NO | | FK to `Bills(ID)` |
| `Mode` | NVARCHAR(20) | NO | | `Cash`, `UPI`, `Card` |
| `Amount` | DECIMAL(18,2) | NO | | Tendered amount |
| `IsDeleted` | BIT | NO | 0 | Soft-delete flag |
| `DeletedAt` | DATETIMEOFFSET | YES | NULL | Deletion timestamp |

- **Indexes**:
  - `PK_Payments`: Clustered on `ID`
  - `IX_Payments_BillID`: Non-Clustered on `BillID`
  - `IX_Payments_BusinessID_Mode`: Non-Clustered on `(BusinessID, Mode)` INCLUDE `(Amount)`

---

### 9. ReturnExchanges
- **Purpose**: Items returned or exchanged post-sale.
- **Soft-delete**: No (records are append-only audit entries).
- **Compression**: `PAGE`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `BusinessID` | INT | NO | | FK to `Businesses(ID)` |
| `ShopID` | UNIQUEIDENTIFIER | NO | | FK to `Shops(ID)` |
| `OriginalBillID`| UNIQUEIDENTIFIER| NO | | FK to `Bills(ID)` |
| `Type` | NVARCHAR(20) | NO | | `Return` or `Exchange` |
| `ItemName` | NVARCHAR(150) | NO | | Item returned/exchanged |
| `Qty` | INT | NO | | Quantity returned |
| `Amount` | DECIMAL(18,2) | NO | | Monetary credit or refund |
| `Reason` | NVARCHAR(300) | YES | NULL | Return reason |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Transaction timestamp |
| `CreatedByUserID`| UNIQUEIDENTIFIER| NO | | FK to `Users(ID)` |

- **Indexes**:
  - `PK_ReturnExchanges`: Clustered on `ID`
  - `IX_ReturnExchanges_OriginalBillID`: Non-Clustered on `OriginalBillID`
  - `IX_ReturnExchanges_BusinessID_CreatedAt`: Non-Clustered on `(BusinessID, CreatedAt DESC)`

---

### 10. UserRefreshTokens
- **Purpose**: Cryptographically hashed long-lived refresh tokens.
- **Retention**: Cleaned every 6 hours if expired and revoked.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `UserID` | UNIQUEIDENTIFIER | NO | | FK to `Users(ID)` |
| `TokenHash` | NVARCHAR(128) | NO | | SHA-256 hash of raw token |
| `ExpiresAt` | DATETIMEOFFSET | NO | | Expiration timestamp (30 days) |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Creation timestamp |
| `IsRevoked` | BIT | NO | 0 | 1 if logged out or rotated |
| `RevokedAt` | DATETIMEOFFSET | YES | NULL | Revocation timestamp |
| `ReplacedByID` | UNIQUEIDENTIFIER| YES | NULL | Next token ID in rotation chain |

- **Indexes**:
  - `PK_UserRefreshTokens`: Clustered on `ID`
  - `IX_UserRefreshTokens_TokenHash`: Non-Clustered on `TokenHash`

---

### 11. PasswordResetTokens
- **Purpose**: Single-use 15-minute password recovery tokens.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `UserID` | UNIQUEIDENTIFIER | NO | | FK to `Users(ID)` |
| `TokenHash` | NVARCHAR(128) | NO | | SHA-256 hash of reset secret |
| `ExpiresAt` | DATETIMEOFFSET | NO | | Expiration timestamp (15 mins) |
| `IsUsed` | BIT | NO | 0 | Set to 1 upon redemption |
| `UsedAt` | DATETIMEOFFSET | YES | NULL | Consumption timestamp |

- **Indexes**:
  - `PK_PasswordResetTokens`: Clustered on `ID`
  - `IX_PasswordResetTokens_TokenHash`: Non-Clustered on `TokenHash`

---

### 12. PlatformUsers
- **Purpose**: System operators and platform support team accounts.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `Email` | NVARCHAR(256) | NO | | Unique normalized email |
| `PasswordHash` | NVARCHAR(500) | NO | | PBKDF2 hash |
| `Role` | NVARCHAR(50) | NO | 'Support' | `SuperAdmin`, `Support`, `Billing` |
| `IsActive` | BIT | NO | 1 | Account enablement flag |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Account creation date |

- **Indexes**:
  - `PK_PlatformUsers`: Clustered on `ID`
  - `UQ_PlatformUsers_Email`: Unique Non-Clustered on `Email`

---

### 13. PlatformAuditLogs
- **Purpose**: Immutable security audit trail of platform administrator actions.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `ID` | UNIQUEIDENTIFIER | NO | | Primary Key (GUID) |
| `PlatformUserID`| UNIQUEIDENTIFIER| NO | | FK to `PlatformUsers(ID)` |
| `Action` | NVARCHAR(100) | NO | | E.g. 'SuspendBusiness' |
| `TargetTenantID`| INT | YES | NULL | Tenant affected |
| `DetailsJson` | NVARCHAR(MAX) | YES | NULL | Optional metadata |
| `IpAddress` | NVARCHAR(45) | YES | NULL | IPv4 / IPv6 of caller |
| `CreatedAt` | DATETIMEOFFSET | NO | SYSDATETIMEOFFSET() | Action timestamp |

- **Indexes**:
  - `PK_PlatformAuditLogs`: Clustered on `ID`
  - `IX_PlatformAuditLogs_CreatedAt`: Non-Clustered on `CreatedAt DESC`

---

## 4. Multi-Tenancy Invariants

1. **Root Boundary**: `BusinessID` is present on all tenant entities (`Users`, `Shops`, `Bills`, `BillItems`, `Payments`, `ReturnExchanges`, `ShopBillSequences`).
2. **JWT Filtration**: Endpoints extract `TenantID` from verified JWT claims. User-supplied tenant parameters in request bodies are forbidden.
3. **Soft-Delete Global Filters**: Deleted rows (`IsDeleted = 1`) are automatically excluded in EF Core queries.

---

## 5. Mission-Critical SQL Patterns

### A. Atomic Invoice Number Generation (Lock-Free)
```sql
UPDATE ShopBillSequences
SET LastBillNumber = LastBillNumber + 1
OUTPUT inserted.LastBillNumber
WHERE ShopID = @ShopID AND BusinessID = @BusinessID;
```

### B. High-Speed Reporting Aggregation
```sql
SELECT 
    COUNT(b.ID) AS TotalBills,
    COALESCE(SUM(b.Total), 0) AS TotalSales,
    COALESCE(SUM(b.Discount), 0) AS TotalDiscounts
FROM Bills b WITH (NOLOCK)
WHERE b.BusinessID = @TenantID
  AND b.IsDeleted = 0
  AND b.CreatedAt >= @FromDate
  AND b.CreatedAt <= @ToDate
  AND (@ShopID IS NULL OR b.ShopID = @ShopID);
```

### C. Return Quantity Validation
```sql
SELECT 
    bi.Qty AS OriginalQty,
    COALESCE(SUM(re.Qty), 0) AS AlreadyReturnedQty,
    (bi.Qty - COALESCE(SUM(re.Qty), 0)) AS RemainingReturnableQty
FROM BillItems bi WITH (NOLOCK)
LEFT JOIN ReturnExchanges re WITH (NOLOCK) 
    ON re.OriginalBillID = bi.BillID 
   AND re.ItemName = bi.ItemName
WHERE bi.BillID = @BillID 
  AND bi.ItemName = @ItemName
GROUP BY bi.Qty;
```

---

## 6. Space Budget & Capacity Planning

Assuming a busy deployment of 40 active retail shops generating 200 bills/day each:
- **Daily Invoices**: 8,000 bills/day across all tenants.
- **Daily Line Items**: ~24,000 items/day.
- **Daily Payments**: ~9,600 payments/day.
- **With PAGE Compression**:
  - `Bills`: ~120 bytes per row → ~0.96 MB/day.
  - `BillItems`: ~80 bytes per row → ~1.92 MB/day.
  - `Payments`: ~45 bytes per row → ~0.43 MB/day.
  - Total growth: ~3.5 MB/day (~1.27 GB per year).
- **Free Tier Headroom (10 GB)**: Provides over 7+ years of continuous operation before reaching capacity limits.

---

## 7. Backup & Disaster Recovery

- **MonsterASP.NET Daily Backups**: Automated nightly snapshot backups retained for 14 rolling days.
- **Manual Cold Backup Command**:
```sql
BACKUP DATABASE BillifyDb
TO DISK = 'D:\Backups\BillifyDb_Manual.bak'
WITH FORMAT, MEDIANAME = 'BillifyBackup', NAME = 'Full Backup of BillifyDb';
```
- **Point-in-Time Restore**:
```sql
ALTER DATABASE BillifyDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE BillifyDb FROM DISK = 'D:\Backups\BillifyDb_Manual.bak' WITH REPLACE;
ALTER DATABASE BillifyDb SET MULTI_USER;
```

---

## 8. Deployment Procedure
1. Provision SQL Server database via MonsterASP.NET control panel.
2. Store connection string securely in production environment variables (`ConnectionStrings__Default`).
3. Execute `sql/init.sql` (or `dotnet ef database update`).
4. Validate `__EFMigrationsHistory` confirms all migrations up to Phase 5.
5. Deploy application binary package and verify `GET /health` reports `"status": "Healthy", "db": true`.
