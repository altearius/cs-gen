import { resolve } from 'node:path';

import { Option } from 'commander';

const JsonSchemaPathOption = new Option(
	'--output-json-schema <path>',
	'Output JSON schema to a file.'
);

JsonSchemaPathOption.env('Cs_gen_json_schema_path');
JsonSchemaPathOption.argParser((path) => resolve(path));
export default JsonSchemaPathOption;
