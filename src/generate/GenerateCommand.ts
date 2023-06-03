import c from 'ansi-colors';
import { Command } from 'commander';

import ExecutionContext from '../services/ExecutionContext.js';

import Generate from './Generate.js';

const GenerateCommand = new Command('generate');

GenerateCommand.option(
	'-p, --prefix <prefix>',
	'Add a prefix for TypeScript interface names.',
	'I-'
);

interface IGenerateOptions {
	prefix?: string;
}

GenerateCommand.action(async (options: IGenerateOptions) => {
	const ctx = await ExecutionContext.create();

	try {
		await Generate(ctx, options.prefix ?? 'I-');
	} finally {
		const removed = await ExecutionContext.removeStaleRuns();
		const noun = removed.length === 1 ? 'run' : 'runs';
		const stale = c.yellow(removed.length.toLocaleString());
		console.log(`Removed ${stale} stale ${noun}.`);
	}
});

export default GenerateCommand;
