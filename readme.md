# Contentstack Code Generation

This utility examines a Contentstack account and generates code based on
the content types that it finds:

1. JSON Schema
2. TypeScript interfaces
3. Validation code

The JSON schema is broadly applicable and should be usable in any environment
with tooling to support it, for instance, it could be used with Newtonsoft.JSON
in a dotnet tool chain.

The TypeScript interfaces provide an alternative to those generated by the
Contentstack CLI Tsgen plugin.

The validation code is intended for run-time validation of entities received
through the Contentstack REST endpoint. The validation code will ensure that
the entities you receive match the interfaces that your code was compiled
against.

## Installation

`cs-gen` is designed to be installed as a dev dependency in your project:

```bash
npm install --save-dev cs-gen
```

or

```bash
yarn add --dev cs-gen
```

## Usage

`cs-gen` can generate JSON Schema documents, TypeScript definitions, and
standalone validation code.

A CLI is provided:

```bash
cs-gen generate [...options]
```

By default, it will output _nothing_; you must tell it what sort of output
you want.

### Options

All options may also be provided as environment variables. `cs-gen` honors
any `.env` file it finds in the working directory.

| Option             | Environment Variable    | Description                                   |
| ------------------ | ----------------------- | --------------------------------------------- |
| --api-key          | Cs_gen_api_key          | Contentstack API key                          |
| --base-url         | Cs_gen_base_url         | Contentstack API base URL                     |
| --branch           | Cs_gen_branch           | Contentstack branch                           |
| --json-schema-path | Cs_gen_json_schema_path | Output a JSON schema                          |
| --management-token | Cs_gen_management_token | API management token                          |
| --prefix           | Cs_gen_prefix           | Value prepended to TypeScript interface names |
| --response-path    | Cs_gen_response_path    | Output raw API responses                      |
| --typescript-path  | Cs_gen_typescript_path  | Output TypeScript interfaces                  |
| --validation-path  | Cs_gen_validation_path  | Output validation code                        |

## TODO

- Per-interface validation code.

[1]: https://json-schema.org/ 'JSON Schema'
[2]: https://github.com/bcherny/json-schema-to-typescript 'JSON Schema to TypeScript'
[3]: https://ajv.js.org/standalone.html 'Standalone validation code'
[4]: https://www.newtonsoft.com/json/help/html/JsonSchema.htm 'Validating JSON with JSON Schema'
[5]: https://www.contentstack.com/docs/developers/cli/tsgen-plugin/ 'Tsgen plugin'
