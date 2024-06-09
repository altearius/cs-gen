#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import GenerateCommand from './generate/GenerateCommand.js';

const resolvedEnv = dotenv.config();
dotenvExpand.expand(resolvedEnv);

const program = new Command('cs-gen');
program.description('Generate type definitions for Contentstack content types');

program.addCommand(GenerateCommand);
await program.parseAsync();
