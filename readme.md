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
Contentstack CLI Tsgen plugin. Unlike the Tsgen plugin, `cs-gen` does not
require the Contentstack CLI to be installed, and `cs-gen` can more easily
be configured with project-specific defaults using a `.env` file.

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

If you will be using the generated validation code, your project must also
take a run-time dependency to [Ajv][6]:

```bash
yarn add ajv
```

## Usage

`cs-gen` can generate JSON Schema documents, TypeScript definitions, and
standalone validation code.

A CLI is provided:

```bash
cs-gen generate [...options]
```

By default, it will output _nothing_; you must tell it what sort of output
you want. This is done with one of the following options:

- `--json-schema-path`
- `--response-path`
- `--typescript-path`
- `--validation-path`

### Options

All options may also be provided as environment variables. `cs-gen` honors
any `.env` file it finds in the working directory.

| Option             | Environment Variable    | Description                  |
| ------------------ | ----------------------- | ---------------------------- |
| --api-key          | Cs_gen_api_key          | Contentstack API key         |
| --base-url         | Cs_gen_base_url         | Contentstack API base URL    |
| --branch           | Cs_gen_branch           | Contentstack branch          |
| --json-schema-path | Cs_gen_json_schema_path | Output a JSON schema         |
| --management-token | Cs_gen_management_token | API management token         |
| --prefix           | Cs_gen_prefix           | Prefix for TS interfaces     |
| --response-path    | Cs_gen_response_path    | Output raw API responses     |
| --typescript-path  | Cs_gen_typescript_path  | Output TypeScript interfaces |
| --validation-path  | Cs_gen_validation_path  | Output validation code       |

## Example

All examples assume that the `.env` file has been configured with values for
`Cs_gen_api_key`, `Cs_gen_base_url`, and `Cs_gen_management_token` that are
appropriate for the given project.

Output TypeScript interface definitions only:

```bash
yarn cs-gen generate --typescript-path ./models/Contentstack.d.ts
```

Output both a JSON Schema and JavaScript validation code:

```bash
yarn cs-gen generate \
  --json-schema-path ./Contentstack.schema.json \
  --validation-path ./src/validation
```

## Limitations

I am not sure how to handle the `json` data type provided by the Contentstack
JSON-RTE editor.

TSgen currently types this field as `any`.

I can't find documentation for it.

If I examine the current output for an entity with this field, it is an object.

One of the properties of that object is named `_version` that presently has a
value of `9`. So I guess there are other versions?

I could try to reverse-engineer this. It would look something like:

```ts
const name = this.getOrCreateJsonDefinition();
const ref = S.ref(`#/definitions/${name}`);
const multiple = handleMultiple(field, ref);
return applyBaseFieldsFrom(field).to(multiple);
```

Where `getOrCreateJsonDefinition` would create a definition like this:

```ts
S.object()
  .required(['attrs', 'children', 'uid'])
  .prop('uid', S.string())
  .prop('attrs', S.object()) // <-- unclear what goes here
  .prop(
    'children',
    S.array().items(
      S.oneOf([
        S.ref(`#/definitions/${name}`), // <-- self-referential
        S.object().required(['text']).prop('text', S.string())
      ])
    )
  );
```

But the `_version` number and lack of documentation scares me. Maybe if I
could find the docs for this and a roadmap for future version iterations,
it would make more sense. As it is, it seems complex and in flux, and
I'm worried that this target is moving too quickly to hit. Perhaps it is
better to leave this as "any" until I can find more information.

Or maybe, is it always going to be an object? Is that a safe bet?
I could imagine it being a string in some cases, if there's some way to
have the server render HTML that I just don't know about yet.

## TODO

It should be possible to improve performance by keeping a "last built state"
for each content type and only re-generating the ones that have changed since
the last run.

---

It should be possible to generate some TypeScript wrappers around each bit
of standalone validation code. Looks like this:

```ts
import type { ValidateFunction } from 'ajv';
import type { IHomepage } from '../models.d.ts';
import validation from './homepage.js';
export default validation as ValidateFunction<IHomepage>;
```

---

In my project, I have a structure like this:

```ts
const enum ContentType {
  Settings = 'settings',
  Homepage = 'homepage'
}
```

This gives me intellisense support for the different content types that I have
in my stack. Right now, I have to maintain this manually. I could be generating
this instead.

---

It would be nice to be able to white-list or black-list specific content types
for the generation process. Might not need every possible content type.

---

Right now, all TypeScript types get dumped into one large file, which I guess
is fine, but it would be neater if we could separate them out.

---

Maintain a stable sort-order on as many generated files as possible. It will
help with source-control churn.

---

Provide ability to specify depth for array tuples before it gives up and
just makes a plain array.

[1]: https://json-schema.org/ 'JSON Schema'
[2]: https://github.com/bcherny/json-schema-to-typescript 'JSON Schema to TypeScript'
[3]: https://ajv.js.org/standalone.html 'Standalone validation code'
[4]: https://www.newtonsoft.com/json/help/html/JsonSchema.htm 'Validating JSON with JSON Schema'
[5]: https://www.contentstack.com/docs/developers/cli/tsgen-plugin/ 'Tsgen plugin'
[6]: https://ajv.js.org/ 'Ajv'
