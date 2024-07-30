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
import TsBannerOption from './options/TsBannerOption.js';
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
	.addOption(TsBannerOption)
	.addOption(ValidationCodePathOption);

type CommandOptions = Omit<IOptions, 'filter' | 'typescriptOptions'> & {
	readonly bannerComment?: string;
	readonly maxItems?: number;
	readonly include?: readonly string[];
	readonly exclude?: readonly string[];
};

GenerateCommand.action(async (options: CommandOptions) => {
	const { jsonSchemaPath, validationPath, typescriptPath, responsePath } =
		options;

	if (!jsonSchemaPath && !validationPath && !typescriptPath && !responsePath) {
		console.error(c.red('No output specified.'));
		return;
	}

	await Generate({
		...options,
		filter: generateFilter(options),
		typescriptOptions: generateTypescriptOptions(options)
	});
});

export default GenerateCommand;

function generateFilter({ include, exclude }: CommandOptions) {
	const included = new Set(include);
	const excluded = new Set(exclude);

	if (include) {
		return (uid: string) => included.has(uid) && !excluded.has(uid);
	}

	return (uid: string) => !excluded.has(uid);
}

function generateTypescriptOptions({
	bannerComment,
	maxItems
}: CommandOptions) {
	return {
		...(bannerComment ? { bannerComment } : {}),
		...(typeof maxItems === 'number' ? { maxItems } : {})
	};
}
