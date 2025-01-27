"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "~/app/_components/ui/button";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import { api } from "~/trpc/react";

export default function TryoutListPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session || !session.user) {
    return <LoadingPage />;
  }

  const classId = session.user.classid;

  if (!classId) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">
          You are not enrolled in any class
        </h1>
        <p className="mt-2">
          Please contact your administrator to assign you to a class.
        </p>
      </div>
    );
  }

  const {
    data: packages,
    isLoading,
    isError,
  } = api.package.getTryoutPackages.useQuery({ classId });

  return isError ? (
    <ErrorPage />
  ) : isLoading ? (
    <LoadingPage />
  ) : (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Tryout List</h1>
      <p>Select a tryout package to start</p>
      <div className="flex flex-col gap-4">
        {packages?.map((pkg) => (
          <Button
            key={pkg.id}
            variant="ghost"
            onClick={() => {
              router.push(`/tryout/${pkg.id}`);
            }}
            className="flex size-fit min-h-32 w-full min-w-72 flex-col border bg-slate-300 p-3"
          >
            <h3 className="text-2xl font-bold">{pkg.name}</h3>
            {pkg.TOstart && (
              <p
                className={`${new Date(pkg.TOend) < new Date() ? "hidden" : ""}`}
              >
                Start Date: {pkg.TOstart.toLocaleString()}
              </p>
            )}
            {pkg.TOend && (
              <p
                className={`${new Date(pkg.TOend) < new Date() ? "hidden" : ""}`}
              >
                End Date: {pkg.TOend.toLocaleString()}
              </p>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
