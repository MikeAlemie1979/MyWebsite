/* ============================================================================
   MAWebsiteDB.sql
   ----------------------------------------------------------------------------
   PURPOSE
       Relational database schema for the "Mike Alemie / Pristinenoire LLC"
       website (Next.js application under Deployment/app).

       The schema covers:
         - Admin authentication (credentials + server-side sessions)
         - Landing page "ash text" sentences and their typography settings
         - Landing page cards (with image + ordered bullet points)
         - Projects & Prices entries (with image + ordered bullet points)
         - About page content and its flashcards
         - Public contact-form submissions
         - Uploaded media assets (images)
         - SMTP configuration
         - Social media (Instagram / Facebook) configuration + post log

   TARGET DIALECT
       Microsoft SQL Server (T-SQL, SQL Server 2016+).
       Uses NVARCHAR, IDENTITY, GETUTCDATE(), DATETIME2, THROW, and
       CREATE OR ALTER PROCEDURE (2016 SP1+).

   MIGRATION NOTE
       The application TODAY persists everything in flat JSON files on disk
       (".env.*.json" in the app root) plus binary uploads under
       "public/uploads/**". Nothing reads this database yet. This schema is the
       MIGRATION TARGET: each table below is annotated with the JSON file and
       the TypeScript interface it replaces, so the data-access layer can be
       swapped from `fs.readFileSync`/`fs.writeFileSync` to SQL without
       changing the API contract exposed by the route handlers.

   SECURITY NOTE
       No plaintext passwords are stored. AdminUser.PasswordHash mirrors the
       existing scheme in src/lib/admin-auth.ts: a single string of the form
       "salt:hash", both hex-encoded, produced by Node's crypto.scryptSync
       with a 16-byte salt and a 64-byte derived key.
       SMTP passwords and social access tokens are secrets too: they are stored
       here for parity with the current JSON files, but production deployments
       should keep them in a secrets vault and store only a reference.

   SECTIONS
       1. DATABASE CREATION
       2. DDL - TABLES, CONSTRAINTS, INDEXES
       3. TRANSACTIONS - STORED PROCEDURES FOR THE MAIN WRITE PATHS
       4. OPTIONAL SEED / REFERENCE DATA
   ============================================================================ */


/* ============================================================================
   SECTION 1 - DATABASE CREATION
   ============================================================================ */

IF DB_ID(N'MAWebsiteDB') IS NULL
BEGIN
    PRINT N'Creating database MAWebsiteDB...';
    CREATE DATABASE MAWebsiteDB;
END
ELSE
BEGIN
    PRINT N'Database MAWebsiteDB already exists - skipping CREATE DATABASE.';
END
GO

USE MAWebsiteDB;
GO

SET NOCOUNT ON;
GO


/* ============================================================================
   SECTION 2 - DDL: TABLES, CONSTRAINTS, INDEXES
   ----------------------------------------------------------------------------
   Every content table carries CreatedAt / UpdatedAt (UTC).
   All DDL is guarded by existence checks so the script is re-runnable.
   ============================================================================ */


