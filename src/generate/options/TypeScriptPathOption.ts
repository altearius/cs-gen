import { resolve } from 'node:path';

import { Option } from 'commander';

const TypeScriptPathOption = new Option(
	'--output-typescript-definitions <path>',
	'Output TypeScript definitions to a file.'
);

TypeScriptPathOption.default(resolve('ContentTypes.d.ts'));
TypeScriptPathOption.env('Cs_gen_typescript_path');
TypeScriptPathOption.argParser(resolve);
export default TypeScriptPathOption;
