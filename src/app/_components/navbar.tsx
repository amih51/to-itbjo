"use client";

import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { useSession } from "next-auth/react";
import AuthDialog from "./auth-dialog";
import { GoFile, GoVideo } from "react-icons/go";
import { GrScorecard } from "react-icons/gr";
import React from "react";

const soal: { title: string; href: string }[] = [
  {
    title: "Kemampuan Penalaran Umum",
    href: "/drill/pu",
  },
  {
    title: "Pengetahuan dan Pemahaman Umum",
    href: "/drill/ppu",
  },
  {
    title: "Kemampuan Memahami Bacaan dan Menulis",
    href: "/drill/pbm",
  },
  {
    title: "Pengetahuan Kuantitatif",
    href: "/drill/pk",
  },
  {
    title: "Literasi Bahasa Indonesia dan Bahasa Inggris",
    href: "/drill/lb",
  },
  {
    title: "Penalaran Matematika",
    href: "/drill/pm",
  },
];

const menu: { title: string; href: string; logo: JSX.Element }[] = [
  {
    title: "File",
    href: "/file",
    logo: <GoFile />,
  },
  {
    title: "Video",
    href: "/video",
    logo: <GoVideo />,
  },
  {
    title: "My Scores",
    href: "/my-scores",
    logo: <GrScorecard />,
  },
];

export default function Navbar() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <div className="sticky left-0 top-0 z-50 flex h-10 w-screen items-center justify-center gap-3 bg-background py-6 shadow-lg scrollbar scrollbar-none">
      <Link href={"/"}>
        <Image
          src={"/logo.png"}
          alt={"logo nerolusi"}
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
          {user?.classid && (
            <NavigationMenuItem>
              <NavigationMenuTrigger>Drill</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 lg:w-[600px] lg:grid-cols-2">
                  {soal.map((e) => (
                    <ListItem
                      key={e.title}
                      title={e.title}
                      href={e.href}
                    ></ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                className={`grid w-[240px] gap-3 p-4 ${user?.classid && "lg:w-[600px] lg:grid-cols-2"}`}
              >
                {user?.classid &&
                  menu.map((e) => (
                    <ListItem
                      key={e.title}
                      title={e.title}
                      href={e.href}
                      className="flex gap-2"
                    >
                      {e.logo}
                    </ListItem>
                  ))}
                <AuthDialog />
                {user?.role === "admin" && (
                  <Link
                    href={"/user"}
                    className="flex justify-center rounded-lg border p-2"
                  >
                    Manajemen Akun
                  </Link>
                )}
                {user?.role !== "user" && (
                  <Link
                    href={"/packageManagement"}
                    className="flex justify-center rounded-lg border p-2"
                  >
                    Manajemen Soal
                  </Link>
                )}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "flex size-full select-none items-center justify-center gap-1 rounded-md border p-3 text-center leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          {children}
          <div className="text-sm font-medium leading-none">{title}</div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
