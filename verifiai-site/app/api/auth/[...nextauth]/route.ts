import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Export NextAuth route handlers for App Router
const handler = NextAuth({
  providers: [
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
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }
      if (profile && typeof profile === "object") {
        const p: any = profile;
        if (p.avatar_url) token.picture = p.avatar_url;
        if (p.picture) token.picture = p.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).provider = (token as any).provider;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  cookies: {
    // Let NextAuth pick sensible defaults; no changes needed
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
