import { resolve } from 'node:path';

import { Option } from 'commander';

const TypeScriptPathOption = new Option(
	'--output-typescript-definitions <path>',
	'Output TypeScript definitions to a file.'
);

TypeScriptPathOption.env('Cs_gen_typescript_path');
TypeScriptPathOption.argParser((path) => resolve(path));
export default TypeScriptPathOption;
