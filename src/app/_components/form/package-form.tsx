"use client";

import React, { useState, useEffect } from "react";
import { Input } from "~/app/_components/ui/input";
import { Button } from "~/app/_components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/app/_components/ui/popover";
import {
  Command,
  CommandItem,
  CommandList,
} from "~/app/_components/ui/command";
import { PackageFormData } from "~/lib/types";
import { toast } from "sonner";
import SubtestForm from "./subtest-form";
import { api } from "~/trpc/react";
import ErrorPage from "~/app/error";
import LoadingPage from "~/app/loading";

interface PackageFormProps {
  initialData?: PackageFormData;
  onSubmit: (data: PackageFormData) => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ initialData, onSubmit }) => {
  const {
    data: classes,
    isLoading,
    isError,
  } = api.class.getAllClasses.useQuery();

  const [formData, setFormData] = useState<PackageFormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    type: initialData?.type || "tryout",
    classId: initialData?.classId || 1,
    TOstart: initialData?.TOstart || "",
    TOend: initialData?.TOend || "",
    subtests: initialData?.subtests || [
      {
        type: "pu",
        duration: 0,
        questions: [
          {
            index: 1,
            content: "",
            imageUrl: "",
            type: "mulChoice",
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
        ],
      },
    ],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name,
        type: initialData.type,
        classId: initialData.classId,
        TOstart: initialData.TOstart,
        TOend: initialData.TOend,
        subtests: initialData.subtests,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof PackageFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubtestChange = (
    index: number,
    field: keyof PackageFormData["subtests"][number],
    value: any,
  ) => {
    const updatedSubtests = [...formData.subtests];
    if (updatedSubtests[index]) {
      (updatedSubtests[index] as any)[field] = value;
    }
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const handleQuestionChange = (
    subtestIndex: number,
    questionIndex: number,
    field: keyof PackageFormData["subtests"][number]["questions"][number],
    value: any,
  ) => {
    const updatedSubtests = [...formData.subtests];
    const question = updatedSubtests[subtestIndex].questions[questionIndex];
    if (question) {
      (question as any)[field] = value;

      if (field === "type" && value === "essay") {
        question.answers = [{ index: 1, content: "" }];
        question.correctAnswerChoice = undefined;
      }
    }
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const handleAnswerChange = (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
    value: string,
  ) => {
    const updatedSubtests = [...formData.subtests];
    const answer =
      updatedSubtests[subtestIndex].questions[questionIndex].answers[
        answerIndex
      ];
    if (answer) {
      answer.content = value;
      setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
    }
  };

  const handleCorrectAnswerChoiceChange = (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => {
    const updatedSubtests = [...formData.subtests];
    const question = updatedSubtests[subtestIndex].questions[questionIndex];
    if (question) {
      question.correctAnswerChoice = answerIndex;
      setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
    }
  };

  const addSubtest = () => {
    setFormData((prev) => ({
      ...prev,
      subtests: [
        ...prev.subtests,
        {
          type: "pu",
          duration: 0,
          questions: [
            {
              index: prev.subtests.length + 1,
              content: "",
              imageUrl: "",
              type: "mulChoice",
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
          ],
        },
      ],
    }));
  };

  const addQuestion = (subtestIndex: number) => {
    const updatedSubtests = [...formData.subtests];
    updatedSubtests[subtestIndex].questions.push({
      index: updatedSubtests[subtestIndex].questions.length + 1,
      content: "",
      imageUrl: "",
      type: "mulChoice",
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
    });
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const addAnswer = (subtestIndex: number, questionIndex: number) => {
    const updatedSubtests = [...formData.subtests];
    updatedSubtests[subtestIndex].questions[questionIndex].answers.push({
      index:
        updatedSubtests[subtestIndex].questions[questionIndex].answers.length +
        1,
      content: "",
    });
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const removeAnswer = (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => {
    const updatedSubtests = [...formData.subtests];
    updatedSubtests[subtestIndex].questions[questionIndex].answers.splice(
      answerIndex,
      1,
    );
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const removeQuestion = (subtestIndex: number, questionIndex: number) => {
    const updatedSubtests = [...formData.subtests];
    updatedSubtests[subtestIndex].questions.splice(questionIndex, 1);
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const removeSubtest = (subtestIndex: number) => {
    const updatedSubtests = [...formData.subtests];
    updatedSubtests.splice(subtestIndex, 1);
    setFormData((prev) => ({ ...prev, subtests: updatedSubtests }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const preparedFormData: PackageFormData = {
      ...formData,
      TOstart: formData.TOstart ? new Date(formData.TOstart).toISOString() : "",
      TOend: formData.TOend ? new Date(formData.TOend).toISOString() : "",
      subtests: formData.subtests.map((subtest) => ({
        ...subtest,
        questions: subtest.questions.map((question) => ({
          ...question,
        })),
      })),
    };

    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    onSubmit(preparedFormData);
  };

  function toLocalDatetimeString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  return isError ? (
    <ErrorPage />
  ) : isLoading ? (
    <LoadingPage />
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
      <label>
        Name:
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </label>
      <label className="flex w-fit flex-col">
        <p>Type:</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">{formData.type}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            <Command>
              <CommandList>
                <CommandItem onSelect={() => handleChange("type", "tryout")}>
                  Tryout
                </CommandItem>
                <CommandItem onSelect={() => handleChange("type", "drill")}>
                  Drill
                </CommandItem>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </label>
      <label className="flex flex-col">
        Class:
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {classes?.find((cls) => cls.id === formData.classId)?.name ||
                "Select Class"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            <Command>
              <CommandList>
                {classes?.map((cls) => (
                  <CommandItem
                    key={cls.id}
                    onSelect={() => handleChange("classId", cls.id)}
                  >
                    {cls.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </label>
      <label className="flex flex-col">
        <p className="w-full">Start Date:</p>
        <Input
          type="datetime-local"
          value={
            formData.TOstart ? toLocalDatetimeString(formData.TOstart) : ""
          }
          onChange={(e) =>
            handleChange("TOstart", new Date(e.target.value).toISOString())
          }
          className="w-fit"
        />
      </label>
      <label className="flex flex-col">
        <p className="w-full">End Date:</p>
        <Input
          type="datetime-local"
          value={formData.TOend ? toLocalDatetimeString(formData.TOend) : ""}
          onChange={(e) => handleChange("TOend", e.target.value)}
          className="w-fit"
        />
      </label>
      {/* Subtests */}
      {formData.subtests.map((subtest, sIndex) => (
        <SubtestForm
          key={sIndex}
          subtestIndex={sIndex}
          subtest={subtest}
          handleSubtestChange={handleSubtestChange}
          handleQuestionChange={handleQuestionChange}
          handleAnswerChange={handleAnswerChange}
          handleCorrectAnswerChoiceChange={handleCorrectAnswerChoiceChange}
          addQuestion={addQuestion}
          addAnswer={addAnswer}
          removeAnswer={removeAnswer}
          removeQuestion={removeQuestion}
          removeSubtest={removeSubtest}
        />
      ))}
      <Button type="button" onClick={addSubtest}>
        Add Subtest
      </Button>
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default PackageForm;
