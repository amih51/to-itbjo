"use client";

import { Separator } from "@radix-ui/react-separator";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/app/_components/ui/button";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import { api } from "~/trpc/react";

export default function QuizPage() {
  const { packageId } = useParams();
  const startSessionMutation = api.quiz.createSession.useMutation();
  const getSessionMutation = api.quiz.getSession.useMutation();
  const router = useRouter();
  const session = useSession();

  const {
    data: packageData,
    isLoading,
    isError,
  } = api.quiz.getPackageWithSubtest.useQuery({ id: Number(packageId) });

  return isError ? (
    <ErrorPage />
  ) : isLoading ? (
    <LoadingPage />
  ) : (
    <div className="mx-auto flex flex-col gap-4 p-4 lg:w-3/5">
      <div className="flex flex-col items-center gap-2 p-4">
        <h1 className="mb-4 text-xl font-bold">{packageData.name}</h1>
        {new Date(packageData.TOend) < new Date() && (
          <h2 className="mb-4 text-lg font-semibold">
            Score: {packageData.totalScore / packageData.subtests.length}
          </h2>
        )}
        {/* <p>Start Time: {new Date(packageData.TOstart).toLocaleString()}</p>
        <p>End Time: {new Date(packageData.TOend).toLocaleString()}</p> */}
      </div>
      <div className="flex flex-wrap gap-4">
        {packageData.subtests?.map((subtest) => (
          <Button
            key={subtest.id}
            onClick={() => handleSubtestClick(subtest.id, subtest.duration)}
            variant="ghost"
            className={`w-full justify-start border px-7 font-bold ${subtest.quizSession && "bg-green-600 hover:bg-green-700"}`}
            disabled={
              (subtest.quizSession &&
                new Date(subtest?.quizSession) < new Date() &&
                new Date(packageData.TOend) >= new Date()) ||
              (new Date(packageData.TOend) < new Date() &&
                !subtest.quizSession) ||
              new Date(packageData.TOstart) > new Date()
            }
          >
            <div className="w-full truncate text-left">
              {(() => {
                switch (subtest.type) {
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
                    return subtest.type;
                }
              })()}
            </div>
            <div className={`flex gap-5 ${!subtest.score && "hidden"} `}>
              <Separator orientation="vertical" className="border" />
              <div className={`min-w-12`}>
                {subtest.totalCorrect}/{subtest.totalQuestion}
              </div>
              <Separator orientation="vertical" className="border" />
              <div className={`min-w-12 rounded-lg border`}>
                {subtest.score}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );

  async function handleSubtestClick(subtestId: number, duration: number) {
    if (!session.data || !session.data.user) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }

    const userId = session.data.user.id;
    const packageIdInt = Number(packageId);

    try {
      let quizSession;

      quizSession = await getSessionMutation.mutateAsync({
        userId,
        subtestId,
      });

      if (!quizSession) {
        quizSession = await startSessionMutation.mutateAsync({
          userId,
          packageId: packageIdInt,
          subtestId,
          duration: duration ?? 10000,
        });
      }

      router.push(`/tryout/${packageId}/${quizSession.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Error creating session", {
        description: error.message,
      });
    }
  }
}
