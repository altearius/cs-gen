import { resolve } from 'node:path';

import { Option } from 'commander';

const JsonSchemaPathOption = new Option(
	'--output-json-schema <path>',
	'Output JSON schema to a file.'
);

JsonSchemaPathOption.default(resolve('ContentTypes.schema.json'));
JsonSchemaPathOption.env('Cs_gen_json_schema_path');
JsonSchemaPathOption.argParser(resolve);
export default JsonSchemaPathOption;
