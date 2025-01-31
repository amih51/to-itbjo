"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import SubtestForm from "~/app/_components/form/subtest-form";
import { Subtest } from "~/lib/types";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";
import { Button } from "~/app/_components/ui/button";
import { QuestionType } from "@prisma/client";

const EditSubtestPage: React.FC = () => {
  const router = useRouter();
  const { packageId, subtestId } = useParams();

  const parsedPackageId = packageId ? Number(packageId) : undefined;
  const parsedSubtestId = subtestId ? Number(subtestId) : undefined;

  const { data, isLoading, isError } = api.package.getSubtest.useQuery(
    { id: parsedSubtestId ?? 0 },
    {
      refetchOnWindowFocus: false,
      enabled: !!parsedSubtestId,
    },
  );

  const updateSubtestMutation = api.package.updateSubtest.useMutation({
    onSuccess: () => {
      toast.success("Subtest updated successfully!");
      router.push(`/packageManagement/${parsedPackageId}`);
    },
    onError: (error: any) => {
      console.error("Error:", error);
      toast.error("Failed to update subtest.");
    },
  });

  const [formData, setFormData] = useState<Subtest>(null);

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        type: data.type ?? "pu",
        duration: data.duration ?? 0,
        questions: data.questions.map((q, index) => ({
          ...q,
          index: q.index ?? index + 1,
          type: q.type as QuestionType,
          content: q.content ?? "",
          score: q.score ?? 0,
          imageUrl: q.imageUrl ?? null,
          explanation: q.explanation ?? null,
          correctAnswerChoice: q.correctAnswerChoice ?? 0,
          answers: q.answers.map((answer, aIndex) => ({
            ...answer,
            index: answer.index ?? aIndex + 1,
            content: answer.content ?? "",
          })),
        })),
      });
    }
  }, [data]);

  const handleSubtestChange = (field: keyof Subtest, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleQuestionChange = (
    questionIndex: number,
    field: keyof Subtest["questions"][number],
    value: any,
  ) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    if (question) {
      (question as any)[field] = value;

      if (field === "type" && value === "essay") {
        question.answers = [{ index: 1, content: "" }];
        question.correctAnswerChoice = undefined;
      }
    }
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleAnswerChange = (
    questionIndex: number,
    answerIndex: number,
    value: string,
  ) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    const answer = updatedQuestions[questionIndex].answers[answerIndex];
    if (answer) {
      answer.content = value;
      setFormData({ ...formData, questions: updatedQuestions });
    }
  };

  const handleCorrectAnswerChoiceChange = (
    questionIndex: number,
    answerIndex: number,
  ) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    const question = updatedQuestions[questionIndex];
    if (question) {
      question.correctAnswerChoice = answerIndex;
      setFormData({ ...formData, questions: updatedQuestions });
    }
  };

  const addQuestion = () => {
    if (!formData) return;

    const updatedQuestions = [
      ...formData.questions,
      {
        index: formData.questions.length + 1,
        content: "",
        imageUrl: "",
        type: "mulChoice" as QuestionType,
        score: 0,
        explanation: "",
        answers: [
          { index: 1, content: "" },
          { index: 2, content: "" },
          { index: 3, content: "" },
          { index: 4, content: "" },
          { index: 5, content: "" },
        ],
        correctAnswerChoice: 1,
      },
    ];
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addAnswer = (questionIndex: number) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].answers.push({
      index: updatedQuestions[questionIndex].answers.length + 1,
      content: "",
    });
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].answers.splice(answerIndex, 1);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (questionIndex: number) => {
    if (!formData) return;

    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(questionIndex, 1);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    try {
      await updateSubtestMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Error updating subtest:", error);
    }
  };

  return isError ? (
    <ErrorPage />
  ) : isLoading || !formData ? (
    <LoadingPage />
  ) : (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex flex-col items-center gap-3 p-6 lg:w-3/5"
    >
      {/* <h1 className="text-2xl font-semibold">Edit Subtest</h1> */}
      <SubtestForm
        subtestIndex={0}
        subtest={formData}
        handleSubtestChange={(index, field, value) =>
          handleSubtestChange(field, value)
        }
        handleQuestionChange={(index, qIndex, field, value) =>
          handleQuestionChange(qIndex, field, value)
        }
        handleAnswerChange={(index, qIndex, aIndex, value) =>
          handleAnswerChange(qIndex, aIndex, value)
        }
        handleCorrectAnswerChoiceChange={(index, qIndex, aIndex) =>
          handleCorrectAnswerChoiceChange(qIndex, aIndex)
        }
        addQuestion={(index) => addQuestion()}
        addAnswer={(index, qIndex) => addAnswer(qIndex)}
        removeAnswer={(index, qIndex, aIndex) => removeAnswer(qIndex, aIndex)}
        removeQuestion={(index, qIndex) => removeQuestion(qIndex)}
        removeSubtest={() => {}}
      />
      <Button type="submit">Save Changes</Button>
    </form>
  );
};

export default EditSubtestPage;
