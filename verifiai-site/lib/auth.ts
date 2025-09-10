import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";

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
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        (token as any).provider = account.provider;
      }
      if (profile && typeof profile === "object") {
        const p: any = profile;
        if (p.avatar_url) (token as any).picture = p.avatar_url;
        if (p.picture) (token as any).picture = p.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).provider = (token as any).provider;
        if ((token as any).picture) session.user.image = (token as any).picture as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
