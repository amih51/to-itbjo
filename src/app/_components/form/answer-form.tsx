"use client";

import React from "react";
import { Button } from "~/app/_components/ui/button";
import { Answer } from "~/lib/types";
import Editor from "../editor";

interface AnswerFormProps {
  subtestIndex: number;
  questionIndex: number;
  answerIndex: number;
  answer: Answer;
  isCorrect: boolean;
  setAsCorrect: () => void;
  handleAnswerChange: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
    value: string,
  ) => void;
  removeAnswer: (
    subtestIndex: number,
    questionIndex: number,
    answerIndex: number,
  ) => void;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  subtestIndex,
  questionIndex,
  answerIndex,
  answer,
  isCorrect,
  setAsCorrect,
  handleAnswerChange,
  removeAnswer,
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="radio"
        name={`correctAnswer-${subtestIndex}-${questionIndex}`}
        checked={isCorrect}
        onChange={setAsCorrect}
      />
      <Editor
        isEdit={true}
        content={answer.content}
        onContentChange={(updatedContent) =>
          handleAnswerChange(
            subtestIndex,
            questionIndex,
            answerIndex,
            updatedContent,
          )
        }
        className="p-2"
      />
      <Button
        type="button"
        onClick={() => removeAnswer(subtestIndex, questionIndex, answerIndex)}
      >
        Remove
      </Button>
    </div>
  );
};

export default AnswerForm;
