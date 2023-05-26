import { Command } from 'commander';

const program = new Command('contentstack-type-gen');

program.description(
	'Generate standard-compliant type definitions for Contentstack content types'
);

await program.parseAsync();
