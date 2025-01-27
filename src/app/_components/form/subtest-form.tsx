"use client";

import React from "react";
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
import { Input } from "../ui/input";
import QuestionForm from "./question-form";
import { Subtest } from "~/lib/types";
import { SubtestType } from "@prisma/client";

interface SubtestFormProps {
  subtestIndex: number;
  subtest: Subtest;
  handleSubtestChange: (
    index: number,
    field: keyof Subtest,
    value: any,
  ) => void;
  handleQuestionChange: (
    subtestIndex: number,
    questionIndex: number,
    field: keyof Subtest["questions"][number],
    value: any,
  ) => void;
  handleAnswerChange: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
    value: string,
  ) => void;
  handleCorrectAnswerChoiceChange: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => void;
  addQuestion: (subtestIndex: number) => void;
  addAnswer: (subtestIndex: number, questionIndex: number) => void;
  removeAnswer: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => void;
  removeQuestion: (subtestIndex: number, questionIndex: number) => void;
  removeSubtest: (subtestIndex: number) => void;
}

const SubtestForm: React.FC<SubtestFormProps> = ({
  subtestIndex,
  subtest,
  handleSubtestChange,
  handleQuestionChange,
  handleAnswerChange,
  handleCorrectAnswerChoiceChange,
  addQuestion,
  addAnswer,
  removeAnswer,
  removeQuestion,
  removeSubtest,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-6">
      {/* <h3 className="text-xl font-semibold">Subtest {subtestIndex + 1}</h3> */}
      <label className="flex w-fit flex-col">
        Subtest Type:
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
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
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            <Command>
              <CommandList>
                {Object.values(SubtestType).map((type) => (
                  <CommandItem
                    key={type}
                    onSelect={() =>
                      handleSubtestChange(subtestIndex, "type", type)
                    }
                  >
                    {(() => {
                      switch (type) {
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
                          return type;
                      }
                    })()}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </label>
      <label className="flex w-32 flex-col">
        Duration (minutes):
        <Input
          type="number"
          min="0"
          value={subtest.duration}
          onChange={(e) =>
            handleSubtestChange(
              subtestIndex,
              "duration",
              Number(e.target.value),
            )
          }
        />
      </label>
      <h4 className="text-lg font-semibold">Questions</h4>
      {subtest.questions.map((question, qIndex) => (
        <QuestionForm
          key={qIndex}
          subtestIndex={subtestIndex}
          questionIndex={qIndex}
          question={question}
          handleQuestionChange={handleQuestionChange}
          handleAnswerChange={handleAnswerChange}
          handleCorrectAnswerChoiceChange={handleCorrectAnswerChoiceChange}
          addAnswer={addAnswer}
          removeAnswer={removeAnswer}
          removeQuestion={removeQuestion}
        />
      ))}
      <Button
        type="button"
        onClick={() => addQuestion(subtestIndex)}
        className="w-full"
      >
        Add Question
      </Button>
      <Button
        type="button"
        onClick={() => removeSubtest(subtestIndex)}
        className="w-full"
      >
        Remove Subtest
      </Button>
    </div>
  );
};

export default SubtestForm;
