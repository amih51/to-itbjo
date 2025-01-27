"use client";

import { useEffect, useState } from "react";
import { Button } from "~/app/_components/ui/button";
import { api } from "~/trpc/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "~/app/_components/ui/input";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import Editor from "~/app/_components/editor";
import { Separator } from "~/app/_components/ui/separator";

export default function QuizPage() {
  const { packageId, sessionId } = useParams();
  const router = useRouter();
  const session = useSession();
  const sessionIdString = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Map<number, number | string>
  >(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveAnswerMutation = api.quiz.saveAnswer.useMutation();
  const submitMutation = api.quiz.submitQuiz.useMutation();

  const {
    data: sessionDetails,
    isLoading,
    isError,
  } = api.quiz.getSessionDetails.useQuery({
    sessionId: parseInt(sessionIdString),
  });

  useEffect(() => {
    if (
      sessionDetails?.endTime &&
      new Date(sessionDetails?.endTime) < new Date() &&
      new Date(sessionDetails.package.TOend) >= new Date()
    ) {
      router.push(`/tryout/${packageId}`);
    }
  }, [sessionDetails, router, packageId]);

  const {
    data: questions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
  } = api.quiz.getQuestionsBySubtest.useQuery(
    { subtestId: sessionDetails?.subtestId ?? 0 },
    { enabled: !!sessionDetails },
  );

  // Set timer based on session duration
  useEffect(() => {
    if (sessionDetails?.duration && sessionDetails?.startTime) {
      const startTimestamp = new Date(sessionDetails.startTime).getTime();
      const durationInMs = sessionDetails.duration * 60 * 1000;
      const calculatedEndTime = startTimestamp + durationInMs;

      setEndTime(calculatedEndTime);
      setTimeLeft(Math.max(calculatedEndTime - Date.now(), 0));

      if (sessionDetails.userAnswers) {
        const initialSelectedAnswers = new Map<number, number | string>();
        sessionDetails.userAnswers.forEach((ua) => {
          if (ua.essayAnswer !== null) {
            initialSelectedAnswers.set(ua.questionId, ua.essayAnswer);
          } else {
            initialSelectedAnswers.set(ua.questionId, ua.answerChoice);
          }
        });
        setSelectedAnswers(initialSelectedAnswers);
      }
    }
  }, [sessionDetails]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(() => Math.max(endTime - Date.now(), 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Format time for display
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Save answer to the backend
  const saveAnswer = async (
    questionId: number,
    answerValue: string | number,
  ) => {
    try {
      await saveAnswerMutation.mutateAsync({
        quizSessionId: parseInt(sessionIdString),
        questionId,
        packageId: sessionDetails?.packageId ?? 0,
        userId: sessionDetails?.userId ?? "",
        answerChoice: typeof answerValue === "number" ? answerValue : null,
        essayAnswer: typeof answerValue === "string" ? answerValue : null,
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
      toast.error("Failed to save answer. Please try again.");
    }
  };

  // Handle answer selection or essay input
  const handleAnswerChange = (
    questionId: number,
    answerValue: string | number,
  ) => {
    setSelectedAnswers((prev) => {
      const updatedAnswers = new Map(prev);
      updatedAnswers.set(questionId, answerValue);
      saveAnswer(questionId, answerValue);
      return updatedAnswers;
    });
  };

  // Submit all answers
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const [questionId, answerChoice] of selectedAnswers.entries()) {
        await saveAnswer(questionId, answerChoice);
      }
      await submitMutation.mutateAsync({
        sessionId: parseInt(sessionIdString),
      });
      toast.success("Quiz submitted successfully!");
      router.push(`/tryout/${packageId}`);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return isError || isQuestionsError ? (
    <ErrorPage />
  ) : isLoading || isQuestionsLoading ? (
    <LoadingPage />
  ) : (
    <div className="mx-auto flex w-full flex-col gap-3 p-4 lg:w-3/5">
      <div>
        <p>
          <strong>Subtest: </strong>
          {(() => {
            switch (sessionDetails?.subtest.type) {
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
                return sessionDetails?.subtest.type;
            }
          })()}
        </p>
        <p className={`${timeLeft <= 0 ? "hidden" : ""}`}>
          <strong>Time Left:</strong> {formatTime(timeLeft)}
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 md:flex-row">
        {/* Main Content */}
        <div className="flex w-full flex-col gap-5 overflow-hidden rounded-md border p-3">
          {/* Display the current question */}
          {/* {new Date(sessionDetails?.endTime) < new Date() && (
            <p className="font-bold">
              Score:{" "}
              {questions[currentQuestionIndex].type === "essay"
                ? selectedAnswers
                    .get(questions[currentQuestionIndex].id)
                    ?.toString()
                    .trim() ===
                  questions[currentQuestionIndex].answers[0].content.trim()
                  ? questions[currentQuestionIndex].score
                  : 0
                : selectedAnswers.get(questions[currentQuestionIndex].id) ===
                    questions[currentQuestionIndex].correctAnswerChoice
                  ? questions[currentQuestionIndex].score
                  : 0}
            </p>
          )} */}

          {questions && questions[currentQuestionIndex] && (
            <div key={questions[currentQuestionIndex].id} className="gap-3">
              <strong>{currentQuestionIndex + 1}. </strong>
              <div className="rounded-lg border pb-5">
                <Editor
                  content={questions[currentQuestionIndex].content}
                  className={"border-none"}
                />
                {questions[currentQuestionIndex].imageUrl && (
                  <Image
                    src={questions[currentQuestionIndex].imageUrl}
                    alt="Question Image"
                    width={300}
                    height={300}
                    className="max-h-[50vh] w-fit"
                  />
                )}
              </div>
              <Separator className="mt-3" />
              {questions[currentQuestionIndex].type === "essay" ? (
                <Input
                  className="mt-3 w-full rounded border p-2"
                  placeholder="Write your answer here..."
                  value={
                    selectedAnswers.get(questions[currentQuestionIndex].id) ||
                    ""
                  }
                  onChange={(e) =>
                    handleAnswerChange(
                      questions[currentQuestionIndex].id,
                      e.target.value,
                    )
                  }
                  disabled={
                    new Date(sessionDetails.package.TOend) < new Date() &&
                    session.data?.user?.role === "user"
                  }
                />
              ) : (
                questions[currentQuestionIndex].answers.map((answer) => (
                  <label
                    key={answer.index}
                    className={`mt-3 flex flex-row items-center rounded-lg ${
                      questions[currentQuestionIndex].correctAnswerChoice ===
                        answer.index ||
                      (new Date(sessionDetails.endTime) > new Date() &&
                        selectedAnswers.get(
                          questions[currentQuestionIndex].id,
                        ) === answer.index)
                        ? "bg-green-500"
                        : selectedAnswers.get(
                              questions[currentQuestionIndex].id,
                            ) === answer.index
                          ? "bg-red-500"
                          : "hover:bg-slate-300"
                    } ${
                      !(
                        new Date(sessionDetails.endTime) < new Date() &&
                        session.data?.user?.role === "user"
                      ) && "cursor-pointer"
                    }`}
                  >
                    <Input
                      type="radio"
                      disabled={
                        new Date(sessionDetails.endTime) < new Date() &&
                        session.data?.user?.role === "user"
                      }
                      name={`question-${questions[currentQuestionIndex].id}`}
                      value={answer.index}
                      className={`hidden`}
                      checked={
                        selectedAnswers.get(
                          questions[currentQuestionIndex].id,
                        ) === answer.index
                      }
                      onChange={() =>
                        handleAnswerChange(
                          questions[currentQuestionIndex].id,
                          answer.index,
                        )
                      }
                    />
                    <Editor content={answer.content} />
                  </label>
                ))
              )}

              {/* Display Explanation */}
              {new Date(sessionDetails?.endTime) < new Date() && (
                <div>
                  Explanation:{" "}
                  <Editor
                    content={questions[currentQuestionIndex].explanation ?? ""}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar for navigating questions */}
        <div className="flex w-full flex-col justify-between gap-3 rounded-md border p-3">
          <ul className="flex size-fit flex-wrap gap-3">
            {questions?.map((_, index) => (
              <li key={index} className="size-fit">
                <Button
                  className={`size-9 ${
                    selectedAnswers.has(questions[index].id)
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : ""
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`${new Date(sessionDetails?.endTime) < new Date() && session.data.user.role === "user" ? "hidden" : ""}`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
