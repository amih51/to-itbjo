import { SubtestType } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  teacherProcedure,
  userProcedure,
} from "~/server/api/trpc";

export const quizRouter = createTRPCRouter({
  getAnnouncement: userProcedure.query(async ({ ctx }) => {
    return await ctx.db.announcement.findFirst();
  }),

  upsertAnnouncement: teacherProcedure
    .input(
      z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        url: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.announcement.upsert({
        where: { id: 1 },
        update: { content: input.content, title: input.title, url: input.url },
        create: { content: input.content, title: input.title, url: input.url },
      });
    }),

  getPackageWithSubtest: userProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const packageData = await ctx.db.package.findUnique({
        where: {
          id: input.id,
        },
        omit: {
          id: true,
          classId: true,
        },
        include: {
          subtests: {
            include: {
              quizSession: {
                where: {
                  userId: ctx.session.user?.id,
                },
                select: {
                  endTime: true,
                  package: { select: { TOend: true } },
                  userAnswers: {
                    where: {
                      packageId: input.id,
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
              },
            },
          },
        },
      });

      if (!packageData) {
        throw new Error("Package not found");
      }

      let totalScore = 0;

      const subtestsWithScores = packageData.subtests.map((subtest) => {
        let totalCorrect = 0;
        let totalQuestion = 0;

        const quizSession = subtest.quizSession[0];
        if (!quizSession) {
          return {
            ...subtest,
            quizSession: null,
            totalCorrect: null,
            totalQuestion: null,
            score: null,
          };
        }

        if (new Date(quizSession.package.TOend) > new Date()) {
          return {
            ...subtest,
            quizSession: quizSession.endTime,
            totalCorrect: null,
            totalQuestion: null,
            score: null,
          };
        }

        const score = quizSession.userAnswers.reduce((total, answer) => {
          totalQuestion++;

          if (answer.question.correctAnswerChoice !== null) {
            totalCorrect +=
              answer.question.correctAnswerChoice === answer.answerChoice
                ? 1
                : 0;
            return (
              total +
              (answer.answerChoice === answer.question.correctAnswerChoice
                ? answer.question.score
                : 0)
            );
          } else if (answer.essayAnswer !== null) {
            const isEssayCorrect =
              answer.essayAnswer.trim().toLowerCase() ===
              answer.question.answers[0]?.content.trim().toLowerCase();
            totalCorrect += isEssayCorrect ? 1 : 0;
            return total + (isEssayCorrect ? answer.question.score : 0);
          }
          return total;
        }, 0);

        totalScore += score;

        return {
          ...subtest,
          quizSession: quizSession.endTime,
          totalCorrect,
          totalQuestion,
          score,
        };
      });

      return {
        ...packageData,
        totalScore,
        subtests: subtestsWithScores,
      };
    }),

  getSession: userProcedure
    .input(
      z.object({
        userId: z.string(),
        subtestId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.quizSession.findFirst({
        where: {
          userId: input.userId,
          subtestId: input.subtestId,
        },
      });
    }),

  createSession: userProcedure
    .input(
      z.object({
        userId: z.string(),
        packageId: z.number(),
        subtestId: z.number(),
        duration: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.quizSession.create({
        data: {
          userId: input.userId,
          packageId: input.packageId,
          subtestId: input.subtestId,
          duration: input.duration,
          endTime: new Date(new Date().getTime() + input.duration * 60 * 1000),
        },
      });
    }),

  getQuestionsBySubtest: userProcedure
    .input(z.object({ subtestId: z.number(), userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findFirst({
        where: {
          subtestId: input.subtestId,
          userId:
            ctx.session.user.role === "admin"
              ? (input.userId ?? ctx.session.user?.id)
              : ctx.session.user?.id,
        },
        select: { endTime: true, package: { select: { TOend: true } } },
      });

      if (!session) {
        return null;
      } else if (new Date(session.package.TOend) > new Date()) {
        return await ctx.db.question
          .findMany({
            where: { subtestId: input.subtestId },
            orderBy: { index: "asc" },
            include: {
              answers: true,
            },
          })
          .then((questions) =>
            questions.map((question) => ({
              ...question,
              correctAnswerChoice: null,
              explanation: null,
              score: null,
            })),
          );
      } else if (new Date(session.package.TOend) < new Date()) {
        return await ctx.db.question.findMany({
          where: { subtestId: input.subtestId },
          orderBy: { index: "asc" },
          include: {
            answers: true,
          },
        });
      }
    }),

  getSessionDetails: userProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findUnique({
        where: { id: input.sessionId },
        include: {
          subtest: true,
          package: { select: { TOend: true } },
          userAnswers: {
            where: { quizSessionId: input.sessionId },
          },
        },
      });

      if (
        !session ||
        (session.userId !== ctx.session.user?.id &&
          ctx.session.user?.role !== "admin")
      ) {
        return null;
      }

      return session;
    }),

  saveAnswer: userProcedure
    .input(
      z.object({
        answerChoice: z.number().nullable(),
        essayAnswer: z.string().nullable(),
        questionId: z.number(),
        userId: z.string(),
        packageId: z.number(),
        quizSessionId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        answerChoice,
        essayAnswer,
        questionId,
        userId,
        packageId,
        quizSessionId,
      } = input;

      if (answerChoice === null && essayAnswer === null) {
        throw new Error("Either answerChoice or essayAnswer must be provided.");
      }

      const userAnswer = await ctx.db.userAnswer.upsert({
        where: {
          userId_quizSessionId_questionId: {
            userId,
            quizSessionId,
            questionId,
          },
        },
        update: {
          answerChoice,
          essayAnswer,
        },
        create: {
          answerChoice,
          essayAnswer,
          questionId,
          userId,
          packageId,
          quizSessionId,
        },
      });

      return userAnswer;
    }),

  submitQuiz: userProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.quizSession.update({
        where: { id: input.sessionId },
        data: {
          endTime: new Date().toISOString(),
        },
      });
    }),

  getDrillSubtest: userProcedure
    .input(z.object({ subtest: z.nativeEnum(SubtestType) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return await ctx.db.subtest
        .findMany({
          where: {
            package: {
              type: "drill",
            },
            type: input.subtest,
          },
          select: {
            id: true,
            duration: true,
            _count: {
              select: {
                questions: true,
              },
            },
            package: {
              select: {
                id: true,
                name: true,
              },
            },
            questions: {
              select: {
                id: true,
                userAnswers: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    answerChoice: true,
                    essayAnswer: true,
                  },
                },
                correctAnswerChoice: true,
                answers: true,
              },
            },
            quizSession: {
              where: {
                userId: userId,
              },
              select: {
                id: true,
              },
            },
          },
        })
        .then((subtests) => {
          return subtests.map((subtest) => {
            let correctCount = 0;

            subtest.questions.forEach((question) => {
              question.userAnswers.forEach((userAnswer) => {
                if (question.correctAnswerChoice !== null) {
                  if (
                    userAnswer.answerChoice === question.correctAnswerChoice
                  ) {
                    correctCount++;
                  }
                } else if (userAnswer.essayAnswer !== null) {
                  const correctEssayAnswer =
                    userAnswer.essayAnswer.trim().toLowerCase() ===
                    question.answers[0]?.content.trim().toLowerCase();
                  if (correctEssayAnswer) {
                    correctCount++;
                  }
                }
              });
            });

            return {
              ...subtest,
              hasQuizSession: subtest.quizSession.length > 0,
              _count: {
                questions: subtest._count.questions,
                correct: correctCount,
              },
            };
          });
        });
    }),

  getDrill: userProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    return await ctx.db.subtest
      .findMany({
        where: {
          package: {
            type: "drill",
          },
          quizSession: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
          duration: true,
          type: true,
          _count: {
            select: {
              questions: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            select: {
              id: true,
              userAnswers: {
                where: {
                  userId: userId,
                },
                select: {
                  answerChoice: true,
                  essayAnswer: true,
                },
              },
              correctAnswerChoice: true,
              answers: true,
            },
          },
          quizSession: {
            where: {
              userId: userId,
            },
            select: {
              id: true,
            },
          },
        },
      })
      .then((subtests) => {
        return subtests.map((subtest) => {
          let correctCount = 0;

          subtest.questions.forEach((question) => {
            question.userAnswers.forEach((userAnswer) => {
              if (question.correctAnswerChoice !== null) {
                if (userAnswer.answerChoice === question.correctAnswerChoice) {
                  correctCount++;
                }
              } else if (userAnswer.essayAnswer !== null) {
                const correctEssayAnswer =
                  userAnswer.essayAnswer.trim().toLowerCase() ===
                  question.answers[0]?.content.trim().toLowerCase();
                if (correctEssayAnswer) {
                  correctCount++;
                }
              }
            });
          });

          const transformedSubtest = {
            ...subtest,
            sessionId: subtest.quizSession[0].id,
            _count: {
              questions: subtest._count.questions,
              correct: correctCount,
            },
          };
          delete transformedSubtest.questions;
          delete transformedSubtest.quizSession;
          return transformedSubtest;
        });
      });
  }),

  getTryout: userProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryouts = await ctx.db.package
      .findMany({
        where: {
          type: "tryout",
          TOend: {
            lte: new Date(),
          },
          quizSession: {
            some: {
              userId: userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          TOstart: true,
          TOend: true,
          quizSession: {
            where: {
              userId: userId,
            },
            select: {
              id: true,
              userAnswers: {
                select: {
                  questionId: true,
                  answerChoice: true,
                  essayAnswer: true,
                  question: {
                    select: {
                      id: true,
                      correctAnswerChoice: true,
                      score: true,
                      answers: {
                        select: {
                          content: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          subtests: {
            select: {
              id: true,
              type: true,
              packageId: true,
              questions: {
                select: {
                  id: true,
                  correctAnswerChoice: true,
                  score: true,
                  type: true,
                  answers: {
                    select: {
                      content: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((packages) => {
        return packages.map((pkg) => {
          const subtests = pkg.subtests.map((subtest) => {
            let correctCount = 0;
            let totalScore = 0;
            let totalQuestions = 0;

            subtest.questions.forEach((question) => {
              const userAnswersForQuestion = pkg.quizSession.flatMap(
                (session) =>
                  session.userAnswers.filter(
                    (userAnswer) => userAnswer.questionId === question.id,
                  ),
              );

              userAnswersForQuestion.forEach((userAnswer) => {
                totalQuestions++;

                if (question.correctAnswerChoice !== null) {
                  if (
                    userAnswer.answerChoice === question.correctAnswerChoice
                  ) {
                    correctCount++;
                    totalScore += question.score;
                  }
                } else if (userAnswer.essayAnswer !== null) {
                  const isEssayCorrect =
                    userAnswer.essayAnswer.trim().toLowerCase() ===
                    question.answers[0]?.content.trim().toLowerCase();
                  if (isEssayCorrect) {
                    correctCount++;
                    totalScore += question.score;
                  }
                }
              });
            });

            return {
              id: subtest.id,
              name: subtest.type,
              sessionId: pkg.quizSession[0].id,
              correct: correctCount,
              all: totalQuestions,
              score: totalScore,
            };
          });

          const totalCorrect = subtests.reduce(
            (total, subtest) => total + subtest.correct,
            0,
          );
          const totalAll = subtests.reduce(
            (total, subtest) => total + subtest.all,
            0,
          );
          const totalScore = subtests.reduce(
            (total, subtest) => total + subtest.score,
            0,
          );

          return {
            id: pkg.id,
            name: pkg.name,
            correct: totalCorrect,
            all: totalAll,
            score: subtests.length > 0 ? totalScore / subtests.length : 0,
            subtest: subtests,
          };
        });
      });

    return tryouts;
  }),
});
