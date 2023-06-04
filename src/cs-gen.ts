#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';

import GenerateCommand from './generate/GenerateCommand.js';

dotenv.config();

const program = new Command('cs-gen');
program.description('Generate type definitions for Contentstack content types');

program.addCommand(GenerateCommand);
await program.parseAsync();
