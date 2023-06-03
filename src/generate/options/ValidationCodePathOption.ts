import { resolve } from 'node:path';

import { Option } from 'commander';

const ValidationCodePathOption = new Option(
	'--validation-path <path>',
	'Output validation code to a folder.'
);

ValidationCodePathOption.env('Cs_gen_validation_path');
ValidationCodePathOption.argParser((path) => resolve(path));
export default ValidationCodePathOption;
