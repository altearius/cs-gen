import type {
	ExtendedSchema,
	JSONSchema,
	NullSchema,
	ObjectSchema
} from 'fluent-json-schema';

type ISchema = Exclude<JSONSchema, ExtendedSchema | NullSchema> | ObjectSchema;
export default ISchema;

