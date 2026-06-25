import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MEMBERSHIP } from "@/lib/auth/roles";

export const FEATURE_MEMBERSHIP_TYPE: Record<string, number> = {
  pickup_game: MEMBERSHIP.PICKUP_HOST,
  team_create: MEMBERSHIP.TEAM_LEADER,
  tournament_create: MEMBERSHIP.TOURNAMENT_ADMIN,
};

type MembershipDb = Pick<typeof prisma, "user" | "user_subscriptions">;

export function membershipTypeForFeatureKey(featureKey: string): number {
  return FEATURE_MEMBERSHIP_TYPE[featureKey] ?? MEMBERSHIP.FREE;
}

export function usableSubscriptionWhere(
  now = new Date()
): Prisma.user_subscriptionsWhereInput {
  return {
    OR: [
      {
        status: "active",
        OR: [{ expires_at: null }, { expires_at: { gte: now } }],
      },
      {
        status: "cancelled",
        expires_at: { gte: now },
      },
    ],
  };
}

export async function getUserMembershipSnapshot(
  userId: bigint,
  db: MembershipDb = prisma,
  now = new Date()
) {
  const subscriptions = await db.user_subscriptions.findMany({
    where: {
      user_id: userId,
      ...usableSubscriptionWhere(now),
    },
    select: {
      feature_key: true,
      started_at: true,
      expires_at: true,
    },
  });

  const membershipType = subscriptions.reduce<number>(
    (max, sub) => Math.max(max, membershipTypeForFeatureKey(sub.feature_key)),
    MEMBERSHIP.FREE
  );
  const startedAt =
    subscriptions.length > 0
      ? subscriptions.reduce<Date | null>(
          (min, sub) =>
            !min || sub.started_at.getTime() < min.getTime()
              ? sub.started_at
              : min,
          null
        )
      : null;
  const hasNoExpiry = subscriptions.some((sub) => sub.expires_at === null);
  const expiresAt =
    subscriptions.length === 0 || hasNoExpiry
      ? null
      : subscriptions.reduce<Date | null>(
          (max, sub) =>
            sub.expires_at && (!max || sub.expires_at.getTime() > max.getTime())
              ? sub.expires_at
              : max,
          null
        );

  return {
    membershipType,
    subscriptionStatus: subscriptions.length > 0 ? "active" : "inactive",
    subscriptionStartedAt: startedAt,
    subscriptionExpiresAt: expiresAt,
    activeFeatureKeys: Array.from(
      new Set(subscriptions.map((sub) => sub.feature_key))
    ),
  };
}

export async function syncUserMembershipFromSubscriptions(
  userId: bigint,
  db: MembershipDb = prisma,
  opts: { allowDowngradeTrackedMembership?: boolean } = {}
) {
  const [user, snapshot] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        membershipType: true,
        subscription_expires_at: true,
      },
    }),
    getUserMembershipSnapshot(userId, db),
  ]);

  if (!user) return null;

  let nextMembershipType = Math.max(
    user.membershipType,
    snapshot.membershipType
  );

  if (
    opts.allowDowngradeTrackedMembership &&
    user.subscription_expires_at !== null &&
    snapshot.membershipType < user.membershipType
  ) {
    nextMembershipType = snapshot.membershipType;
  }

  return db.user.update({
    where: { id: userId },
    data: {
      membershipType: nextMembershipType,
      subscription_status: snapshot.subscriptionStatus,
      subscription_started_at: snapshot.subscriptionStartedAt,
      subscription_expires_at: snapshot.subscriptionExpiresAt,
    },
    select: {
      membershipType: true,
      subscription_status: true,
      subscription_started_at: true,
      subscription_expires_at: true,
    },
  });
}
