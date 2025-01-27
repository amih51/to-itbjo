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
import React from "react";

const soals: { title: string; href: string; description: string }[] = [
  {
    title: "Kemampuan Penalaran Umum",
    href: "/drill/pu",
    description:
      "Mengukur kemampuan berpikir logis, analitis, dan sistematis dalam menyelesaikan masalah.",
  },
  {
    title: "Pengetahuan dan Pemahaman Umum",
    href: "/drill/ppu",
    description:
      "Menilai wawasan dan pengetahuan umum serta pemahaman mengenai berbagai isu terkini.",
  },
  {
    title: "Kemampuan Memahami Bacaan dan Menulis",
    href: "/drill/pbm",
    description:
      "Mengukur kemampuan dalam memahami teks bacaan dan menyusun tulisan dengan baik dan benar.",
  },
  {
    title: "Pengetahuan Kuantitatif",
    href: "/drill/pk",
    description:
      "Menilai kemampuan mengaplikasikan konsep matematika dasar dalam kehidupan sehari-hari.",
  },
  {
    title: "Literasi Bahasa Indonesia dan Bahasa Inggris",
    href: "/drill/lb",
    description:
      "Mengukur kemampuan memahami teks dan konteks dalam Bahasa Indonesia dan Bahasa Inggris.",
  },
  {
    title: "Penalaran Matematika",
    href: "/drill/pm",
    description:
      "Mengukur kemampuan penalaran matematis dalam menyelesaikan masalah yang lebih kompleks.",
  },
];

export default function Navbar() {
  const session = useSession();
  const user = session.data?.user;

  return (
    <div className="sticky left-0 top-0 z-50 flex h-10 w-screen items-center justify-center gap-3 bg-background py-6 scrollbar scrollbar-none">
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
            <NavigationMenuTrigger>Drill</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {soals.map((soal) => (
                  <ListItem
                    key={soal.title}
                    title={soal.title}
                    href={soal.href}
                  >
                    {soal.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/tryout" legacyBehavior passHref>
              <Button variant={"ghost"}>Try Out</Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/video" legacyBehavior passHref>
              <Button variant={"ghost"} className="flex gap-2">
                <GoVideo />
                <div className="hidden md:block">Video</div>
              </Button>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/file" legacyBehavior passHref>
              <Button variant={"ghost"} className="flex gap-2">
                <GoFile />
                <div className="hidden md:block">File</div>
              </Button>
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
