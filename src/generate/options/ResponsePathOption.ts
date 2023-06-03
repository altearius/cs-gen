import { resolve } from 'node:path';

import { Option } from 'commander';

const ResponsePathOption = new Option(
	'--response-path <path>',
	'Retain Contentstack API responses in the provided folder.'
);

ResponsePathOption.env('Cs_gen_response_path');
ResponsePathOption.argParser(resolve);
export default ResponsePathOption;
