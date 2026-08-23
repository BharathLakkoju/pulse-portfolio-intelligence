-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "taxResidency" TEXT NOT NULL DEFAULT 'IN',
    "baseCurrency" TEXT NOT NULL DEFAULT 'INR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "investorProfile" TEXT NOT NULL DEFAULT 'investor',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passkeysEnabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "device" TEXT,
    "ipHash" TEXT,
    "revokedAt" DATETIME,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'INR',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "dashboardKind" TEXT NOT NULL DEFAULT 'long_term',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isReadOnly" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "scopesGranted" TEXT NOT NULL DEFAULT 'read_holdings,read_transactions',
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" DATETIME,
    "encryptedTokenRef" TEXT,
    CONSTRAINT "Account_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "isin" TEXT,
    "exchange" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "sector" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "currency" TEXT NOT NULL DEFAULT 'INR'
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "close" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'synthetic',
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PriceHistory_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "rate" TEXT NOT NULL,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BenchmarkPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benchmarkId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "close" TEXT NOT NULL,
    "isSynthetic" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceTransactionId" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "settledAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "eventType" TEXT NOT NULL,
    "instrumentId" TEXT,
    "quantity" TEXT NOT NULL DEFAULT '0',
    "unitPrice" TEXT NOT NULL DEFAULT '0',
    "grossAmount" TEXT NOT NULL DEFAULT '0',
    "feeAmount" TEXT NOT NULL DEFAULT '0',
    "taxAmount" TEXT NOT NULL DEFAULT '0',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "fxRateToBase" TEXT,
    "sourceDocumentRef" TEXT,
    "parseConfidence" REAL NOT NULL DEFAULT 1,
    "reconciliationState" TEXT NOT NULL DEFAULT 'clean',
    "rawPayloadRef" TEXT,
    "correctsTransactionId" TEXT,
    "dedupeHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxLot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "openTransactionId" TEXT NOT NULL,
    "acquiredAt" DATETIME NOT NULL,
    "quantityOriginal" TEXT NOT NULL,
    "quantityRemaining" TEXT NOT NULL,
    "costBasisPerUnit" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "closedAt" DATETIME,
    "closeTransactionId" TEXT,
    "realizedGain" TEXT,
    "holdingPeriod" TEXT,
    CONSTRAINT "TaxLot_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaxLot_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetWeight" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAllocation_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetAmount" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "contributionAmount" TEXT NOT NULL DEFAULT '0',
    "contributionFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "expectedReturnLow" REAL NOT NULL DEFAULT 0.06,
    "expectedReturnHigh" REAL NOT NULL DEFAULT 0.12,
    "inflationAssumption" REAL NOT NULL DEFAULT 0.05,
    "linkedAccountIds" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Goal_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalValue" TEXT NOT NULL,
    "investedValue" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    CONSTRAINT "Snapshot_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portfolioId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentUpload_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "evidenceJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    "snoozedUntil" DATETIME,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alert_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "thresholdValue" REAL,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "frequencyCap" TEXT NOT NULL DEFAULT 'realtime',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingCountry" TEXT NOT NULL DEFAULT 'IN',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "razorpayCustomerId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "trialEndsAt" DATETIME,
    "currentPeriodEnd" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "taxAmount" TEXT NOT NULL DEFAULT '0',
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "webhookEventId" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "schedule" TEXT NOT NULL DEFAULT 'once',
    "storageRef" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "detailJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "groundingJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "Account_portfolioId_idx" ON "Account"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_symbol_exchange_key" ON "Instrument"("symbol", "exchange");

-- CreateIndex
CREATE INDEX "PriceHistory_instrumentId_idx" ON "PriceHistory"("instrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_instrumentId_date_key" ON "PriceHistory"("instrumentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_base_quote_date_key" ON "FxRate"("base", "quote", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkPrice_benchmarkId_date_key" ON "BenchmarkPrice"("benchmarkId", "date");

-- CreateIndex
CREATE INDEX "Transaction_portfolioId_idx" ON "Transaction"("portfolioId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_instrumentId_idx" ON "Transaction"("instrumentId");

-- CreateIndex
CREATE INDEX "Transaction_dedupeHash_idx" ON "Transaction"("dedupeHash");

-- CreateIndex
CREATE INDEX "TaxLot_portfolioId_idx" ON "TaxLot"("portfolioId");

-- CreateIndex
CREATE INDEX "TaxLot_instrumentId_idx" ON "TaxLot"("instrumentId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetAllocation_portfolioId_category_key" ON "TargetAllocation"("portfolioId", "category");

-- CreateIndex
CREATE INDEX "Snapshot_portfolioId_idx" ON "Snapshot"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_portfolioId_date_key" ON "Snapshot"("portfolioId", "date");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
