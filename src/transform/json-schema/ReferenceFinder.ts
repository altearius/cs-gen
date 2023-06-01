import type IContentType from '../../models/IContentType.js';
import type {
	IBlocksContentField,
	IContentField
} from '../../pull/ContentField.schema.js';

export default class ReferenceFinder {
	public constructor(
		private readonly _map: ReadonlyMap<string, IContentType>
	) {}

	public *findReferencesIn(fields: readonly IContentField[]) {
		for (const field of fields) {
			yield* this.findReferencesInField(field);
		}
	}

	private *findReferencesInField(field: IContentField) {
		if (field.data_type === 'blocks') {
			yield* this.findReferencesInBlock(field);
		}
	}

	private *findReferencesInBlock(field: IBlocksContentField) {
		for (const { reference_to: reference } of field.blocks) {
			if (typeof reference !== 'string') {
				continue;
			}

			const contentType = this._map.get(reference);
			if (!contentType) {
				throw new Error(`Cannot find referenced content type: ${reference}`);
			}

			yield contentType;
		}
	}
}
