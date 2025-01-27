import type { Metadata } from "next";
import "~/styles/globals.css";
import "@uploadthing/react/styles.css";
import { TRPCReactProvider } from "~/trpc/react";
import { SessionProvider } from "next-auth/react";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { ourFileRouter } from "~/app/api/uploadthing/core";
import { Toaster } from "./_components/ui/sonner";

export const metadata: Metadata = {
  title: "Nerolusi",
  description: "Nerolusi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            {children}
            <Toaster />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
