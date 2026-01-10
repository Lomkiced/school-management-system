// FILE: server/prisma/seed-quiz.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Creating Test Quiz...");
  
  // Find the first class
  const cls = await prisma.class.findFirst();
  if (!cls) throw new Error("No class found. Run 'npm run seed' first.");

  // Create Quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: "Computer Science 101 Midterm",
      description: "A test quiz generated for demonstration.",
      duration: 30, // 30 minutes
      passingScore: 50,
      classId: cls.id,
      isActive: true,
      questions: {
        create: [
          {
            text: "What does HTML stand for?",
            points: 10,
            type: "MULTIPLE_CHOICE",
            options: {
              create: [
                { text: "Hyper Text Markup Language", isCorrect: true },
                { text: "High Tech Modern Language", isCorrect: false },
                { text: "Hyperlink Text Mode", isCorrect: false }
              ]
            }
          },
          {
            text: "React is a backend framework.",
            points: 10,
            type: "TRUE_FALSE",
            options: {
              create: [
                { text: "True", isCorrect: false },
                { text: "False", isCorrect: true }
              ]
            }
          }
        ]
      }
    }
  });

  console.log(`✅ Quiz Created! ID: ${quiz.id}`);
  console.log(`👉 Test URL: http://localhost:5173/quiz/${quiz.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());