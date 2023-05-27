import c from 'ansi-colors';
import { Command } from 'commander';

import ExecutionContext from '../services/ExecutionContext.js';

import Generate from './Generate.js';

const GenerateCommand = new Command('generate');

GenerateCommand.action(async () => {
	const ctx = await ExecutionContext.create();

	try {
		await Generate(ctx);
	} finally {
		const removed = await ExecutionContext.removeStaleRuns();
		const noun = removed.length === 1 ? 'run' : 'runs';

		const msg = `Removed ${c.yellow(
			removed.length.toLocaleString()
		)} stale ${noun}.`;

		console.log(msg);
	}
});

export default GenerateCommand;
