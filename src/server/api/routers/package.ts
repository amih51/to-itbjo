import { z } from "zod";
import {
  createTRPCRouter,
  teacherProcedure,
  userProcedure,
} from "~/server/api/trpc";
import { QuestionType, Type, SubtestType, Prisma } from "@prisma/client";

export const packageRouter = createTRPCRouter({
  // Get All Packages
  getAllPackages: userProcedure.query(async ({ ctx }) => {
    const packages = await ctx.db.package.findMany({
      orderBy: { id: "desc" },
    });
    return packages ?? null;
  }),

  // Get Packages in Class
  getPackages: userProcedure
    .input(
      z.object({
        classId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.package.findMany({
        where: {
          classId: input.classId,
        },
      });
    }),

  getTryoutPackages: userProcedure
    .input(
      z.object({
        classId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.package.findMany({
        where: {
          classId: input.classId,
          type: "tryout",
        },
      });
    }),

  // Get Single Package with Subtests, Questions, and Answers
  getPackage: userProcedure
    .input(z.object({ id: z.number().min(1, "Package ID is required") }))
    .query(async ({ input, ctx }) => {
      const packageData = await ctx.db.package.findUnique({
        where: { id: input.id },
        include: {
          subtests: {
            include: {
              questions: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
      });
      if (!packageData) {
        throw new Error("Package not found");
      }
      return packageData;
    }),

  // Get Users by Package with Scores
  getUsersByPackage: userProcedure
    .input(
      z.object({
        packageId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          userAnswers: {
            some: {
              packageId: input.packageId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          quizSession: {
            where: {
              packageId: input.packageId,
            },
            select: {
              id: true,
              package: {
                select: {
                  _count: { select: { subtests: true } },
                },
              },
              subtest: {
                select: {
                  type: true,
                },
              },
            },
          },
          userAnswers: {
            where: {
              packageId: input.packageId,
            },
            select: {
              question: {
                select: {
                  correctAnswerChoice: true,
                  score: true,
                  answers: {
                    select: {
                      content: true,
                    },
                  },
                },
              },
              answerChoice: true,
              essayAnswer: true,
            },
          },
        },
      });

      // Calculate scores for each user
      return users.map((user) => {
        const score = user.userAnswers.reduce((total, answer) => {
          if (answer.question.correctAnswerChoice !== null) {
            // Multiple Choice Scoring
            return (
              total +
              (answer.answerChoice === answer.question.correctAnswerChoice
                ? answer.question.score
                : 0)
            );
          } else if (answer.essayAnswer !== null) {
            // Essay Scoring
            const isEssayCorrect =
              answer.essayAnswer.trim().toLowerCase() ===
              answer.question.answers[0]?.content.trim().toLowerCase();
            return total + (isEssayCorrect ? answer.question.score : 0);
          }
          return total;
        }, 0);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          score: score / user.quizSession[0].package._count.subtests,
          quizSession: user.quizSession,
        };
      });
    }),

  // Create Package
  createPackage: teacherProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        type: z.nativeEnum(Type),
        classId: z.number().positive("Class ID must be a positive number"),
        TOstart: z.string().optional(),
        TOend: z.string().optional(),
        subtests: z.array(
          z.object({
            type: z.nativeEnum(SubtestType),
            duration: z.number().optional(),
            questions: z.array(
              z.object({
                index: z.number().positive("Index must be a positive number"),
                content: z.string().min(1, "Content is required"),
                imageUrl: z.string().optional(),
                type: z.nativeEnum(QuestionType),
                score: z
                  .number()
                  .min(0, "Score must be non-negative")
                  .default(0),
                explanation: z.string().optional(),
                answers: z.array(
                  z.object({
                    index: z
                      .number()
                      .positive("Index must be a positive number"),
                    content: z.string().min(1, "Answer content is required"),
                  }),
                ),
                correctAnswerChoice: z.number().optional(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { subtests, ...packageData } = input;

        // Normalize date fields
        const { classId, ...restPackageData } = packageData;
        const normalizedPackageData = {
          ...restPackageData,
          name: packageData.name,
          type: packageData.type,
          TOstart: packageData.TOstart ? new Date(packageData.TOstart) : null,
          TOend: packageData.TOend ? new Date(packageData.TOend) : null,
        };

        // Create Package without packageId in the input
        const createdPackage = await ctx.db.package.create({
          data: {
            ...normalizedPackageData,
            class: {
              connect: { id: classId },
            },
          },
        });

        // Create Subtests, Questions, and Answers using created packageId
        for (const subtest of subtests) {
          await ctx.db.subtest.create({
            data: {
              type: subtest.type,
              duration: subtest.duration,
              packageId: createdPackage.id,
              questions: {
                create: subtest.questions.map((question) => ({
                  index: question.index,
                  content: question.content,
                  imageUrl: question.imageUrl,
                  type: question.type,
                  score: question.score,
                  explanation: question.explanation,
                  correctAnswerChoice: question.correctAnswerChoice,
                  packageId: createdPackage.id,
                  answers: {
                    create: question.answers.map((answer) => ({
                      index: answer.index,
                      content: answer.content,
                    })),
                  },
                })),
              },
            },
            include: {
              questions: {
                include: {
                  answers: true,
                },
              },
            },
          });
        }

        return createdPackage;
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error creating package:", error.message);
          throw new Error("Error creating package: " + error.message);
        }
        throw error;
      }
    }),

  // Update Package
  updatePackage: teacherProcedure
    .input(
      z.object({
        id: z.number().positive("Package ID must be a positive number"),
        name: z.string().min(1, "Name is required").optional(),
        type: z.nativeEnum(Type).optional(),
        classId: z
          .number()
          .positive("Class ID must be a positive number")
          .optional(),
        TOstart: z.string().optional(),
        TOend: z.string().optional(),
        subtests: z
          .array(
            z.object({
              id: z
                .number()
                .positive("Subtest ID must be a positive number")
                .optional(),
              type: z.nativeEnum(SubtestType),
              duration: z.number().optional(),
              questions: z
                .array(
                  z.object({
                    id: z
                      .number()
                      .positive("Question ID must be a positive number")
                      .optional(),
                    index: z
                      .number()
                      .positive("Index must be a positive number"),
                    content: z.string().min(1, "Content is required"),
                    imageUrl: z.string().optional(),
                    type: z.nativeEnum(QuestionType),
                    score: z
                      .number()
                      .min(0, "Score must be non-negative")
                      .default(0),
                    explanation: z.string().optional(),
                    correctAnswerChoice: z.number().optional(),
                    answers: z.array(
                      z.object({
                        id: z
                          .number()
                          .positive("Answer ID must be a positive number")
                          .optional(),
                        index: z
                          .number()
                          .positive("Index must be a positive number"),
                        content: z
                          .string()
                          .min(1, "Answer content is required"),
                      }),
                    ),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, subtests, classId, TOstart, TOend, ...packageData } = input;

        const updatedPackage = await ctx.db.$transaction(async (tx) => {
          const updateData: Prisma.PackageUpdateInput = {
            ...packageData,
            TOstart: TOstart ? new Date(TOstart) : undefined,
            TOend: TOend ? new Date(TOend) : undefined,
            ...(classId && {
              class: {
                connect: { id: classId },
              },
            }),
          };

          const pkg = await tx.package.update({
            where: { id },
            data: updateData,
          });

          if (subtests) {
            const existingSubtests = await tx.subtest.findMany({
              where: { packageId: id },
              select: { id: true },
            });
            const existingSubtestIds = existingSubtests.map((s) => s.id);

            const inputSubtestIds = subtests
              .filter((s) => s.id !== undefined)
              .map((s) => s.id as number);

            const subtestsToDelete = existingSubtestIds.filter(
              (existingId) => !inputSubtestIds.includes(existingId),
            );

            if (subtestsToDelete.length > 0) {
              await tx.subtest.deleteMany({
                where: { id: { in: subtestsToDelete } },
              });
            }

            for (const subtest of subtests) {
              if (subtest.id) {
                const updatedSubtest = await tx.subtest.update({
                  where: { id: subtest.id },
                  data: {
                    type: subtest.type,
                    duration: subtest.duration,
                  },
                });

                if (subtest.questions) {
                  const existingQuestions = await tx.question.findMany({
                    where: { subtestId: subtest.id },
                    select: { id: true },
                  });
                  const existingQuestionIds = existingQuestions.map(
                    (q) => q.id,
                  );

                  const inputQuestionIds = subtest.questions
                    .filter((q) => q.id !== undefined)
                    .map((q) => q.id as number);

                  const questionsToDelete = existingQuestionIds.filter(
                    (existingId) => !inputQuestionIds.includes(existingId),
                  );

                  if (questionsToDelete.length > 0) {
                    await tx.question.deleteMany({
                      where: { id: { in: questionsToDelete } },
                    });
                  }

                  for (const question of subtest.questions) {
                    if (question.id) {
                      const updatedQuestion = await tx.question.update({
                        where: { id: question.id },
                        data: {
                          index: question.index,
                          content: question.content,
                          imageUrl: question.imageUrl,
                          type: question.type,
                          score: question.score,
                          explanation: question.explanation,
                          correctAnswerChoice: question.correctAnswerChoice,
                          packageId: id,
                        },
                      });

                      if (question.answers) {
                        const existingAnswers = await tx.answer.findMany({
                          where: { questionId: question.id },
                          select: { id: true },
                        });
                        const existingAnswerIds = existingAnswers.map(
                          (a) => a.id,
                        );

                        const inputAnswerIds = question.answers
                          .filter((a) => a.id !== undefined)
                          .map((a) => a.id as number);

                        const answersToDelete = existingAnswerIds.filter(
                          (existingId) => !inputAnswerIds.includes(existingId),
                        );

                        if (answersToDelete.length > 0) {
                          await tx.answer.deleteMany({
                            where: { id: { in: answersToDelete } },
                          });
                        }

                        for (const answer of question.answers) {
                          if (answer.id) {
                            await tx.answer.update({
                              where: { id: answer.id },
                              data: {
                                index: answer.index,
                                content: answer.content,
                              },
                            });
                          } else {
                            await tx.answer.create({
                              data: {
                                index: answer.index,
                                content: answer.content,
                                question: {
                                  connect: { id: question.id },
                                },
                              },
                            });
                          }
                        }
                      }
                    } else {
                      const newQuestion = await tx.question.create({
                        data: {
                          index: question.index,
                          content: question.content,
                          imageUrl: question.imageUrl,
                          type: question.type,
                          score: question.score,
                          explanation: question.explanation,
                          correctAnswerChoice: question.correctAnswerChoice,
                          packageId: id,
                          subtest: {
                            connect: { id: subtest.id },
                          },
                        },
                      });

                      if (question.answers) {
                        for (const answer of question.answers) {
                          await tx.answer.create({
                            data: {
                              index: answer.index,
                              content: answer.content,
                              question: {
                                connect: { id: newQuestion.id },
                              },
                            },
                          });
                        }
                      }
                    }
                  }
                }
              } else {
                const newSubtest = await tx.subtest.create({
                  data: {
                    type: subtest.type,
                    duration: subtest.duration,
                    package: {
                      connect: { id },
                    },
                  },
                });

                if (subtest.questions) {
                  for (const question of subtest.questions) {
                    const newQuestion = await tx.question.create({
                      data: {
                        index: question.index,
                        content: question.content,
                        imageUrl: question.imageUrl,
                        type: question.type,
                        score: question.score,
                        explanation: question.explanation,
                        correctAnswerChoice: question.correctAnswerChoice,
                        packageId: id,
                        subtest: {
                          connect: { id: newSubtest.id },
                        },
                      },
                    });

                    if (question.answers) {
                      for (const answer of question.answers) {
                        await tx.answer.create({
                          data: {
                            index: answer.index,
                            content: answer.content,
                            question: {
                              connect: { id: newQuestion.id },
                            },
                          },
                        });
                      }
                    }
                  }
                }
              }
            }
          }

          return pkg;
        });

        return updatedPackage;
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error updating package:", error.message);
          throw new Error("Error updating package: " + error.message);
        }
        throw error;
      }
    }),

  deletePackage: teacherProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.package.delete({
        where: {
          id: input.id,
        },
      });
    }),

  // Get a single Subtest by ID
  getSubtest: userProcedure
    .input(
      z.object({
        id: z.number().positive("Subtest ID must be a positive number"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const subtest = await ctx.db.subtest.findUnique({
        where: { id: input.id },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
        },
      });

      if (!subtest) {
        throw new Error("Subtest not found");
      }

      return subtest;
    }),

  // Update a Subtest
  updateSubtest: teacherProcedure
    .input(
      z.object({
        id: z.number().positive("Subtest ID must be a positive number"),
        type: z.nativeEnum(SubtestType).optional(),
        duration: z.number().optional(),
        questions: z
          .array(
            z.object({
              id: z
                .number()
                .positive("Question ID must be a positive number")
                .optional(),
              index: z.number().positive("Index must be a positive number"),
              content: z.string().min(1, "Content is required"),
              imageUrl: z.string().optional(),
              type: z.nativeEnum(QuestionType),
              score: z.number().min(0, "Score must be non-negative"),
              explanation: z.string().optional(),
              correctAnswerChoice: z.number().optional(),
              answers: z.array(
                z.object({
                  id: z
                    .number()
                    .positive("Answer ID must be a positive number")
                    .optional(),
                  index: z.number().positive("Index must be a positive number"),
                  content: z.string().min(1, "Answer content is required"),
                }),
              ),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, type, duration, questions } = input;

      return await ctx.db.$transaction(async (tx) => {
        // Update subtest basic info
        const updatedSubtest = await tx.subtest.update({
          where: { id },
          data: {
            type,
            duration,
          },
        });

        if (questions) {
          // Handle question updates
          for (const question of questions) {
            if (question.id) {
              // Update existing question
              const updatedQuestion = await tx.question.update({
                where: { id: question.id },
                data: {
                  index: question.index,
                  content: question.content,
                  imageUrl: question.imageUrl,
                  type: question.type,
                  score: question.score,
                  explanation: question.explanation,
                  correctAnswerChoice: question.correctAnswerChoice,
                },
              });

              // Update answers for the question
              for (const answer of question.answers) {
                if (answer.id) {
                  // Update existing answer
                  await tx.answer.update({
                    where: { id: answer.id },
                    data: {
                      index: answer.index,
                      content: answer.content,
                    },
                  });
                } else {
                  // Create new answer
                  await tx.answer.create({
                    data: {
                      index: answer.index,
                      content: answer.content,
                      question: { connect: { id: updatedQuestion.id } },
                    },
                  });
                }
              }
            } else {
              // Create new question
              const subtest = await tx.subtest.findUnique({
                where: { id },
                select: { packageId: true },
              });

              if (!subtest) {
                throw new Error("Subtest not found");
              }

              const newQuestion = await tx.question.create({
                data: {
                  index: question.index,
                  content: question.content,
                  imageUrl: question.imageUrl,
                  type: question.type,
                  score: question.score,
                  explanation: question.explanation,
                  correctAnswerChoice: question.correctAnswerChoice,
                  subtest: { connect: { id } },
                  packageId: subtest.packageId, // Tambahkan packageId
                },
              });

              // Create answers for the new question
              for (const answer of question.answers) {
                await tx.answer.create({
                  data: {
                    index: answer.index,
                    content: answer.content,
                    question: { connect: { id: newQuestion.id } },
                  },
                });
              }
            }
          }
        }

        return updatedSubtest;
      });
    }),
});
