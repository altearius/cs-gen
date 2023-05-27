import { Command } from 'commander';
import dotenv from 'dotenv';

import GenerateCommand from './generate/GenerateCommand.js';

dotenv.config({ debug: true });

const program = new Command('contentstack-type-gen');

program.description(
	'Generate standard-compliant type definitions for Contentstack content types'
);

program.addCommand(GenerateCommand);
await program.parseAsync();