/* ----------------------------------------------------------------------------
   MediaAsset
   Maps to: uploaded image files written by the three upload routes
            src/app/api/admin/cards/upload/route.ts      -> /uploads/cards/*
            src/app/api/admin/projects/upload/route.ts   -> /uploads/projects/*
            src/app/api/admin/about-content/upload/route.ts -> /uploads/about/*
   In the JSON world there is no registry at all: the route returns a public
   URL string ("/uploads/cards/<timestamp>-<safeName>") which is then embedded
   as `imageUrl` inside .env.cards.json / .env.projects.json /
   .env.about-content.json. This table becomes that missing registry so an
   image can be reused, audited and garbage-collected.
   Defined first because Card / Project / AboutFlashcard reference it.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.MediaAsset', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.MediaAsset
    (
        MediaAssetId     INT             IDENTITY(1,1) NOT NULL,
        -- Public URL exactly as returned by the upload route, e.g. "/uploads/cards/1786391132545-hero.png"
        Url              NVARCHAR(500)   NOT NULL,
        -- Physical file name on disk ("<timestamp>-<sanitizedOriginalName>")
        FileName         NVARCHAR(255)   NOT NULL,
        OriginalFileName NVARCHAR(255)   NULL,
        -- Logical bucket, matching the upload route that produced it
        Category         NVARCHAR(30)    NOT NULL CONSTRAINT DF_MediaAsset_Category DEFAULT (N'cards'),
        MimeType         NVARCHAR(100)   NOT NULL,
        -- Upload routes cap this at 2 MB (2 * 1024 * 1024)
        SizeBytes        INT             NOT NULL,
        WidthPx          INT             NULL,
        HeightPx         INT             NULL,
        AltText          NVARCHAR(300)   NULL,
        UploadedByUserId INT             NULL,
        CreatedAt        DATETIME2(3)    NOT NULL CONSTRAINT DF_MediaAsset_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt        DATETIME2(3)    NOT NULL CONSTRAINT DF_MediaAsset_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_MediaAsset PRIMARY KEY CLUSTERED (MediaAssetId),
        CONSTRAINT UQ_MediaAsset_Url UNIQUE (Url),
        CONSTRAINT CK_MediaAsset_Category
            CHECK (Category IN (N'cards', N'projects', N'about', N'social', N'other')),
        CONSTRAINT CK_MediaAsset_MimeType
            CHECK (MimeType IN (N'image/jpeg', N'image/jpg', N'image/png', N'image/webp')),
        CONSTRAINT CK_MediaAsset_SizeBytes
            CHECK (SizeBytes > 0 AND SizeBytes <= 2097152),
        CONSTRAINT CK_MediaAsset_Dimensions
            CHECK ((WidthPx IS NULL OR WidthPx > 0) AND (HeightPx IS NULL OR HeightPx > 0))
    );

    CREATE INDEX IX_MediaAsset_Category_CreatedAt
        ON dbo.MediaAsset (Category, CreatedAt DESC);
    CREATE INDEX IX_MediaAsset_UploadedByUserId
        ON dbo.MediaAsset (UploadedByUserId) WHERE UploadedByUserId IS NOT NULL;
END
GO


/* ----------------------------------------------------------------------------
   AdminUser
   Maps to: .env.admin-auth.json  (interface AdminCredentials in
            src/lib/admin-auth.ts -> { username, passwordHash })
   The JSON file holds exactly ONE object; this table generalises it to N rows
   so a second administrator can be added without a schema change.
   PasswordHash keeps the existing "salt:hash" scrypt format verbatim.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.AdminUser', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdminUser
    (
        AdminUserId     INT             IDENTITY(1,1) NOT NULL,
        Username        NVARCHAR(100)   NOT NULL,
        -- scrypt "salt:hash", both hex. 32 hex salt chars + ':' + 128 hex key chars = 161.
        -- NEVER store a plaintext password in this column.
        PasswordHash    NVARCHAR(300)   NOT NULL,
        DisplayName     NVARCHAR(150)   NULL,
        Email           NVARCHAR(320)   NULL,
        IsActive        BIT             NOT NULL CONSTRAINT DF_AdminUser_IsActive DEFAULT (1),
        -- Mirrors the per-IP brute-force guard in api/admin/login/route.ts,
        -- promoted from in-memory Map to durable storage.
        FailedLoginCount INT            NOT NULL CONSTRAINT DF_AdminUser_FailedLoginCount DEFAULT (0),
        LockedUntil     DATETIME2(3)    NULL,
        LastLoginAt     DATETIME2(3)    NULL,
        CreatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_AdminUser_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_AdminUser_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AdminUser PRIMARY KEY CLUSTERED (AdminUserId),
        CONSTRAINT UQ_AdminUser_Username UNIQUE (Username),
        CONSTRAINT CK_AdminUser_Username_NotEmpty CHECK (LEN(LTRIM(RTRIM(Username))) > 0),
        -- Enforce the "salt:hash" shape and, defensively, a minimum length no
        -- plaintext password would plausibly reach.
        CONSTRAINT CK_AdminUser_PasswordHash_Format
            CHECK (CHARINDEX(N':', PasswordHash) > 1 AND LEN(PasswordHash) >= 64),
        CONSTRAINT CK_AdminUser_FailedLoginCount CHECK (FailedLoginCount >= 0)
    );

    CREATE UNIQUE INDEX UX_AdminUser_Email
        ON dbo.AdminUser (Email) WHERE Email IS NOT NULL;
END
GO

-- Deferred FK: MediaAsset.UploadedByUserId -> AdminUser.
-- ON DELETE SET NULL: removing an admin must not destroy uploaded imagery.
IF OBJECT_ID(N'dbo.FK_MediaAsset_AdminUser', N'F') IS NULL
BEGIN
    ALTER TABLE dbo.MediaAsset WITH CHECK
        ADD CONSTRAINT FK_MediaAsset_AdminUser
            FOREIGN KEY (UploadedByUserId) REFERENCES dbo.AdminUser (AdminUserId)
            ON DELETE SET NULL;
END
GO


/* ----------------------------------------------------------------------------
   AdminSession
   Maps to: .env.admin-sessions.json  (interface AdminSession in
            src/lib/admin-auth.ts -> { token, createdAt } as a JSON array)
   The JSON store has no user linkage (there is only one user) and prunes
   expired rows on every read. Here the TTL (24 h, SESSION_TTL_MS) is
   materialised as ExpiresAt so expiry is a simple indexed predicate.
   The token value is the 32-byte hex string from createSessionToken() and is
   what the httpOnly "admin_session" cookie carries.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.AdminSession', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdminSession
    (
        AdminSessionId  BIGINT          IDENTITY(1,1) NOT NULL,
        AdminUserId     INT             NOT NULL,
        -- crypto.randomBytes(32).toString("hex") -> exactly 64 hex characters
        Token           NVARCHAR(128)   NOT NULL,
        IpAddress       NVARCHAR(45)    NULL,   -- IPv6-safe length
        UserAgent       NVARCHAR(400)   NULL,
        ExpiresAt       DATETIME2(3)    NOT NULL,
        RevokedAt       DATETIME2(3)    NULL,
        CreatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_AdminSession_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_AdminSession_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AdminSession PRIMARY KEY CLUSTERED (AdminSessionId),
        CONSTRAINT UQ_AdminSession_Token UNIQUE (Token),
        CONSTRAINT CK_AdminSession_Token_Length CHECK (LEN(Token) >= 32),
        CONSTRAINT CK_AdminSession_ExpiresAt CHECK (ExpiresAt > CreatedAt),
        -- Deleting an admin must kill their sessions immediately.
        CONSTRAINT FK_AdminSession_AdminUser
            FOREIGN KEY (AdminUserId) REFERENCES dbo.AdminUser (AdminUserId)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_AdminSession_AdminUserId ON dbo.AdminSession (AdminUserId);
    -- Primary validation lookup: token still live?
    CREATE INDEX IX_AdminSession_ExpiresAt   ON dbo.AdminSession (ExpiresAt) INCLUDE (Token, RevokedAt);
END
GO


/* ----------------------------------------------------------------------------
   HomeTextSettings
   Maps to: the scalar half of .env.home-text.json
            (interface HomeTextConfig in api/admin/home-text/route.ts ->
             fontFamily, fontSize, textColor, letterSpacing)
   Singleton table (SettingsId is pinned to 1 by a CHECK) because the JSON file
   holds one config object for the whole ash-text section.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.HomeTextSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HomeTextSettings
    (
        SettingsId      TINYINT         NOT NULL CONSTRAINT DF_HomeTextSettings_Id DEFAULT (1),
        FontFamily      NVARCHAR(100)   NOT NULL CONSTRAINT DF_HomeTextSettings_FontFamily DEFAULT (N'Michroma'),
        FontSize        INT             NOT NULL CONSTRAINT DF_HomeTextSettings_FontSize  DEFAULT (42),
        TextColor       NVARCHAR(9)     NOT NULL CONSTRAINT DF_HomeTextSettings_TextColor DEFAULT (N'#000000'),
        -- JSON stores this as a plain number (1); DECIMAL preserves fractional px/em values.
        LetterSpacing   DECIMAL(6,2)    NOT NULL CONSTRAINT DF_HomeTextSettings_LetterSpacing DEFAULT (1),
        CreatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_HomeTextSettings_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_HomeTextSettings_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_HomeTextSettings PRIMARY KEY CLUSTERED (SettingsId),
        CONSTRAINT CK_HomeTextSettings_Singleton CHECK (SettingsId = 1),
        CONSTRAINT CK_HomeTextSettings_FontSize  CHECK (FontSize BETWEEN 1 AND 400),
        CONSTRAINT CK_HomeTextSettings_TextColor CHECK (TextColor LIKE N'#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]%')
    );
END
GO


/* ----------------------------------------------------------------------------
   HomeTextSentence
   Maps to: .env.home-text.json -> sentences[]
            (interface HomeTextSentence -> { id, text })
   The JSON array's POSITION is the display order (the GSAP ash-text scroll
   animation plays them in array order, and the cube reveal keys off the last
   sentence "MEHRDAD MIKE ALEMIE."), so an explicit DisplayOrder column is
   required to preserve it. LegacyId keeps the original JSON string id ("1".."8")
   for a lossless migration and for client round-tripping.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.HomeTextSentence', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HomeTextSentence
    (
        HomeTextSentenceId  INT             IDENTITY(1,1) NOT NULL,
        LegacyId            NVARCHAR(50)    NULL,   -- JSON "id" e.g. "1".."8"
        [Text]              NVARCHAR(1000)  NOT NULL,
        DisplayOrder        INT             NOT NULL,
        IsActive            BIT             NOT NULL CONSTRAINT DF_HomeTextSentence_IsActive DEFAULT (1),
        CreatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_HomeTextSentence_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_HomeTextSentence_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_HomeTextSentence PRIMARY KEY CLUSTERED (HomeTextSentenceId),
        CONSTRAINT UQ_HomeTextSentence_DisplayOrder UNIQUE (DisplayOrder),
        CONSTRAINT CK_HomeTextSentence_Text_NotEmpty CHECK (LEN(LTRIM(RTRIM([Text]))) > 0),
        CONSTRAINT CK_HomeTextSentence_DisplayOrder  CHECK (DisplayOrder >= 0)
    );

    CREATE INDEX IX_HomeTextSentence_DisplayOrder
        ON dbo.HomeTextSentence (DisplayOrder) INCLUDE ([Text], IsActive);
END
GO


/* ----------------------------------------------------------------------------
   Card
   Maps to: .env.cards.json -> cards[]
            (interface CardItem in api/admin/cards/route.ts ->
             { id, title, description, imageUrl })
   Rendered by src/components/landing/cards-section.tsx.
   ADDITIONS beyond today's JSON shape (the admin panel is being extended):
     - DisplayOrder: the JSON relies on array position only.
     - MediaAssetId: normalised replacement for the raw `imageUrl` string.
       ImageUrl is retained as a nullable passthrough so legacy JSON values
       (and externally hosted images) still migrate cleanly.
     - Bullet points live in dbo.CardBulletPoint.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.Card', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Card
    (
        CardId          INT             IDENTITY(1,1) NOT NULL,
        LegacyId        NVARCHAR(50)    NULL,           -- JSON "id" e.g. "c1".."c4"
        Title           NVARCHAR(200)   NOT NULL,
        [Description]   NVARCHAR(MAX)   NOT NULL CONSTRAINT DF_Card_Description DEFAULT (N''),
        -- Raw URL as stored in JSON today; kept in sync with MediaAsset.Url when linked.
        ImageUrl        NVARCHAR(500)   NULL,
        MediaAssetId    INT             NULL,
        DisplayOrder    INT             NOT NULL CONSTRAINT DF_Card_DisplayOrder DEFAULT (0),
        IsActive        BIT             NOT NULL CONSTRAINT DF_Card_IsActive DEFAULT (1),
        CreatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_Card_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_Card_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Card PRIMARY KEY CLUSTERED (CardId),
        CONSTRAINT CK_Card_Title_NotEmpty  CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
        CONSTRAINT CK_Card_DisplayOrder    CHECK (DisplayOrder >= 0),
        -- Detaching an image must not delete the card.
        CONSTRAINT FK_Card_MediaAsset
            FOREIGN KEY (MediaAssetId) REFERENCES dbo.MediaAsset (MediaAssetId)
            ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX UX_Card_LegacyId ON dbo.Card (LegacyId) WHERE LegacyId IS NOT NULL;
    CREATE INDEX IX_Card_DisplayOrder    ON dbo.Card (DisplayOrder) INCLUDE (Title, IsActive);
    CREATE INDEX IX_Card_MediaAssetId    ON dbo.Card (MediaAssetId) WHERE MediaAssetId IS NOT NULL;
END
GO


/* ----------------------------------------------------------------------------
   CardBulletPoint
   Maps to: NOTHING in the current JSON - this is NEW.
   .env.cards.json has no bullet-point field; the requirement states the admin
   is being extended to add ordered bullet points per card. Modelled as a child
   table so the list is ordered and unbounded.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CardBulletPoint', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CardBulletPoint
    (
        CardBulletPointId   INT             IDENTITY(1,1) NOT NULL,
        CardId              INT             NOT NULL,
        [Text]              NVARCHAR(500)   NOT NULL,
        DisplayOrder        INT             NOT NULL,
        CreatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_CardBulletPoint_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_CardBulletPoint_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_CardBulletPoint PRIMARY KEY CLUSTERED (CardBulletPointId),
        CONSTRAINT UQ_CardBulletPoint_Card_Order UNIQUE (CardId, DisplayOrder),
        CONSTRAINT CK_CardBulletPoint_Text_NotEmpty CHECK (LEN(LTRIM(RTRIM([Text]))) > 0),
        CONSTRAINT CK_CardBulletPoint_DisplayOrder  CHECK (DisplayOrder >= 0),
        -- Bullets are owned by the card and have no meaning without it.
        CONSTRAINT FK_CardBulletPoint_Card
            FOREIGN KEY (CardId) REFERENCES dbo.Card (CardId)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_CardBulletPoint_CardId_Order ON dbo.CardBulletPoint (CardId, DisplayOrder);
END
GO


/* ----------------------------------------------------------------------------
   Project
   Maps to: .env.projects.json -> projects[]
            (interface ProjectItem in api/admin/projects/route.ts ->
             { id, title, briefInfo, approxPrice, imageUrl, order })
   Rendered on the Projects & Prices page.
   NOTE: the POST handler currently hard-rejects anything other than EXACTLY 7
   projects. That is an API-layer rule, not a data rule, so it is deliberately
   NOT encoded as a constraint here - the DB stays flexible.
   ApproxPrice is stored as NVARCHAR because the JSON value is a free-text
   string ("$—", "$1,500+"), not a number.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.Project', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Project
    (
        ProjectId       INT             IDENTITY(1,1) NOT NULL,
        LegacyId        NVARCHAR(50)    NULL,           -- JSON "id" e.g. "p1".."p7"
        Title           NVARCHAR(200)   NOT NULL,
        BriefInfo       NVARCHAR(MAX)   NOT NULL CONSTRAINT DF_Project_BriefInfo DEFAULT (N''),
        -- Free-text display price, e.g. "$—". Optional numeric mirror below for sorting/reporting.
        ApproxPrice     NVARCHAR(50)    NOT NULL CONSTRAINT DF_Project_ApproxPrice DEFAULT (N'$—'),
        ApproxPriceAmount DECIMAL(12,2) NULL,
        CurrencyCode    NCHAR(3)        NULL CONSTRAINT DF_Project_CurrencyCode DEFAULT (N'USD'),
        ImageUrl        NVARCHAR(500)   NULL,
        MediaAssetId    INT             NULL,
        -- JSON "order" (0-based)
        DisplayOrder    INT             NOT NULL CONSTRAINT DF_Project_DisplayOrder DEFAULT (0),
        IsActive        BIT             NOT NULL CONSTRAINT DF_Project_IsActive DEFAULT (1),
        CreatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_Project_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt       DATETIME2(3)    NOT NULL CONSTRAINT DF_Project_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_Project PRIMARY KEY CLUSTERED (ProjectId),
        CONSTRAINT UQ_Project_DisplayOrder UNIQUE (DisplayOrder),
        CONSTRAINT CK_Project_Title_NotEmpty CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
        CONSTRAINT CK_Project_DisplayOrder   CHECK (DisplayOrder >= 0),
        CONSTRAINT CK_Project_PriceAmount    CHECK (ApproxPriceAmount IS NULL OR ApproxPriceAmount >= 0),
        CONSTRAINT FK_Project_MediaAsset
            FOREIGN KEY (MediaAssetId) REFERENCES dbo.MediaAsset (MediaAssetId)
            ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX UX_Project_LegacyId ON dbo.Project (LegacyId) WHERE LegacyId IS NOT NULL;
    CREATE INDEX IX_Project_DisplayOrder    ON dbo.Project (DisplayOrder) INCLUDE (Title, ApproxPrice, IsActive);
    CREATE INDEX IX_Project_MediaAssetId    ON dbo.Project (MediaAssetId) WHERE MediaAssetId IS NOT NULL;
END
GO


/* ----------------------------------------------------------------------------
   ProjectBulletPoint
   Maps to: NOTHING in the current JSON - this is NEW, mirroring
   CardBulletPoint for the Projects & Prices cards (feature/deliverable lists).
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.ProjectBulletPoint', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectBulletPoint
    (
        ProjectBulletPointId INT            IDENTITY(1,1) NOT NULL,
        ProjectId            INT            NOT NULL,
        [Text]               NVARCHAR(500)  NOT NULL,
        DisplayOrder         INT            NOT NULL,
        CreatedAt            DATETIME2(3)   NOT NULL CONSTRAINT DF_ProjectBulletPoint_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt            DATETIME2(3)   NOT NULL CONSTRAINT DF_ProjectBulletPoint_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ProjectBulletPoint PRIMARY KEY CLUSTERED (ProjectBulletPointId),
        CONSTRAINT UQ_ProjectBulletPoint_Project_Order UNIQUE (ProjectId, DisplayOrder),
        CONSTRAINT CK_ProjectBulletPoint_Text_NotEmpty CHECK (LEN(LTRIM(RTRIM([Text]))) > 0),
        CONSTRAINT CK_ProjectBulletPoint_DisplayOrder  CHECK (DisplayOrder >= 0),
        CONSTRAINT FK_ProjectBulletPoint_Project
            FOREIGN KEY (ProjectId) REFERENCES dbo.Project (ProjectId)
            ON DELETE CASCADE
    );

    CREATE INDEX IX_ProjectBulletPoint_ProjectId_Order ON dbo.ProjectBulletPoint (ProjectId, DisplayOrder);
END
GO


/* ----------------------------------------------------------------------------
   AboutContent
   Maps to: .env.about-content.json (scalar fields)
            (interface AboutContent in api/admin/about-content/route.ts ->
             headline, headlineFontFamily, headlineFontSize, headlineColor,
             body, bodyFontFamily, bodyFontSize, bodyColor, flashcards[])
   Singleton, like the JSON file (one About page). The flashcards[] array is
   normalised into dbo.AboutFlashcard below.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.AboutContent', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AboutContent
    (
        AboutContentId      TINYINT         NOT NULL CONSTRAINT DF_AboutContent_Id DEFAULT (1),
        Headline            NVARCHAR(300)   NOT NULL,
        HeadlineFontFamily  NVARCHAR(100)   NOT NULL CONSTRAINT DF_AboutContent_HeadlineFontFamily DEFAULT (N'Michroma'),
        HeadlineFontSize    INT             NOT NULL CONSTRAINT DF_AboutContent_HeadlineFontSize   DEFAULT (24),
        HeadlineColor       NVARCHAR(9)     NOT NULL CONSTRAINT DF_AboutContent_HeadlineColor      DEFAULT (N'#FFFFFF'),
        Body                NVARCHAR(MAX)   NOT NULL,
        BodyFontFamily      NVARCHAR(100)   NOT NULL CONSTRAINT DF_AboutContent_BodyFontFamily DEFAULT (N'Michroma'),
        BodyFontSize        INT             NOT NULL CONSTRAINT DF_AboutContent_BodyFontSize   DEFAULT (12),
        BodyColor           NVARCHAR(9)     NOT NULL CONSTRAINT DF_AboutContent_BodyColor      DEFAULT (N'#FFFFFF'),
        CreatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_AboutContent_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_AboutContent_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AboutContent PRIMARY KEY CLUSTERED (AboutContentId),
        CONSTRAINT CK_AboutContent_Singleton     CHECK (AboutContentId = 1),
        CONSTRAINT CK_AboutContent_HeadlineSize  CHECK (HeadlineFontSize BETWEEN 1 AND 400),
        CONSTRAINT CK_AboutContent_BodySize      CHECK (BodyFontSize     BETWEEN 1 AND 400),
        CONSTRAINT CK_AboutContent_HeadlineColor CHECK (HeadlineColor LIKE N'#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]%'),
        CONSTRAINT CK_AboutContent_BodyColor     CHECK (BodyColor     LIKE N'#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]%')
    );
END
GO


/* ----------------------------------------------------------------------------
   AboutFlashcard
   Maps to: .env.about-content.json -> flashcards[]
            (interface Flashcard -> { id, imageUrl, title, text })
   Note: the JSON defaults ship three flashcards with EMPTY title/text, so
   those columns must tolerate empty strings (no LEN > 0 check here).
   Rendered by src/components/landing/flashcards.tsx.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.AboutFlashcard', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AboutFlashcard
    (
        AboutFlashcardId INT            IDENTITY(1,1) NOT NULL,
        AboutContentId   TINYINT        NOT NULL CONSTRAINT DF_AboutFlashcard_AboutContentId DEFAULT (1),
        LegacyId         NVARCHAR(50)   NULL,          -- JSON "id" e.g. "card-1".."card-3"
        Title            NVARCHAR(200)  NOT NULL CONSTRAINT DF_AboutFlashcard_Title DEFAULT (N''),
        [Text]           NVARCHAR(MAX)  NOT NULL CONSTRAINT DF_AboutFlashcard_Text  DEFAULT (N''),
        ImageUrl         NVARCHAR(500)  NULL,
        MediaAssetId     INT            NULL,
        DisplayOrder     INT            NOT NULL CONSTRAINT DF_AboutFlashcard_DisplayOrder DEFAULT (0),
        CreatedAt        DATETIME2(3)   NOT NULL CONSTRAINT DF_AboutFlashcard_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt        DATETIME2(3)   NOT NULL CONSTRAINT DF_AboutFlashcard_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_AboutFlashcard PRIMARY KEY CLUSTERED (AboutFlashcardId),
        CONSTRAINT UQ_AboutFlashcard_Order UNIQUE (AboutContentId, DisplayOrder),
        CONSTRAINT CK_AboutFlashcard_DisplayOrder CHECK (DisplayOrder >= 0),
        CONSTRAINT FK_AboutFlashcard_AboutContent
            FOREIGN KEY (AboutContentId) REFERENCES dbo.AboutContent (AboutContentId)
            ON DELETE CASCADE,
        CONSTRAINT FK_AboutFlashcard_MediaAsset
            FOREIGN KEY (MediaAssetId) REFERENCES dbo.MediaAsset (MediaAssetId)
            ON DELETE SET NULL
    );

    CREATE INDEX IX_AboutFlashcard_Order        ON dbo.AboutFlashcard (AboutContentId, DisplayOrder);
    CREATE INDEX IX_AboutFlashcard_MediaAssetId ON dbo.AboutFlashcard (MediaAssetId) WHERE MediaAssetId IS NOT NULL;
END
GO


/* ----------------------------------------------------------------------------
   ContactSubmission
   Maps to: NOTHING persisted today. api/contact/route.ts validates the payload
            (interface ContactPayload -> { fullName, email, subject, body,
             requestCallback, phone?, attachmentSize? }) and then only
            console.log()s it; SMTP dispatch is still a TODO. This table gives
            the submission a durable home and a delivery-status trail.
   Validation mirrored from the route:
     - fullName/email/subject/body all required
     - email must match /^[^\s@]+@[^\s@]+\.[^\s@]+$/
     - attachmentSize <= 300 * 1024 (MAX_ATTACHMENT_BYTES)
     - requestCallback = 1 requires a phone number (validatePhoneNumber)
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.ContactSubmission', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContactSubmission
    (
        ContactSubmissionId BIGINT          IDENTITY(1,1) NOT NULL,
        FullName            NVARCHAR(200)   NOT NULL,
        Email               NVARCHAR(320)   NOT NULL,
        Subject             NVARCHAR(300)   NOT NULL,
        Body                NVARCHAR(MAX)   NOT NULL,
        RequestCallback     BIT             NOT NULL CONSTRAINT DF_ContactSubmission_RequestCallback DEFAULT (0),
        Phone               NVARCHAR(40)    NULL,
        AttachmentFileName  NVARCHAR(255)   NULL,
        AttachmentSizeBytes INT             NULL,
        -- Lifecycle of the (currently deferred) SMTP dispatch
        DeliveryStatus      NVARCHAR(20)    NOT NULL CONSTRAINT DF_ContactSubmission_DeliveryStatus DEFAULT (N'Pending'),
        DeliveryError       NVARCHAR(1000)  NULL,
        SentAt              DATETIME2(3)    NULL,
        IsRead              BIT             NOT NULL CONSTRAINT DF_ContactSubmission_IsRead DEFAULT (0),
        IpAddress           NVARCHAR(45)    NULL,
        UserAgent           NVARCHAR(400)   NULL,
        CreatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_ContactSubmission_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt           DATETIME2(3)    NOT NULL CONSTRAINT DF_ContactSubmission_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ContactSubmission PRIMARY KEY CLUSTERED (ContactSubmissionId),
        CONSTRAINT CK_ContactSubmission_FullName CHECK (LEN(LTRIM(RTRIM(FullName))) > 0),
        CONSTRAINT CK_ContactSubmission_Subject  CHECK (LEN(LTRIM(RTRIM(Subject)))  > 0),
        CONSTRAINT CK_ContactSubmission_Body     CHECK (LEN(LTRIM(RTRIM(Body)))     > 0),
        -- Coarse equivalent of the route's email regex
        CONSTRAINT CK_ContactSubmission_Email    CHECK (Email LIKE N'%_@_%._%' AND Email NOT LIKE N'% %'),
        -- 300 KB attachment cap, matching MAX_ATTACHMENT_BYTES
        CONSTRAINT CK_ContactSubmission_AttachmentSize
            CHECK (AttachmentSizeBytes IS NULL OR (AttachmentSizeBytes > 0 AND AttachmentSizeBytes <= 307200)),
        -- A callback request is meaningless without a phone number
        CONSTRAINT CK_ContactSubmission_CallbackPhone
            CHECK (RequestCallback = 0 OR (Phone IS NOT NULL AND LEN(LTRIM(RTRIM(Phone))) > 0)),
        CONSTRAINT CK_ContactSubmission_DeliveryStatus
            CHECK (DeliveryStatus IN (N'Pending', N'Sent', N'Failed'))
    );

    CREATE INDEX IX_ContactSubmission_CreatedAt ON dbo.ContactSubmission (CreatedAt DESC);
    CREATE INDEX IX_ContactSubmission_Email     ON dbo.ContactSubmission (Email);
    CREATE INDEX IX_ContactSubmission_Status    ON dbo.ContactSubmission (DeliveryStatus, CreatedAt DESC);
    CREATE INDEX IX_ContactSubmission_IsRead    ON dbo.ContactSubmission (IsRead, CreatedAt DESC);
END
GO


/* ----------------------------------------------------------------------------
   SmtpConfig
   Maps to: .env.smtp.json
            (interface SMTPConfig in api/admin/smtp-config/route.ts ->
             { host, port, secure, user, password, fromEmail })
   Singleton, like the JSON file. `password` is a live secret: prefer a secrets
   vault in production and keep only a reference in PasswordSecretRef.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.SmtpConfig', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SmtpConfig
    (
        SmtpConfigId      TINYINT        NOT NULL CONSTRAINT DF_SmtpConfig_Id DEFAULT (1),
        Host              NVARCHAR(255)  NOT NULL,
        Port              INT            NOT NULL CONSTRAINT DF_SmtpConfig_Port DEFAULT (587),
        Secure            BIT            NOT NULL CONSTRAINT DF_SmtpConfig_Secure DEFAULT (0),
        [User]            NVARCHAR(320)  NOT NULL,
        -- Encrypted-at-rest or vault-managed in production; never surfaced to the client.
        [Password]        NVARCHAR(500)  NOT NULL,
        PasswordSecretRef NVARCHAR(200)  NULL,
        FromEmail         NVARCHAR(320)  NOT NULL,
        CreatedAt         DATETIME2(3)   NOT NULL CONSTRAINT DF_SmtpConfig_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt         DATETIME2(3)   NOT NULL CONSTRAINT DF_SmtpConfig_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SmtpConfig PRIMARY KEY CLUSTERED (SmtpConfigId),
        CONSTRAINT CK_SmtpConfig_Singleton CHECK (SmtpConfigId = 1),
        CONSTRAINT CK_SmtpConfig_Host      CHECK (LEN(LTRIM(RTRIM(Host))) > 0),
        CONSTRAINT CK_SmtpConfig_Port      CHECK (Port BETWEEN 1 AND 65535),
        CONSTRAINT CK_SmtpConfig_FromEmail CHECK (FromEmail LIKE N'%_@_%._%' AND FromEmail NOT LIKE N'% %')
    );
END
GO


/* ----------------------------------------------------------------------------
   SocialConfig
   Maps to: .env.social-config.json
            (interfaces InstagramConfig / FacebookConfig in
             api/admin/social-config/route.ts ->
             { connected, accountId|pageId, accessToken })
   The JSON nests one object per platform under fixed keys. Here it is a row
   per platform, which lets a third platform be added without a schema change.
   AccountRef unifies instagram.accountId and facebook.pageId.
   The GET route masks accessToken before returning it - masking stays an
   application concern; the raw token lives here.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.SocialConfig', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SocialConfig
    (
        SocialConfigId   INT            IDENTITY(1,1) NOT NULL,
        Platform         NVARCHAR(30)   NOT NULL,   -- 'instagram' | 'facebook'
        Connected        BIT            NOT NULL CONSTRAINT DF_SocialConfig_Connected DEFAULT (0),
        -- instagram.accountId  /  facebook.pageId
        AccountRef       NVARCHAR(100)  NOT NULL CONSTRAINT DF_SocialConfig_AccountRef DEFAULT (N''),
        AccessToken      NVARCHAR(1000) NOT NULL CONSTRAINT DF_SocialConfig_AccessToken DEFAULT (N''),
        TokenSecretRef   NVARCHAR(200)  NULL,
        TokenExpiresAt   DATETIME2(3)   NULL,
        CreatedAt        DATETIME2(3)   NOT NULL CONSTRAINT DF_SocialConfig_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt        DATETIME2(3)   NOT NULL CONSTRAINT DF_SocialConfig_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SocialConfig PRIMARY KEY CLUSTERED (SocialConfigId),
        CONSTRAINT UQ_SocialConfig_Platform UNIQUE (Platform),
        CONSTRAINT CK_SocialConfig_Platform CHECK (Platform IN (N'instagram', N'facebook')),
        -- A "connected" platform must actually identify an account
        CONSTRAINT CK_SocialConfig_Connected_HasAccount
            CHECK (Connected = 0 OR LEN(LTRIM(RTRIM(AccountRef))) > 0)
    );
END
GO


/* ----------------------------------------------------------------------------
   SocialPostLog
   Maps to: .env.social-post-log.json
            (interface SocialPostResult in api/admin/social-post/route.ts ->
             { platform, success, postedAt, simulated, text, imageUrl, videoUrl })
   The JSON file is a rolling array truncated to the last 50 entries
   (MAX_LOG_ENTRIES); in SQL the history is unbounded and trimming becomes a
   query concern (TOP 50 ORDER BY PostedAt DESC) or a retention job.
   `simulated` is literally `true` today because both publish functions are
   stubs awaiting the real Graph API calls.
   -------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.SocialPostLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SocialPostLog
    (
        SocialPostLogId  BIGINT          IDENTITY(1,1) NOT NULL,
        Platform         NVARCHAR(30)    NOT NULL,
        Success          BIT             NOT NULL,
        Simulated        BIT             NOT NULL CONSTRAINT DF_SocialPostLog_Simulated DEFAULT (1),
        [Text]           NVARCHAR(MAX)   NULL,
        ImageUrl         NVARCHAR(500)   NULL,
        VideoUrl         NVARCHAR(500)   NULL,
        -- Provider-side id, populated once the real Graph API calls replace the stubs
        RemotePostId     NVARCHAR(100)   NULL,
        ErrorMessage     NVARCHAR(1000)  NULL,
        PostedAt         DATETIME2(3)    NOT NULL CONSTRAINT DF_SocialPostLog_PostedAt DEFAULT (SYSUTCDATETIME()),
        CreatedAt        DATETIME2(3)    NOT NULL CONSTRAINT DF_SocialPostLog_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt        DATETIME2(3)    NOT NULL CONSTRAINT DF_SocialPostLog_UpdatedAt DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_SocialPostLog PRIMARY KEY CLUSTERED (SocialPostLogId),
        CONSTRAINT CK_SocialPostLog_Platform CHECK (Platform IN (N'instagram', N'facebook'))
    );

    CREATE INDEX IX_SocialPostLog_PostedAt ON dbo.SocialPostLog (PostedAt DESC);
    CREATE INDEX IX_SocialPostLog_Platform ON dbo.SocialPostLog (Platform, PostedAt DESC);
END
GO


/* ============================================================================
   SECTION 3 - TRANSACTIONS
   ----------------------------------------------------------------------------
   Stored procedures for the main write paths. Every one of them uses
   BEGIN TRY / BEGIN TRAN / COMMIT / ROLLBACK / CATCH + THROW, so a partial
   write can never be observed - which is exactly the guarantee the current
   fs.writeFileSync-based code does NOT have (a crash mid-write corrupts the
   JSON file, which the loaders defensively handle by reseeding defaults).
   ============================================================================ */
