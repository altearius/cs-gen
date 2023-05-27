/* eslint-disable @typescript-eslint/naming-convention */
// Justification: Contenstack uses snake_case.

export default interface IContentstackField {
	readonly data_type: 'group' | 'text';
	readonly uid: string;
}
