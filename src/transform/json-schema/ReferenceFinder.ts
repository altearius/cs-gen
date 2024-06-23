import type { ContentType } from '../../models/ContentType.schema.yaml';
import { Field } from '../../models/Field.schema.yaml';

export default class ReferenceFinder {
	public constructor(private readonly _map: ReadonlyMap<string, ContentType>) {}

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
			if (!('reference_to' in block)) {
				continue;
			}

			const contentType = this._map.get(block.reference_to);
			if (!contentType) {
				const msg1 = `Block ${block.title} [${block.uid}] references content'`;
				const msg2 = `type ${block.reference_to}, which cannot be found.`;
				const msg = `${msg1} ${msg2}`;
				throw new Error(msg);
			}

			yield contentType;
		}
	}
}
