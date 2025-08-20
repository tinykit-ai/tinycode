import readline from 'readline/promises';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

export const q = async (question: string): Promise<string> => {
	return (await rl.question(question)).trim();
};