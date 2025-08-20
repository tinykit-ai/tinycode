import readline from 'readline/promises';
import { CommandResult } from './commands';

type UserPromptOptions = {
    onCommand: (input: string) => CommandResult;
};

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

export const q = async (question: string): Promise<string> => {
	return (await rl.question(question)).trim();
};

export const userPrompt = async ({onCommand}: UserPromptOptions): Promise<string> => {
    const content = await q('> ');
    console.log(); // Add a newline for better readability

    const commandResult = onCommand(content);
    if (commandResult.handled) {
        return "";
    }

    return content;
};