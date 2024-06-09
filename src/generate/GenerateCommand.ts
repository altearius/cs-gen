import c from 'ansi-colors';
import { Command } from 'commander';
import type IOptions from '../models/IOptions.js';
import Generate from './Generate.js';
import ApiKeyOption from './options/ApiKeyOption.js';
import BaseUrlOption from './options/BaseUrlOption.js';
import BranchOption from './options/BranchOption.js';
import JsonSchemaPathOption from './options/JsonSchemaPathOption.js';
import ManagementTokenOption from './options/ManagementTokenOption.js';
import PrefixOption from './options/PrefixOption.js';
import ResponsePathOption from './options/ResponsePathOption.js';
import TypeScriptPathOption from './options/TypeScriptPathOption.js';
import ValidationCodePathOption from './options/ValidationCodePathOption.js';

const GenerateCommand = new Command('generate')
	.description('Generate TypeScript definitions from Contentstack')
	.addOption(ApiKeyOption)
	.addOption(BaseUrlOption)
	.addOption(BranchOption)
	.addOption(JsonSchemaPathOption)
	.addOption(ManagementTokenOption)
	.addOption(PrefixOption)
	.addOption(ResponsePathOption)
	.addOption(TypeScriptPathOption)
	.addOption(ValidationCodePathOption);

GenerateCommand.action(async (options: IOptions) => {
	const { jsonSchemaPath, validationPath, typescriptPath, responsePath } =
		options;

	if (!jsonSchemaPath && !validationPath && !typescriptPath && !responsePath) {
		console.error(c.red('No output specified.'));
		return;
	}

	await Generate(options);
});

export default GenerateCommand;
