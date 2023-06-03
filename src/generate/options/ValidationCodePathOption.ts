import { resolve } from 'node:path';

import { Option } from 'commander';

const ValidationCodePathOption = new Option(
	'--output-validation-code <path>',
	'Output validation code to a folder.'
);

ValidationCodePathOption.default(resolve('validation.js'));
ValidationCodePathOption.env('Cs_gen_validation_code_path');
ValidationCodePathOption.argParser(resolve);
export default ValidationCodePathOption;