GO


/* ----------------------------------------------------------------------------
   usp_AdminLogin_CreateSession
   Write path: POST /api/admin/login -> createSession() in admin-auth.ts
   Password verification (scrypt) happens in Node, NOT here; this proc is
   called only AFTER verifyPassword() has returned true.
   Atomically: prune expired sessions, insert the new one, stamp LastLoginAt,
   clear the failed-attempt counter.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_AdminLogin_CreateSession
    @Username       NVARCHAR(100),
    @Token          NVARCHAR(128),
    @TtlSeconds     INT            = 86400,   -- SESSION_TTL_MS = 24h
    @IpAddress      NVARCHAR(45)   = NULL,
    @UserAgent      NVARCHAR(400)  = NULL,
    @AdminSessionId BIGINT         OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @AdminUserId INT;

        SELECT @AdminUserId = AdminUserId
        FROM dbo.AdminUser WITH (UPDLOCK, ROWLOCK)
        WHERE Username = @Username
          AND IsActive = 1;

        IF @AdminUserId IS NULL
            THROW 50001, N'Unknown or inactive admin user.', 1;

        -- Housekeeping: the JSON implementation pruned on every read.
        DELETE FROM dbo.AdminSession
        WHERE ExpiresAt <= SYSUTCDATETIME();

        INSERT INTO dbo.AdminSession (AdminUserId, Token, IpAddress, UserAgent, ExpiresAt)
        VALUES (@AdminUserId, @Token, @IpAddress, @UserAgent,
                DATEADD(SECOND, @TtlSeconds, SYSUTCDATETIME()));

        SET @AdminSessionId = CAST(SCOPE_IDENTITY() AS BIGINT);

        UPDATE dbo.AdminUser
        SET LastLoginAt      = SYSUTCDATETIME(),
            FailedLoginCount = 0,
            LockedUntil      = NULL,
            UpdatedAt        = SYSUTCDATETIME()
        WHERE AdminUserId = @AdminUserId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_AdminLogout_DeleteSession
   Write path: POST /api/admin/logout -> destroySession(token)
   Deletes the caller's token and opportunistically sweeps expired rows,
   matching pruneExpiredSessions() in the JSON implementation.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_AdminLogout_DeleteSession
    @Token NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.AdminSession
        WHERE Token = @Token;

        DELETE FROM dbo.AdminSession
        WHERE ExpiresAt <= SYSUTCDATETIME();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_HomeText_ReplaceAll
   Write path: POST /api/admin/home-text
   The JSON handler rewrites the WHOLE .env.home-text.json in one
   fs.writeFileSync. This proc reproduces that all-or-nothing semantic:
   delete every sentence, re-insert the submitted set in array order, and
   upsert the typography settings - all inside one transaction.
   @Sentences is an ordered JSON array, passed through verbatim from the
   request body: [{ "id": "1", "text": "..." }, ...]
   Array index (OPENJSON key) becomes DisplayOrder, preserving playback order.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_HomeText_ReplaceAll
    @Sentences     NVARCHAR(MAX),               -- JSON array of { id, text }
    @FontFamily    NVARCHAR(100) = N'Michroma',
    @FontSize      INT           = 42,
    @TextColor     NVARCHAR(9)   = N'#000000',
    @LetterSpacing DECIMAL(6,2)  = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@Sentences) <> 1
        THROW 50010, N'@Sentences must be a valid JSON array.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Full replacement, exactly like overwriting the JSON file.
        DELETE FROM dbo.HomeTextSentence;

        INSERT INTO dbo.HomeTextSentence (LegacyId, [Text], DisplayOrder, IsActive)
        SELECT
            j.LegacyId,
            j.[Text],
            CAST(arr.[key] AS INT),   -- array position == display order
            1
        FROM OPENJSON(@Sentences) AS arr
        CROSS APPLY OPENJSON(arr.value)
            WITH (
                LegacyId NVARCHAR(50)   N'$.id',
                [Text]   NVARCHAR(1000) N'$.text'
            ) AS j
        WHERE LEN(LTRIM(RTRIM(j.[Text]))) > 0;

        -- Upsert the singleton typography row.
        IF EXISTS (SELECT 1 FROM dbo.HomeTextSettings WHERE SettingsId = 1)
        BEGIN
            UPDATE dbo.HomeTextSettings
            SET FontFamily    = @FontFamily,
                FontSize      = @FontSize,
                TextColor     = @TextColor,
                LetterSpacing = @LetterSpacing,
                UpdatedAt     = SYSUTCDATETIME()
            WHERE SettingsId = 1;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.HomeTextSettings (SettingsId, FontFamily, FontSize, TextColor, LetterSpacing)
            VALUES (1, @FontFamily, @FontSize, @TextColor, @LetterSpacing);
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_Card_Upsert
   Write path: POST /api/admin/cards (per-card slice of the array rewrite),
               plus the new bullet-point + image-upload admin features.
   A card and its ordered bullet list are written as ONE unit: if the bullets
   fail, the card edit is rolled back too.
   @BulletPoints is a JSON array of strings OR of { "text": "..." } objects;
   array position becomes DisplayOrder.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Card_Upsert
    @CardId       INT            = NULL,   -- NULL => insert
    @LegacyId     NVARCHAR(50)   = NULL,
    @Title        NVARCHAR(200),
    @Description  NVARCHAR(MAX)  = N'',
    @ImageUrl     NVARCHAR(500)  = NULL,
    @MediaAssetId INT            = NULL,
    @DisplayOrder INT            = 0,
    @IsActive     BIT            = 1,
    @BulletPoints NVARCHAR(MAX)  = NULL,   -- JSON array; NULL leaves bullets untouched
    @OutCardId    INT            OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BulletPoints IS NOT NULL AND ISJSON(@BulletPoints) <> 1
        THROW 50020, N'@BulletPoints must be a valid JSON array.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Resolve by surrogate key, falling back to the legacy JSON id.
        IF @CardId IS NULL AND @LegacyId IS NOT NULL
            SELECT @CardId = CardId FROM dbo.Card WHERE LegacyId = @LegacyId;

        IF @CardId IS NULL
        BEGIN
            INSERT INTO dbo.Card (LegacyId, Title, [Description], ImageUrl, MediaAssetId, DisplayOrder, IsActive)
            VALUES (@LegacyId, @Title, ISNULL(@Description, N''), @ImageUrl, @MediaAssetId, @DisplayOrder, @IsActive);

            SET @OutCardId = CAST(SCOPE_IDENTITY() AS INT);
        END
        ELSE
        BEGIN
            UPDATE dbo.Card
            SET LegacyId     = ISNULL(@LegacyId, LegacyId),
                Title        = @Title,
                [Description]= ISNULL(@Description, N''),
                ImageUrl     = @ImageUrl,
                MediaAssetId = @MediaAssetId,
                DisplayOrder = @DisplayOrder,
                IsActive     = @IsActive,
                UpdatedAt    = SYSUTCDATETIME()
            WHERE CardId = @CardId;

            IF @@ROWCOUNT = 0
                THROW 50021, N'Card not found for update.', 1;

            SET @OutCardId = @CardId;
        END

        -- Replace the bullet list wholesale so ordering and deletions are exact.
        IF @BulletPoints IS NOT NULL
        BEGIN
            DELETE FROM dbo.CardBulletPoint WHERE CardId = @OutCardId;

            INSERT INTO dbo.CardBulletPoint (CardId, [Text], DisplayOrder)
            SELECT
                @OutCardId,
                LTRIM(RTRIM(COALESCE(JSON_VALUE(b.value, N'$.text'), b.value))),
                CAST(b.[key] AS INT)
            FROM OPENJSON(@BulletPoints) AS b
            WHERE LEN(LTRIM(RTRIM(COALESCE(JSON_VALUE(b.value, N'$.text'), b.value)))) > 0;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_Project_Upsert
   Write path: POST /api/admin/projects
   Same all-or-nothing pattern as usp_Card_Upsert, for the Projects & Prices
   page. The route's "exactly 7 projects" rule is enforced in the API layer,
   not here.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_Project_Upsert
    @ProjectId         INT            = NULL,
    @LegacyId          NVARCHAR(50)   = NULL,
    @Title             NVARCHAR(200),
    @BriefInfo         NVARCHAR(MAX)  = N'',
    @ApproxPrice       NVARCHAR(50)   = N'$—',
    @ApproxPriceAmount DECIMAL(12,2)  = NULL,
    @ImageUrl          NVARCHAR(500)  = NULL,
    @MediaAssetId      INT            = NULL,
    @DisplayOrder      INT            = 0,
    @IsActive          BIT            = 1,
    @BulletPoints      NVARCHAR(MAX)  = NULL,
    @OutProjectId      INT            OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @BulletPoints IS NOT NULL AND ISJSON(@BulletPoints) <> 1
        THROW 50030, N'@BulletPoints must be a valid JSON array.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @ProjectId IS NULL AND @LegacyId IS NOT NULL
            SELECT @ProjectId = ProjectId FROM dbo.Project WHERE LegacyId = @LegacyId;

        IF @ProjectId IS NULL
        BEGIN
            INSERT INTO dbo.Project
                (LegacyId, Title, BriefInfo, ApproxPrice, ApproxPriceAmount,
                 ImageUrl, MediaAssetId, DisplayOrder, IsActive)
            VALUES
                (@LegacyId, @Title, ISNULL(@BriefInfo, N''), @ApproxPrice, @ApproxPriceAmount,
                 @ImageUrl, @MediaAssetId, @DisplayOrder, @IsActive);

            SET @OutProjectId = CAST(SCOPE_IDENTITY() AS INT);
        END
        ELSE
        BEGIN
            UPDATE dbo.Project
            SET LegacyId          = ISNULL(@LegacyId, LegacyId),
                Title             = @Title,
                BriefInfo         = ISNULL(@BriefInfo, N''),
                ApproxPrice       = @ApproxPrice,
                ApproxPriceAmount = @ApproxPriceAmount,
                ImageUrl          = @ImageUrl,
                MediaAssetId      = @MediaAssetId,
                DisplayOrder      = @DisplayOrder,
                IsActive          = @IsActive,
                UpdatedAt         = SYSUTCDATETIME()
            WHERE ProjectId = @ProjectId;

            IF @@ROWCOUNT = 0
                THROW 50031, N'Project not found for update.', 1;

            SET @OutProjectId = @ProjectId;
        END

        IF @BulletPoints IS NOT NULL
        BEGIN
            DELETE FROM dbo.ProjectBulletPoint WHERE ProjectId = @OutProjectId;

            INSERT INTO dbo.ProjectBulletPoint (ProjectId, [Text], DisplayOrder)
            SELECT
                @OutProjectId,
                LTRIM(RTRIM(COALESCE(JSON_VALUE(b.value, N'$.text'), b.value))),
                CAST(b.[key] AS INT)
            FROM OPENJSON(@BulletPoints) AS b
            WHERE LEN(LTRIM(RTRIM(COALESCE(JSON_VALUE(b.value, N'$.text'), b.value)))) > 0;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_ContactSubmission_Insert
   Write path: POST /api/contact
   Replaces the current console.log() with a durable row. The route appends the
   phone number to the body when requestCallback is true; here Phone is kept as
   its own column and Body stays clean.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_ContactSubmission_Insert
    @FullName            NVARCHAR(200),
    @Email               NVARCHAR(320),
    @Subject             NVARCHAR(300),
    @Body                NVARCHAR(MAX),
    @RequestCallback     BIT            = 0,
    @Phone               NVARCHAR(40)   = NULL,
    @AttachmentFileName  NVARCHAR(255)  = NULL,
    @AttachmentSizeBytes INT            = NULL,
    @IpAddress           NVARCHAR(45)   = NULL,
    @UserAgent           NVARCHAR(400)  = NULL,
    @OutSubmissionId     BIGINT         OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @RequestCallback = 1 AND (@Phone IS NULL OR LEN(LTRIM(RTRIM(@Phone))) = 0)
            THROW 50040, N'Phone number required for callback requests.', 1;

        -- MAX_ATTACHMENT_BYTES = 300 * 1024
        IF @AttachmentSizeBytes IS NOT NULL AND @AttachmentSizeBytes > 307200
            THROW 50041, N'Attachment exceeds 300KB limit.', 1;

        INSERT INTO dbo.ContactSubmission
            (FullName, Email, Subject, Body, RequestCallback, Phone,
             AttachmentFileName, AttachmentSizeBytes, DeliveryStatus, IpAddress, UserAgent)
        VALUES
            (@FullName, @Email, @Subject, @Body, @RequestCallback, @Phone,
             @AttachmentFileName, @AttachmentSizeBytes, N'Pending', @IpAddress, @UserAgent);

        SET @OutSubmissionId = CAST(SCOPE_IDENTITY() AS BIGINT);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ----------------------------------------------------------------------------
   usp_ContactSubmission_MarkDelivered
   Companion to the above, for when the deferred SMTP dispatch is wired up.
   -------------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_ContactSubmission_MarkDelivered
    @ContactSubmissionId BIGINT,
    @Success             BIT,
    @ErrorMessage        NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.ContactSubmission
        SET DeliveryStatus = CASE WHEN @Success = 1 THEN N'Sent' ELSE N'Failed' END,
            DeliveryError  = CASE WHEN @Success = 1 THEN NULL ELSE @ErrorMessage END,
            SentAt         = CASE WHEN @Success = 1 THEN SYSUTCDATETIME() ELSE SentAt END,
            UpdatedAt      = SYSUTCDATETIME()
        WHERE ContactSubmissionId = @ContactSubmissionId;

        IF @@ROWCOUNT = 0
            THROW 50042, N'Contact submission not found.', 1;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO


/* ============================================================================
   SECTION 4 - OPTIONAL SEED / REFERENCE DATA
   ----------------------------------------------------------------------------
   *** OPTIONAL *** - everything below is development/bootstrap convenience and
   can be skipped entirely in production. It reproduces the DEFAULT_* constants
   that the API route handlers fall back to when no JSON file exists.

   The seeded admin password hash below is a PLACEHOLDER, not a real hash.
   Generate the real value in Node with hashPassword() from
   src/lib/admin-auth.ts and substitute it before running this section:

       node -e "console.log(require('./src/lib/admin-auth').hashPassword('YourPassword'))"
   ============================================================================ */

