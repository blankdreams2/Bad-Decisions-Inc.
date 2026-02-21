export function missingEnvVariableUrl(envVarName: string, whereToGet: string) {
  const deployment = deploymentName();
  if (!deployment) return `Missing ${envVarName} in environment variables.`;
  return (
    `\n  Missing ${envVarName} in environment variables.\n\n` +
    `  Get it from ${whereToGet} .\n  Paste it on the Convex dashboard:\n` +
    `  https://dashboard.convex.dev/d/${deployment}/settings?var=${envVarName}`
  );
}

export function deploymentName() {
  const url = process.env.CONVEX_CLOUD_URL;
  if (!url) return undefined;
  const regex = new RegExp("https://(.+).convex.cloud");
  return regex.exec(url)?.[1];
}

export type ConvexAuthCtx = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

export async function getUserId(ctx: ConvexAuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

export async function requireUserId(ctx: ConvexAuthCtx) {
  const userId = await getUserId(ctx);
  if (!userId) {
    throw new Error(
      "Not authenticated. Check Clerk JWT template 'convex' and Convex env var CLERK_ISSUER_URL.",
    );
  }
  return userId;
}

export async function getRoomByCode(ctx: { db: any }, code: string) {
  const normalized = code.toUpperCase();
  return await ctx.db
    .query("rooms")
    .withIndex("by_code", (q: any) => q.eq("code", normalized))
    .unique();
}
