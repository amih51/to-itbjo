import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      classid?: number;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [Google],
  adapter: PrismaAdapter(db),
  events: {
    async createUser({ user }) {
      if (user.email === "nerolusi3@gmail.com") {
        await db.user.update({
          where: { email: user.email },
          data: { role: "admin" },
        });
      }
    },
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
