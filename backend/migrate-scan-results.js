import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScanResult from './models/ScanResult.js';
import AnswerKey from './models/AnswerKey.js';

dotenv.config();

const migrateScanResults = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        // Find all scan results that don't have correctAnswer in their answers
        const results = await ScanResult.find({});
        console.log(`Found ${results.length} scan results to check`);

        let updatedCount = 0;

        for (const result of results) {
            // Check if any answer is missing correctAnswer
            const needsUpdate = result.answers.some(answer => !answer.correctAnswer);

            if (needsUpdate) {
                // Get the answer key for this result
                const answerKey = await AnswerKey.findById(result.answerKeyId);

                if (answerKey) {
                    // Update each answer with the correct answer from the answer key
                    result.answers = result.answers.map((answer, index) => {
                        const question = answerKey.questions[index];
                        return {
                            ...answer.toObject(),
                            correctAnswer: question ? question.correctAnswer : null
                        };
                    });

                    await result.save();
                    updatedCount++;
                    console.log(`Updated result ${result._id} for student: ${result.studentName}`);
                } else {
                    console.log(`Warning: Answer key not found for result ${result._id}`);
                }
            }
        }

        console.log(`\nMigration completed!`);
        console.log(`Total results checked: ${results.length}`);
        console.log(`Results updated: ${updatedCount}`);
        console.log(`Results already up-to-date: ${results.length - updatedCount}`);

        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateScanResults();
