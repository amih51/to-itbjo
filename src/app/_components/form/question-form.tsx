"use client";

import React from "react";
import { Textarea } from "~/app/_components/ui/textarea";
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
import AnswerForm from "./answer-form";
import Image from "next/image";
import { UploadDropzone } from "~/utils/uploadthing";
import { Question } from "~/lib/types";
import Editor from "../editor";

interface QuestionFormProps {
  subtestIndex: number;
  questionIndex: number;
  question: Question;
  handleQuestionChange: (
    subtestIndex: number,
    questionIndex: number,
    field: keyof Question,
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
  addAnswer: (subtestIndex: number, questionIndex: number) => void;
  removeAnswer: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => void;
  removeQuestion: (subtestIndex: number, questionIndex: number) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  subtestIndex,
  questionIndex,
  question,
  handleQuestionChange,
  handleAnswerChange,
  handleCorrectAnswerChoiceChange,
  addAnswer,
  removeAnswer,
  removeQuestion,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h4 className="font-semibold">Question {questionIndex + 1}</h4>
      <div>
        <label>Score: </label>
        <Input
          type="number"
          min="0"
          value={question.score}
          onChange={(e) =>
            handleQuestionChange(
              subtestIndex,
              questionIndex,
              "score",
              Number(e.target.value),
            )
          }
        />
      </div>
      <div>
        <label>Content: </label>
        <Editor
          isEdit={true}
          content={question.content}
          onContentChange={(updatedContent) =>
            handleQuestionChange(
              subtestIndex,
              questionIndex,
              "content",
              updatedContent,
            )
          }
          className={"p-2"}
        />
      </div>
      <div>
        <label>Explanation: </label>
        <Editor
          isEdit={true}
          content={question.explanation}
          onContentChange={(updatedContent) =>
            handleQuestionChange(
              subtestIndex,
              questionIndex,
              "explanation",
              updatedContent,
            )
          }
          className={"p-2"}
        />
      </div>
      <div>
        <label>Image Upload: </label>
        <UploadDropzone
          className="rounded-lg border"
          endpoint="imageUploader"
          onClientUploadComplete={(res) =>
            handleQuestionChange(
              subtestIndex,
              questionIndex,
              "imageUrl",
              res?.[0]?.url || "",
            )
          }
        />
        {question.imageUrl && (
          <Image
            src={question.imageUrl}
            alt={`Question ${questionIndex + 1} Image`}
            width={300}
            height={300}
          />
        )}
      </div>
      <label className="w-fit">
        Question Type:
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">{question.type}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-full">
            <Command>
              <CommandList>
                <CommandItem
                  onSelect={() =>
                    handleQuestionChange(
                      subtestIndex,
                      questionIndex,
                      "type",
                      "mulChoice",
                    )
                  }
                >
                  Multiple Choice
                </CommandItem>
                <CommandItem
                  onSelect={() =>
                    handleQuestionChange(
                      subtestIndex,
                      questionIndex,
                      "type",
                      "essay",
                    )
                  }
                >
                  Essay
                </CommandItem>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </label>
      {question.type === "mulChoice" && (
        <div className="flex flex-col gap-3">
          <h5>Answers</h5>
          {question.answers.map((answer, aIndex) => (
            <AnswerForm
              key={aIndex}
              subtestIndex={subtestIndex}
              questionIndex={questionIndex}
              answerIndex={aIndex}
              answer={answer}
              isCorrect={question.correctAnswerChoice === aIndex + 1}
              setAsCorrect={() =>
                handleCorrectAnswerChoiceChange(
                  subtestIndex,
                  questionIndex,
                  aIndex + 1,
                )
              }
              handleAnswerChange={handleAnswerChange}
              removeAnswer={removeAnswer}
            />
          ))}
          <Button
            type="button"
            onClick={() => addAnswer(subtestIndex, questionIndex)}
          >
            Add Answer
          </Button>
        </div>
      )}
      {question.type === "essay" && (
        <div>
          <label>Essay Answer:</label>
          <Textarea
            value={question.answers[0]?.content || ""}
            onChange={(e) =>
              handleAnswerChange(subtestIndex, questionIndex, 0, e.target.value)
            }
          />
        </div>
      )}
      <Button
        type="button"
        onClick={() => removeQuestion(subtestIndex, questionIndex)}
      >
        Remove Question
      </Button>
    </div>
  );
};

export default QuestionForm;
