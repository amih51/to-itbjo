import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const db = new PrismaClient();

async function main() {
  console.log("Seeding data...");

  // Generate Random Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      db.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: faker.helpers.arrayElement(["user", "teacher", "admin"]),
          image: faker.image.avatar(),
        },
      }),
    ),
  );

  // Generate Random Classes
  const classes = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      db.class.create({
        data: {
          name: faker.commerce.department(),
        },
      }),
    ),
  );

  // Connect Random Users to Random Classes
  for (const user of users) {
    const randomClass = faker.helpers.arrayElement(classes);
    await db.class.update({
      where: { id: randomClass.id },
      data: {
        users: {
          connect: { id: user.id },
        },
      },
    });
  }

  // Generate Random Packages for Classes
  const packages = [];
  for (const classItem of classes) {
    for (let i = 0; i < 5; i++) {
      const TOstart = faker.date.recent({ days: 7 });
      const TOend = faker.date.soon({ refDate: TOstart, days: 7 });
      const newPackage = await db.package.create({
        data: {
          name: faker.company.catchPhrase(),
          type: faker.helpers.arrayElement(["tryout", "drill"]),
          TOstart,
          TOend,
          classId: classItem.id,
        },
      });
      packages.push(newPackage);
    }
  }

  // Generate Random Subtests for Packages
  for (const packageItem of packages) {
    for (let i = 0; i < 3; i++) {
      const subtest = await db.subtest.create({
        data: {
          type: faker.helpers.arrayElement([
            "pu",
            "ppu",
            "pbm",
            "pk",
            "pm",
            "lbe",
            "lbi",
          ]),
          duration: faker.number.int({ min: 10, max: 60, multipleOf: 5 }),
          packageId: packageItem.id,
        },
      });

      // Generate Random Questions and Answers for Subtest
      for (let j = 0; j < 5; j++) {
        const question = await db.question.create({
          data: {
            index: j + 1,
            content: faker.word.words({ count: { min: 5, max: 50 } }),
            imageUrl: faker.image.url(),
            type: faker.helpers.arrayElement(["essay", "mulChoice"]),
            score: faker.number.int({ min: 5, max: 50 }),
            packageId: packageItem.id,
            subtestId: subtest.id,
          },
        });

        // Generate Answers for Question
        const answers = await Promise.all(
          Array.from({ length: 4 }).map((_, index) =>
            db.answer.create({
              data: {
                index: index + 1,
                content: faker.word.words({ count: { min: 1, max: 20 } }),
                questionId: question.id,
              },
            }),
          ),
        );

        // Assign Correct Answer Randomly
        const correctAnswer = faker.helpers.arrayElement(answers);
        await db.question.update({
          where: { id: question.id },
          data: { correctAnswerChoice: correctAnswer.index },
        });
      }
    }
  }

  // Generate Random QuizSessions and UserAnswers
  for (const user of users) {
    for (const packageItem of packages) {
      const subtests = await db.subtest.findMany({
        where: { packageId: packageItem.id },
      });
      for (const subtest of subtests) {
        const quizSession = await db.quizSession.create({
          data: {
            userId: user.id,
            packageId: packageItem.id,
            subtestId: subtest.id,
            duration: faker.number.int({
              min: 10,
              max: 60,
              multipleOf: 10,
            }),
          },
        });

        const questions = await db.question.findMany({
          where: { subtestId: subtest.id },
        });
        for (const question of questions) {
          const randomAnswer = faker.number.int({ min: 1, max: 4 });
          await db.userAnswer.create({
            data: {
              answerChoice: randomAnswer,
              questionId: question.id,
              userId: user.id,
              packageId: packageItem.id,
              quizSessionId: quizSession.id,
            },
          });
        }
      }
    }
  }

  // Generate Random Videos
  const fetchYouTubeVideos = async (query, maxResults = 10) => {
    const url = "https://www.googleapis.com/youtube/v3/search";
    try {
      const response = await axios.get(url, {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          maxResults,
          key: process.env.GOOGLE_API_KEY,
        },
      });

      return response.data.items.map((item) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      return [];
    }
  };

  const searchQuery = "belajar utbk";

  const videos = await fetchYouTubeVideos(searchQuery, 15);

  if (videos.length === 0) {
    console.log("No videos fetched from YouTube.");
    return;
  }

  try {
    await db.video.createMany({
      data: videos.map((video) => ({
        title: video.title,
        description: video.description,
        url: video.url,
      })),
      skipDuplicates: true,
    });
    console.log(
      `Successfully created ${videos.length} videos from YouTube API.`,
    );
  } catch (error) {
    console.error("Error creating videos:", error);
  }

  // Generate Random Folders
  const folders = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      db.folder.create({
        data: {
          name: faker.word.words(),
          description: faker.lorem.sentence(),
        },
      }),
    ),
  );

  // Generate Random Files for Each Folder
  for (const folder of folders) {
    await Promise.all(
      Array.from({ length: 10 }).map(() =>
        db.file.create({
          data: {
            title: faker.word.words(),
            description: faker.lorem.sentence(),
            url: faker.helpers.arrayElement([
              `https://picsum.photos/200/300?random=${faker.number.int()}`,
              `https://via.placeholder.com/150?text=${faker.lorem.word()}`,
            ]),
            folderId: folder.id,
          },
        }),
      ),
    );
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
