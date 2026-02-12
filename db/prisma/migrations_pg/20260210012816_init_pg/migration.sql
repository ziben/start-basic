-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ResourceScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'BOTH');

-- CreateEnum
CREATE TYPE "SidebarScope" AS ENUM ('APP', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WECHAT_JSAPI', 'WECHAT_NATIVE', 'WECHAT_H5', 'ALIPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ZcReadingType" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateEnum
CREATE TYPE "ZcReadingStatus" AS ENUM ('COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ZcAiStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CACHED');

-- CreateEnum
CREATE TYPE "ZcPointsType" AS ENUM ('RECHARGE', 'SHARE_RETURN', 'CONSUME', 'ADMIN_GRANT', 'ADMIN_DEDUCT');

-- CreateEnum
CREATE TYPE "ZcBalanceType" AS ENUM ('RECHARGE', 'REBATE', 'CONSUME', 'WITHDRAW', 'ADMIN_GRANT', 'ADMIN_DEDUCT');

-- CreateEnum
CREATE TYPE "ZcReferralStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ZcShareChannel" AS ENUM ('WECHAT_H5', 'NATIVE_SHARE', 'COPY');

-- CreateEnum
CREATE TYPE "ZcVisitorType" AS ENUM ('OPENID', 'UNIONID', 'FINGERPRINT');

-- CreateEnum
CREATE TYPE "ZcRebateStatus" AS ENUM ('PENDING', 'AVAILABLE', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ZcWithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    "activeOrganizationId" TEXT,
    "activeTeamId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "metadata" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),

    CONSTRAINT "teamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "organizationRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "teamId" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "templateRoleId" TEXT,
    "permission" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "organizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_role_permissions" (
    "id" TEXT NOT NULL,
    "organizationRoleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ORG',
    "customScope" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "scope" "ResourceScope" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "dataScope" TEXT NOT NULL DEFAULT 'ALL',
    "customScope" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "timeRanges" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_permissions" (
    "id" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_org_access" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "sourceOrgId" TEXT NOT NULL,
    "targetOrgId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "sourceDeptId" TEXT,
    "targetDeptId" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_org_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "leader" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nav_group" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" "SidebarScope" NOT NULL DEFAULT 'APP',
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nav_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nav_item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "icon" TEXT,
    "badge" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isCollapsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "navGroupId" TEXT,
    "parentId" TEXT,

    CONSTRAINT "nav_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_nav_group" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_nav_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_nav_group" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "navGroupId" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_nav_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL DEFAULT 'info',
    "requestId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" TEXT,
    "status" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "userRole" TEXT,
    "error" TEXT,
    "meta" JSONB,

    CONSTRAINT "system_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "meta" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outTradeNo" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_user_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 2,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "withdrawableBalance" INTEGER NOT NULL DEFAULT 0,
    "totalRebate" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_reading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "readingType" "ZcReadingType" NOT NULL,
    "cards" JSONB NOT NULL,
    "directMeaning" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT true,
    "unlockMethod" TEXT,
    "unlockedAt" TIMESTAMP(3),
    "price" INTEGER NOT NULL DEFAULT 0,
    "pointsCost" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT,
    "aiRequested" BOOLEAN NOT NULL DEFAULT false,
    "aiStatus" "ZcAiStatus",
    "aiConclusion" TEXT,
    "aiRequestedAt" TIMESTAMP(3),
    "aiCompletedAt" TIMESTAMP(3),
    "aiError" TEXT,
    "status" "ZcReadingStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_points_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "type" "ZcPointsType" NOT NULL,
    "description" TEXT NOT NULL,
    "relatedId" TEXT,
    "dayKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zc_points_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_balance_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "type" "ZcBalanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zc_balance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "status" "ZcReferralStatus" NOT NULL DEFAULT 'ACTIVE',
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_share_link" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_share_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_share_return" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "visitorType" "ZcVisitorType" NOT NULL,
    "dayKey" TEXT NOT NULL,
    "credited" BOOLEAN NOT NULL DEFAULT false,
    "creditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zc_share_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_share_action" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "channel" "ZcShareChannel" NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zc_share_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_rebate_ledger" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderAmount" INTEGER NOT NULL,
    "rebateAmount" INTEGER NOT NULL,
    "status" "ZcRebateStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_rebate_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_withdraw_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ZcWithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "auditBy" TEXT,
    "auditNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_withdraw_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_tarot_card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "suit" TEXT NOT NULL,
    "number" INTEGER,
    "meaning" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_tarot_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_ai_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "conclusion" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zc_ai_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zc_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "zc_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "teamMember_teamId_idx" ON "teamMember"("teamId");

-- CreateIndex
CREATE INDEX "teamMember_userId_idx" ON "teamMember"("userId");

-- CreateIndex
CREATE INDEX "member_organizationRoleId_idx" ON "member"("organizationRoleId");

-- CreateIndex
CREATE INDEX "organizationRole_organizationId_idx" ON "organizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "organizationRole_role_idx" ON "organizationRole"("role");

-- CreateIndex
CREATE INDEX "organizationRole_templateRoleId_idx" ON "organizationRole"("templateRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "organizationRole_organizationId_role_key" ON "organizationRole"("organizationId", "role");

-- CreateIndex
CREATE INDEX "organization_role_permissions_organizationRoleId_idx" ON "organization_role_permissions"("organizationRoleId");

-- CreateIndex
CREATE INDEX "organization_role_permissions_permissionId_idx" ON "organization_role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_role_permissions_organizationRoleId_permission_key" ON "organization_role_permissions"("organizationRoleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_scope_idx" ON "roles"("scope");

-- CreateIndex
CREATE INDEX "roles_isSystem_idx" ON "roles"("isSystem");

-- CreateIndex
CREATE INDEX "roles_isTemplate_idx" ON "roles"("isTemplate");

-- CreateIndex
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex
CREATE INDEX "roles_sortOrder_idx" ON "roles"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "resources_name_key" ON "resources"("name");

-- CreateIndex
CREATE INDEX "resources_scope_idx" ON "resources"("scope");

-- CreateIndex
CREATE INDEX "resources_isSystem_idx" ON "resources"("isSystem");

-- CreateIndex
CREATE INDEX "actions_resourceId_idx" ON "actions"("resourceId");

-- CreateIndex
CREATE INDEX "actions_isSystem_idx" ON "actions"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "actions_resourceId_name_key" ON "actions"("resourceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resourceId_idx" ON "permissions"("resourceId");

-- CreateIndex
CREATE INDEX "permissions_actionId_idx" ON "permissions"("actionId");

-- CreateIndex
CREATE INDEX "permissions_isSystem_idx" ON "permissions"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resourceId_actionId_key" ON "permissions"("resourceId", "actionId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "field_permissions_resource_field_idx" ON "field_permissions"("resource", "field");

-- CreateIndex
CREATE UNIQUE INDEX "field_permissions_permissionId_resource_field_key" ON "field_permissions"("permissionId", "resource", "field");

-- CreateIndex
CREATE INDEX "cross_org_access_role_idx" ON "cross_org_access"("role");

-- CreateIndex
CREATE UNIQUE INDEX "cross_org_access_role_sourceOrgId_targetOrgId_resource_key" ON "cross_org_access"("role", "sourceOrgId", "targetOrgId", "resource");

-- CreateIndex
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organizationId_code_key" ON "departments"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "role_nav_group_roleName_navGroupId_key" ON "role_nav_group"("roleName", "navGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_nav_group_userId_navGroupId_key" ON "user_role_nav_group"("userId", "navGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "translation_locale_key_key" ON "translation"("locale", "key");

-- CreateIndex
CREATE INDEX "system_log_createdAt_idx" ON "system_log"("createdAt");

-- CreateIndex
CREATE INDEX "system_log_method_path_idx" ON "system_log"("method", "path");

-- CreateIndex
CREATE INDEX "system_log_userId_idx" ON "system_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_idx" ON "audit_log"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_log_targetType_targetId_idx" ON "audit_log"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_outTradeNo_key" ON "payment_order"("outTradeNo");

-- CreateIndex
CREATE INDEX "payment_order_userId_idx" ON "payment_order"("userId");

-- CreateIndex
CREATE INDEX "payment_order_status_idx" ON "payment_order"("status");

-- CreateIndex
CREATE INDEX "payment_order_createdAt_idx" ON "payment_order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "zc_user_profile_userId_key" ON "zc_user_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "zc_user_profile_referralCode_key" ON "zc_user_profile"("referralCode");

-- CreateIndex
CREATE INDEX "zc_user_profile_userId_idx" ON "zc_user_profile"("userId");

-- CreateIndex
CREATE INDEX "zc_user_profile_referralCode_idx" ON "zc_user_profile"("referralCode");

-- CreateIndex
CREATE INDEX "zc_reading_userId_idx" ON "zc_reading"("userId");

-- CreateIndex
CREATE INDEX "zc_reading_createdAt_idx" ON "zc_reading"("createdAt");

-- CreateIndex
CREATE INDEX "zc_reading_status_idx" ON "zc_reading"("status");

-- CreateIndex
CREATE INDEX "zc_reading_locked_idx" ON "zc_reading"("locked");

-- CreateIndex
CREATE INDEX "zc_reading_aiStatus_idx" ON "zc_reading"("aiStatus");

-- CreateIndex
CREATE INDEX "zc_reading_aiRequested_idx" ON "zc_reading"("aiRequested");

-- CreateIndex
CREATE INDEX "zc_points_history_userId_idx" ON "zc_points_history"("userId");

-- CreateIndex
CREATE INDEX "zc_points_history_createdAt_idx" ON "zc_points_history"("createdAt");

-- CreateIndex
CREATE INDEX "zc_points_history_type_idx" ON "zc_points_history"("type");

-- CreateIndex
CREATE INDEX "zc_points_history_dayKey_idx" ON "zc_points_history"("dayKey");

-- CreateIndex
CREATE INDEX "zc_balance_history_userId_idx" ON "zc_balance_history"("userId");

-- CreateIndex
CREATE INDEX "zc_balance_history_createdAt_idx" ON "zc_balance_history"("createdAt");

-- CreateIndex
CREATE INDEX "zc_balance_history_type_idx" ON "zc_balance_history"("type");

-- CreateIndex
CREATE UNIQUE INDEX "zc_referral_referredUserId_key" ON "zc_referral"("referredUserId");

-- CreateIndex
CREATE INDEX "zc_referral_referrerId_idx" ON "zc_referral"("referrerId");

-- CreateIndex
CREATE INDEX "zc_referral_referredUserId_idx" ON "zc_referral"("referredUserId");

-- CreateIndex
CREATE INDEX "zc_referral_status_idx" ON "zc_referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "zc_share_link_code_key" ON "zc_share_link"("code");

-- CreateIndex
CREATE INDEX "zc_share_link_userId_idx" ON "zc_share_link"("userId");

-- CreateIndex
CREATE INDEX "zc_share_link_code_idx" ON "zc_share_link"("code");

-- CreateIndex
CREATE INDEX "zc_share_return_shareCode_idx" ON "zc_share_return"("shareCode");

-- CreateIndex
CREATE INDEX "zc_share_return_dayKey_idx" ON "zc_share_return"("dayKey");

-- CreateIndex
CREATE INDEX "zc_share_return_credited_idx" ON "zc_share_return"("credited");

-- CreateIndex
CREATE UNIQUE INDEX "zc_share_return_shareCode_visitorId_dayKey_key" ON "zc_share_return"("shareCode", "visitorId", "dayKey");

-- CreateIndex
CREATE INDEX "zc_share_action_shareCode_idx" ON "zc_share_action"("shareCode");

-- CreateIndex
CREATE INDEX "zc_share_action_channel_idx" ON "zc_share_action"("channel");

-- CreateIndex
CREATE INDEX "zc_share_action_createdAt_idx" ON "zc_share_action"("createdAt");

-- CreateIndex
CREATE INDEX "zc_rebate_ledger_referrerId_idx" ON "zc_rebate_ledger"("referrerId");

-- CreateIndex
CREATE INDEX "zc_rebate_ledger_referredUserId_idx" ON "zc_rebate_ledger"("referredUserId");

-- CreateIndex
CREATE INDEX "zc_rebate_ledger_orderId_idx" ON "zc_rebate_ledger"("orderId");

-- CreateIndex
CREATE INDEX "zc_rebate_ledger_status_idx" ON "zc_rebate_ledger"("status");

-- CreateIndex
CREATE INDEX "zc_rebate_ledger_availableAt_idx" ON "zc_rebate_ledger"("availableAt");

-- CreateIndex
CREATE INDEX "zc_withdraw_request_userId_idx" ON "zc_withdraw_request"("userId");

-- CreateIndex
CREATE INDEX "zc_withdraw_request_status_idx" ON "zc_withdraw_request"("status");

-- CreateIndex
CREATE INDEX "zc_withdraw_request_requestedAt_idx" ON "zc_withdraw_request"("requestedAt");

-- CreateIndex
CREATE INDEX "zc_tarot_card_suit_idx" ON "zc_tarot_card"("suit");

-- CreateIndex
CREATE INDEX "zc_tarot_card_isActive_idx" ON "zc_tarot_card"("isActive");

-- CreateIndex
CREATE INDEX "zc_tarot_card_sortOrder_idx" ON "zc_tarot_card"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "zc_ai_cache_cacheKey_key" ON "zc_ai_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "zc_ai_cache_cacheKey_idx" ON "zc_ai_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "zc_ai_cache_expiresAt_idx" ON "zc_ai_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "zc_config_key_key" ON "zc_config"("key");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamMember" ADD CONSTRAINT "teamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "organizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationRole" ADD CONSTRAINT "organizationRole_templateRoleId_fkey" FOREIGN KEY ("templateRoleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_permissions" ADD CONSTRAINT "organization_role_permissions_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "organizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_role_permissions" ADD CONSTRAINT "organization_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_permissions" ADD CONSTRAINT "field_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nav_item" ADD CONSTRAINT "nav_item_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nav_item" ADD CONSTRAINT "nav_item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "nav_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_nav_group" ADD CONSTRAINT "role_nav_group_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "roles"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_nav_group" ADD CONSTRAINT "role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_nav_group" ADD CONSTRAINT "user_role_nav_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_nav_group" ADD CONSTRAINT "user_role_nav_group_navGroupId_fkey" FOREIGN KEY ("navGroupId") REFERENCES "nav_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_log" ADD CONSTRAINT "system_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_reading" ADD CONSTRAINT "zc_reading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_points_history" ADD CONSTRAINT "zc_points_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_balance_history" ADD CONSTRAINT "zc_balance_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_referral" ADD CONSTRAINT "zc_referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_referral" ADD CONSTRAINT "zc_referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_share_link" ADD CONSTRAINT "zc_share_link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_share_return" ADD CONSTRAINT "zc_share_return_shareCode_fkey" FOREIGN KEY ("shareCode") REFERENCES "zc_share_link"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_share_action" ADD CONSTRAINT "zc_share_action_shareCode_fkey" FOREIGN KEY ("shareCode") REFERENCES "zc_share_link"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_rebate_ledger" ADD CONSTRAINT "zc_rebate_ledger_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_rebate_ledger" ADD CONSTRAINT "zc_rebate_ledger_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zc_withdraw_request" ADD CONSTRAINT "zc_withdraw_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zc_user_profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
