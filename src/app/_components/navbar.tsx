"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import AuthDialog from "./auth-dialog";
import React from "react";

export default function Navbar() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <div className="sticky left-0 top-0 z-50 flex h-10 w-screen items-center justify-center gap-3 bg-background py-6 scrollbar scrollbar-none">
      <Link href={"/"}>
        <Image
          src={"/logo.png"}
          alt={"logo gijo"}
          width={"36"}
          height={"36"}
        ></Image>
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/tryout" legacyBehavior passHref>
              <Button variant={"ghost"}>Try Out</Button>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {user?.role === "admin" && (
        <Button variant={"outline"} asChild>
          <Link href={"/user"}>Manajemen Akun</Link>
        </Button>
      )}
      {user?.role !== "user" && (
        <Button variant={"outline"} asChild>
          <Link href={"/packageManagement"}>Manajemen Soal</Link>
        </Button>
      )}
      <AuthDialog />
    </div>
  );
}
