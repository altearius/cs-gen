import type { ContentType } from '../../models/ContentType.schema.yaml';
import type { Field } from '../../models/Field.schema.yaml';
import type { GlobalField } from '../../pull/GetGlobalFields.js';

export default class ReferenceFinder {
	public constructor(
		private readonly _map: ReadonlyMap<string, ContentType | GlobalField>
	) {}

	public *findReferencesIn(fields: readonly Field[]) {
		for (const field of fields) {
			yield* this.findReferencesInField(field);
		}
	}

	private *findReferencesInField(field: Field) {
		if ('taxonomies' in field) {
			return;
		}

		if (field.data_type === 'blocks') {
			yield* this.findReferencesInBlock(field);
		}
	}

	private *findReferencesInBlock(
		field: Extract<Field, { data_type: 'blocks' }>
	) {
		for (const block of field.blocks) {
			const { reference_to } = block;
			if (!reference_to) {
				continue;
			}

			const contentType = this._map.get(reference_to);
			if (!contentType) {
				const msg1 = `Block ${block.title} [${block.uid}] references content'`;
				const msg2 = `type ${reference_to}, which cannot be found.`;
				const msg = `${msg1} ${msg2}`;
				throw new Error(msg);
			}

			yield contentType;
		}
	}
}
