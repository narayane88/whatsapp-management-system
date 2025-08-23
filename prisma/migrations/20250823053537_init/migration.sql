-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('OWNER', 'SUBDEALER', 'EMPLOYEE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."VoucherType" AS ENUM ('CREDIT', 'PACKAGE', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('RECHARGE', 'PURCHASE', 'REFUND', 'COMMISSION');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'BANK', 'UPI', 'RAZORPAY', 'GATEWAY', 'WALLET', 'CREDIT', 'BIZPOINTS');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayoutType" AS ENUM ('CASH', 'CREDIT', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InstanceStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'CONNECTING', 'ERROR', 'AUTHENTICATING');

-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('INDIVIDUAL', 'GROUP', 'BROADCAST');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'POLL', 'REACTION');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."BizPointsType" AS ENUM ('EARNED', 'PURCHASED', 'SPENT', 'ADMIN_GRANTED', 'COMMISSION_EARNED', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'SETTLEMENT_WITHDRAW', 'BONUS');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "parentId" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(6),
    "profile_image" VARCHAR(500),
    "phone" VARCHAR(20),
    "address" TEXT,
    "dealer_code" VARCHAR(20),
    "notes" TEXT,
    "dealer_type" VARCHAR(20) DEFAULT 'user',
    "dealer_commission" DECIMAL(5,2) DEFAULT 0.00,
    "dealer_territory" VARCHAR(100),
    "dealer_status" VARCHAR(20) DEFAULT 'active',
    "language" VARCHAR(10) DEFAULT 'en',
    "account_balance" DECIMAL(10,2) DEFAULT 0.00,
    "message_balance" INTEGER DEFAULT 0,
    "voucher_credits" DECIMAL(10,2) DEFAULT 0.00,
    "last_voucher_redemption" TIMESTAMP(6),
    "mobile" VARCHAR(20),
    "package_expiry_notification" BOOLEAN DEFAULT true,
    "customer_status" VARCHAR(20) DEFAULT 'active',
    "registration_source" VARCHAR(50),
    "last_package_purchase" TIMESTAMP(6),
    "biz_points" DECIMAL(10,2) DEFAULT 0.00,
    "commission_rate" DECIMAL(5,2) DEFAULT 0.00,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_instances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serverId" TEXT,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" "public"."InstanceStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "qrCode" TEXT,
    "sessionData" JSONB,
    "settings" JSONB,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "name" TEXT,
    "type" "public"."ChatType" NOT NULL DEFAULT 'INDIVIDUAL',
    "participantCount" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromUser" TEXT NOT NULL,
    "toUser" TEXT,
    "content" TEXT,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'PENDING',
    "isFromMe" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_files" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "thumbnail" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."automation_rules" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT,
    "name" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimension" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "messageLimit" INTEGER NOT NULL,
    "instanceLimit" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mobile_accounts_limit" INTEGER DEFAULT 1,
    "contact_limit" INTEGER DEFAULT 1000,
    "api_key_limit" INTEGER DEFAULT 1,
    "receive_msg_limit" INTEGER DEFAULT 1000,
    "webhook_limit" INTEGER DEFAULT 1,
    "footmark_enabled" BOOLEAN DEFAULT false,
    "footmark_text" VARCHAR(255) DEFAULT 'Sent by bizflash.in',
    "package_color" VARCHAR(50) DEFAULT 'blue',
    "offer_price" DECIMAL(10,2),
    "offer_enabled" BOOLEAN DEFAULT false,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_packages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "messagesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "paymentMethod" TEXT DEFAULT 'CASH',

    CONSTRAINT "customer_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vouchers" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "usage_limit" INTEGER,
    "usage_count" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "expires_at" TIMESTAMP(6),
    "created_by" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "package_id" VARCHAR(255),
    "min_purchase_amount" DECIMAL(10,2),
    "max_discount_amount" DECIMAL(10,2),
    "dealer_id" VARCHAR(255),
    "allow_dealer_redemption" BOOLEAN DEFAULT false,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "gatewayData" JSONB,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bizpoints_transactions" (
    "id" VARCHAR NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_by" INTEGER,
    "type" "public"."BizPointsType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference" VARCHAR,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.0,

    CONSTRAINT "bizpoints_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "public"."PayoutType" NOT NULL DEFAULT 'CASH',
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "reference" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "defaultPermissions" BOOLEAN NOT NULL DEFAULT false,
    "neverExpires" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_logs" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "statusCode" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "maxDevices" INTEGER NOT NULL DEFAULT 10,
    "currentDevices" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "lastPing" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_queue" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "scheduled" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_profile" (
    "id" SERIAL NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "mobile_number" VARCHAR(20),
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "gstin_number" VARCHAR(50),
    "pan_number" VARCHAR(20),
    "favicon_url" TEXT,
    "light_logo_url" TEXT,
    "dark_logo_url" TEXT,
    "established_year" INTEGER,
    "business_type" VARCHAR(100),
    "description" TEXT,
    "social_media" JSONB,
    "bank_details" JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dealer_customers" (
    "id" SERIAL NOT NULL,
    "dealer_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" INTEGER,
    "commission_rate" DECIMAL(5,2) DEFAULT 0.00,
    "territory" VARCHAR(100),
    "status" VARCHAR(20) DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "dealer_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ip_restrictions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER,
    "user_id" INTEGER,
    "ip_address" cidr NOT NULL,
    "description" TEXT,
    "is_whitelist" BOOLEAN DEFAULT true,
    "is_active" BOOLEAN DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "permissions" INTEGER[],
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_system" BOOLEAN DEFAULT false,

    CONSTRAINT "permission_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "is_system" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "granted" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN DEFAULT false,
    "level" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_events" (
    "id" SERIAL NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "user_email" VARCHAR(255),
    "user_id" INTEGER,
    "ip_address" INET,
    "user_agent" TEXT,
    "severity" VARCHAR(20) DEFAULT 'low',
    "details" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sent_messages" (
    "id" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(50) NOT NULL,
    "recipientNumber" VARCHAR(50) NOT NULL,
    "recipientName" VARCHAR(255),
    "message" TEXT NOT NULL,
    "messageType" VARCHAR(50) NOT NULL DEFAULT 'text',
    "deviceName" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMPTZ(6),
    "readAt" TIMESTAMPTZ(6),
    "errorMessage" TEXT,
    "messageId" VARCHAR(255),
    "queueMessageId" VARCHAR(255),
    "attachmentUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."servers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "ip_address" INET NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 3001,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Offline',
    "environment" VARCHAR(50) NOT NULL DEFAULT 'Development',
    "location" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "messages_per_day" INTEGER NOT NULL DEFAULT 0,
    "uptime_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "last_heartbeat" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "version" VARCHAR(20) DEFAULT '1.0.0',
    "cpu_usage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "memory_usage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "storage_usage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "network_usage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "whatsapp_instances" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "performed_by" VARCHAR(255) NOT NULL,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_balance_history" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2),
    "message_count" INTEGER,
    "previous_balance" DECIMAL(10,2),
    "new_balance" DECIMAL(10,2),
    "previous_messages" INTEGER,
    "new_messages" INTEGER,
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_balance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "granted" BOOLEAN DEFAULT true,
    "reason" TEXT,
    "assigned_by" INTEGER,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_primary" BOOLEAN DEFAULT false,
    "assigned_by" INTEGER,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voucher_redemption_attempts" (
    "id" SERIAL NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "attempt_status" VARCHAR(20) NOT NULL,
    "failure_reason" VARCHAR(255),
    "ip_address" INET,
    "user_agent" TEXT,
    "attempted_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemption_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."voucher_usage" (
    "id" SERIAL NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "used_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "discount_amount" DECIMAL(10,2),
    "original_amount" DECIMAL(10,2),
    "final_amount" DECIMAL(10,2),
    "package_id" VARCHAR(255),
    "notes" TEXT,
    "redemption_type" VARCHAR(20) DEFAULT 'manual',

    CONSTRAINT "voucher_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_dealer_code_key" ON "public"."users"("dealer_code");

-- CreateIndex
CREATE INDEX "idx_users_account_balance" ON "public"."users"("account_balance");

-- CreateIndex
CREATE INDEX "idx_users_active" ON "public"."users"("isActive");

-- CreateIndex
CREATE INDEX "idx_users_dealer_code" ON "public"."users"("dealer_code");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_message_balance" ON "public"."users"("message_balance");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "chats_instanceId_chatId_key" ON "public"."chats"("instanceId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_instanceId_messageId_key" ON "public"."messages"("instanceId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_messageId_key" ON "public"."media_files"("messageId");

-- CreateIndex
CREATE INDEX "idx_packages_active" ON "public"."packages"("isActive");

-- CreateIndex
CREATE INDEX "idx_customer_packages_user_active" ON "public"."customer_packages"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "public"."vouchers"("code");

-- CreateIndex
CREATE INDEX "idx_vouchers_active" ON "public"."vouchers"("is_active");

-- CreateIndex
CREATE INDEX "idx_vouchers_code" ON "public"."vouchers"("code");

-- CreateIndex
CREATE INDEX "idx_vouchers_dealer" ON "public"."vouchers"("dealer_id");

-- CreateIndex
CREATE INDEX "idx_vouchers_expires" ON "public"."vouchers"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE INDEX "idx_api_keys_user_id" ON "public"."api_keys"("userId");

-- CreateIndex
CREATE INDEX "idx_api_keys_active" ON "public"."api_keys"("isActive");

-- CreateIndex
CREATE INDEX "idx_api_keys_never_expires" ON "public"."api_keys"("neverExpires");

-- CreateIndex
CREATE UNIQUE INDEX "contact_group_members_groupId_contactId_key" ON "public"."contact_group_members"("groupId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_userId_phoneNumber_key" ON "public"."contacts"("userId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_customers_dealer_id_customer_id_key" ON "public"."dealer_customers"("dealer_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_templates_name_key" ON "public"."permission_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "idx_permissions_category" ON "public"."permissions"("category");

-- CreateIndex
CREATE INDEX "idx_permissions_name" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "idx_permissions_resource_action" ON "public"."permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "idx_role_permissions_lookup" ON "public"."role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission" ON "public"."role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role" ON "public"."role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "public"."role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "idx_sent_messages_device_name" ON "public"."sent_messages"("deviceName");

-- CreateIndex
CREATE INDEX "idx_sent_messages_recipient" ON "public"."sent_messages"("recipientNumber");

-- CreateIndex
CREATE INDEX "idx_sent_messages_sent_at" ON "public"."sent_messages"("sentAt");

-- CreateIndex
CREATE INDEX "idx_sent_messages_status" ON "public"."sent_messages"("status");

-- CreateIndex
CREATE INDEX "idx_sent_messages_user_id" ON "public"."sent_messages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "servers_name_key" ON "public"."servers"("name");

-- CreateIndex
CREATE INDEX "idx_servers_active" ON "public"."servers"("is_active");

-- CreateIndex
CREATE INDEX "idx_servers_environment" ON "public"."servers"("environment");

-- CreateIndex
CREATE INDEX "idx_servers_last_heartbeat" ON "public"."servers"("last_heartbeat");

-- CreateIndex
CREATE INDEX "idx_servers_location" ON "public"."servers"("location");

-- CreateIndex
CREATE INDEX "idx_servers_status" ON "public"."servers"("status");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "public"."user_audit_log"("action");

-- CreateIndex
CREATE INDEX "idx_audit_created_at" ON "public"."user_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_performed_by" ON "public"."user_audit_log"("performed_by");

-- CreateIndex
CREATE INDEX "idx_audit_user_id" ON "public"."user_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_balance_history_date" ON "public"."user_balance_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_user_balance_history_type" ON "public"."user_balance_history"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_user_balance_history_user" ON "public"."user_balance_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_permissions_granted" ON "public"."user_permissions"("granted");

-- CreateIndex
CREATE INDEX "idx_user_permissions_permission_id" ON "public"."user_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "public"."user_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_lookup" ON "public"."user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_role" ON "public"."user_roles"("role_id");

-- CreateIndex
CREATE INDEX "idx_user_roles_user" ON "public"."user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "public"."user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "idx_voucher_attempts_status" ON "public"."voucher_redemption_attempts"("attempt_status");

-- CreateIndex
CREATE INDEX "idx_voucher_attempts_user" ON "public"."voucher_redemption_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_voucher_usage_user_id" ON "public"."voucher_usage"("user_id");

-- CreateIndex
CREATE INDEX "idx_voucher_usage_user_voucher" ON "public"."voucher_usage"("user_id", "voucher_id");

-- CreateIndex
CREATE INDEX "idx_voucher_usage_voucher_id" ON "public"."voucher_usage"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_voucher_usage" ON "public"."voucher_usage"("voucher_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_instances" ADD CONSTRAINT "whatsapp_instances_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "public"."whatsapp_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."whatsapp_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_instanceId_chatId_fkey" FOREIGN KEY ("instanceId", "chatId") REFERENCES "public"."chats"("instanceId", "chatId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."whatsapp_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_files" ADD CONSTRAINT "media_files_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_packages" ADD CONSTRAINT "customer_packages_createdby_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."customer_packages" ADD CONSTRAINT "customer_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "fk_transactions_created_by" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bizpoints_transactions" ADD CONSTRAINT "bizpoints_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."bizpoints_transactions" ADD CONSTRAINT "bizpoints_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."api_logs" ADD CONSTRAINT "api_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_queue" ADD CONSTRAINT "message_queue_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "public"."whatsapp_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_group_members" ADD CONSTRAINT "contact_group_members_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_group_members" ADD CONSTRAINT "contact_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."contact_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dealer_customers" ADD CONSTRAINT "dealer_customers_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dealer_customers" ADD CONSTRAINT "dealer_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."dealer_customers" ADD CONSTRAINT "dealer_customers_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ip_restrictions" ADD CONSTRAINT "ip_restrictions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ip_restrictions" ADD CONSTRAINT "ip_restrictions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ip_restrictions" ADD CONSTRAINT "ip_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."permission_templates" ADD CONSTRAINT "permission_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."servers" ADD CONSTRAINT "servers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_audit_log" ADD CONSTRAINT "user_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
