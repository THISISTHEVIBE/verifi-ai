import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

const providers: any[] = [
  GitHub({
    clientId: process.env.GITHUB_ID || "",
    clientSecret: process.env.GITHUB_SECRET || "",
    allowDangerousEmailAccountLinking: true,
  }),
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    allowDangerousEmailAccountLinking: true,
  }),
];

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers,
  session: { strategy: "database" },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create default org on first login
      if (user.id && account) {
        try {
          // Check if user already has an org membership
          const existingMembership = await db.orgMembership.findFirst({
            where: { userId: user.id },
          });

          if (!existingMembership) {
            // Create a default org for the user
            const orgName = user.name ? `${user.name}'s Organization` : `${user.email}'s Organization`;
            const orgSlug = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default-org';
            
            const org = await db.org.create({
              data: {
                name: orgName,
                slug: `${orgSlug}-${Date.now()}`, // Add timestamp to ensure uniqueness
              },
            });

            // Create org membership with OWNER role
            await db.orgMembership.create({
              data: {
                userId: user.id,
                orgId: org.id,
                role: "OWNER",
              },
            });
          }
        } catch (error) {
          console.error("Error creating default org:", error);
          // Don't block sign-in if org creation fails
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        // Extend session with user ID
        (session.user as any).id = user.id;
        
        // Note: Org memberships are fetched separately in auth-utils.ts
        // to avoid database calls on every session check
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
