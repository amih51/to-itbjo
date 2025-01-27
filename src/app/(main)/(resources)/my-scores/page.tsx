"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "~/app/_components/ui/button";
import { Separator } from "~/app/_components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/app/_components/ui/tabs";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import { api } from "~/trpc/react";

export default function MyScoresPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    data: packagesDrill,
    isLoading: isLoadingDrill,
    isError: isErrorDrill,
  } = api.quiz.getDrill.useQuery();
  const {
    data: packagesTryout,
    isLoading: isLoaddingTryout,
    isError: isErrorTryout,
  } = api.quiz.getTryout.useQuery();

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

  return isErrorDrill || isErrorTryout ? (
    <ErrorPage />
  ) : isLoadingDrill || isLoaddingTryout ? (
    <LoadingPage />
  ) : (
    <div className="mx-auto flex flex-col gap-4 rounded-lg border lg:w-3/5">
      <Tabs defaultValue="try-out" className="w-full">
        <TabsList className="grid w-full grid-cols-2 border-b">
          <TabsTrigger value="try-out">Try Outs</TabsTrigger>
          <TabsTrigger value="drilling">Drilling</TabsTrigger>
        </TabsList>
        <TabsContent value="try-out" className="min-h-[80vh] w-full px-5 py-1">
          <ul className="grid w-full gap-4">
            {packagesTryout.map((result) => (
              <li
                key={result.id}
                className="flex w-full overflow-auto rounded-lg border"
              >
                <div className="rounded-lg border-r">
                  <div className="flex justify-center border-b p-1">
                    {result.name}
                  </div>
                  <div className="flex h-28 w-36 items-center justify-center border-b text-5xl font-bold">
                    {result.score}
                  </div>
                  <div className="flex justify-center p-1">
                    Benar {result.correct}/{result.all}
                  </div>
                </div>
                <ul className="m-3 h-[153px] w-full overflow-auto rounded-lg border px-2 py-1">
                  <div className="flex size-full flex-col gap-2 overflow-auto p-1 scrollbar scrollbar-thumb-current scrollbar-w-1 hover:scrollbar-thumb-foreground/50">
                    {result.subtest.map((subtest) => (
                      <Button
                        key={subtest.id}
                        variant="ghost"
                        onClick={() =>
                          router.push(
                            `/tryout/${result.id}/${subtest.sessionId}`,
                          )
                        }
                        disabled={!subtest.score}
                        className="m-0 flex w-full rounded-lg border px-3 py-1 text-left text-sm"
                      >
                        <div className="w-full truncate font-semibold">
                          {(() => {
                            switch (subtest.name) {
                              case "pu":
                                return "Kemampuan Penalaran Umum";
                              case "ppu":
                                return "Pengetahuan dan Pemahaman Umum";
                              case "pbm":
                                return "Kemampuan Memahami Bacaan dan Menulis";
                              case "pk":
                                return "Pengetahuan Kuantitatif";
                              case "lb":
                                return "Literasi Bahasa Indonesia dan Bahasa Inggris";
                              case "pm":
                                return "Penalaran Matematika";
                              default:
                                return subtest.name;
                            }
                          })()}
                        </div>
                        <div
                          className={`flex gap-2 ${!subtest.score && "hidden"} `}
                        >
                          <Separator
                            orientation="vertical"
                            className="border"
                          />
                          <div className={`flex min-w-12 justify-center`}>
                            {subtest.correct}/{subtest.all}
                          </div>
                          <Separator
                            orientation="vertical"
                            className="border"
                          />
                          <div
                            className={`flex min-w-12 justify-center rounded-lg border bg-green-500 font-bold`}
                          >
                            {subtest.score}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ul>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="drilling" className="min-h-[80vh] px-5 py-1">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex flex-col gap-5">
              {packagesDrill.map((pkg) => (
                <Button
                  key={pkg.id}
                  variant="ghost"
                  onClick={() =>
                    router.push(
                      `/drill/${pkg.type}/${pkg.package.id}/${pkg.sessionId}`,
                    )
                  }
                  className={`flex min-h-32 min-w-72 flex-col items-center justify-center rounded-lg border text-2xl font-bold ${pkg.sessionId ? "bg-green-500 hover:bg-green-600" : "bg-slate-200"}`}
                >
                  <div>{pkg.package.name}</div>
                  <div className={`${!pkg.sessionId && "hidden"}`}>
                    {pkg._count.correct}/{pkg._count.questions}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
