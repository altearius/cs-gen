import { Option } from 'commander';
import { resolve } from 'node:path';

const ResponsePathOption = new Option(
	'--response-path <path>',
	'Retain Contentstack API responses in the provided folder.'
);

ResponsePathOption.env('Cs_gen_response_path');
ResponsePathOption.argParser((path) => resolve(path));
export default ResponsePathOption;