/* -- Uncomment the block below to seed development data. --------------------

-- AdminUser: mirrors loadOrSeedCredentials()'s default "admin" account.
-- REPLACE the PasswordHash with a real scrypt "salt:hash" before use.
IF NOT EXISTS (SELECT 1 FROM dbo.AdminUser WHERE Username = N'admin')
BEGIN
    INSERT INTO dbo.AdminUser (Username, PasswordHash, DisplayName, IsActive)
    VALUES (N'admin',
            N'REPLACE_WITH_HEX_SALT:REPLACE_WITH_HEX_SCRYPT_KEY_64_BYTES_HEX_ENCODED_VALUE',
            N'Mike Alemie', 1);
END

-- HomeTextSettings + HomeTextSentence: DEFAULT_CONFIG from home-text/route.ts.
IF NOT EXISTS (SELECT 1 FROM dbo.HomeTextSettings WHERE SettingsId = 1)
    INSERT INTO dbo.HomeTextSettings (SettingsId, FontFamily, FontSize, TextColor, LetterSpacing)
    VALUES (1, N'Michroma', 42, N'#000000', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.HomeTextSentence)
    INSERT INTO dbo.HomeTextSentence (LegacyId, [Text], DisplayOrder) VALUES
        (N'1', N'DON''T JUST BUILD IT. ENGINEER IT FOR THE PERFECTION.',            0),
        (N'2', N'YOU DESCRIBE, I ENGINEER & FLOWCHART IT.',                         1),
        (N'3', N'SMART ARCHITECTURE. GREAT DESIGN. REAL IMPACT.',                   2),
        (N'4', N'RENEW & EMPOWER YOUR BUSINESS FOR THE BETTER SHINNING.',           3),
        (N'5', N'BREAK THE ORDINARY FASHION. REBUILD FOR THE FUTURE.',              4),
        (N'6', N'DESIGNED TO IMPRESS. ENGINEERED TO FIX & PERFORM.',                5),
        (N'7', N'WEB APP & DATABASE ARCHITECTURE FOR COMPLEX PROJECTS IS MY DNA.',  6),
        -- The cube reveal in ash-text-section.tsx keys off this final sentence.
        (N'8', N'MEHRDAD MIKE ALEMIE.',                                            7);

-- Card: DEFAULT_CARDS from cards/route.ts.
IF NOT EXISTS (SELECT 1 FROM dbo.Card)
    INSERT INTO dbo.Card (LegacyId, Title, [Description], ImageUrl, DisplayOrder) VALUES
        (N'c1', N'Data Architecture',  N'Placeholder content — editable via Admin.', NULL, 0),
        (N'c2', N'AI Systems',         N'Placeholder content — editable via Admin.', NULL, 1),
        (N'c3', N'Product Design',     N'Placeholder content — editable via Admin.', NULL, 2),
        (N'c4', N'Cloud Engineering',  N'Placeholder content — editable via Admin.', NULL, 3);

-- Project: DEFAULT_PROJECTS from projects/route.ts (7 placeholder rows).
IF NOT EXISTS (SELECT 1 FROM dbo.Project)
    INSERT INTO dbo.Project (LegacyId, Title, BriefInfo, ApproxPrice, ImageUrl, DisplayOrder)
    SELECT N'p' + CAST(n AS NVARCHAR(10)),
           N'Project ' + CAST(n AS NVARCHAR(10)),
           N'Placeholder project description.',
           N'$—',
           NULL,
           n - 1
    FROM (VALUES (1),(2),(3),(4),(5),(6),(7)) AS v(n);

-- AboutContent + AboutFlashcard: DEFAULT_CONTENT from about-content/route.ts.
IF NOT EXISTS (SELECT 1 FROM dbo.AboutContent WHERE AboutContentId = 1)
    INSERT INTO dbo.AboutContent
        (AboutContentId, Headline, HeadlineFontFamily, HeadlineFontSize, HeadlineColor,
         Body, BodyFontFamily, BodyFontSize, BodyColor)
    VALUES
        (1, N'About Mike Alemie', N'Michroma', 24, N'#FFFFFF',
         N'Mike Alemie is a designer and engineer focused on the intersection of data, systems, and craft. His work blends structured thinking with a strong visual sensibility. This is placeholder body text — edit it from the Admin panel.',
         N'Michroma', 12, N'#FFFFFF');

IF NOT EXISTS (SELECT 1 FROM dbo.AboutFlashcard)
    INSERT INTO dbo.AboutFlashcard (AboutContentId, LegacyId, Title, [Text], ImageUrl, DisplayOrder) VALUES
        (1, N'card-1', N'', N'', NULL, 0),
        (1, N'card-2', N'', N'', NULL, 1),
        (1, N'card-3', N'', N'', NULL, 2);

-- SocialConfig: DEFAULT_CONFIG from social-config/route.ts (both disconnected).
IF NOT EXISTS (SELECT 1 FROM dbo.SocialConfig WHERE Platform = N'instagram')
    INSERT INTO dbo.SocialConfig (Platform, Connected, AccountRef, AccessToken)
    VALUES (N'instagram', 0, N'', N'');

IF NOT EXISTS (SELECT 1 FROM dbo.SocialConfig WHERE Platform = N'facebook')
    INSERT INTO dbo.SocialConfig (Platform, Connected, AccountRef, AccessToken)
    VALUES (N'facebook', 0, N'', N'');

-- SmtpConfig is intentionally NOT seeded: it holds a live credential and the
-- GET route legitimately returns 404 until an administrator configures it.

--------------------------------------------------------------------------- */

PRINT N'MAWebsiteDB schema script completed.';
GO
