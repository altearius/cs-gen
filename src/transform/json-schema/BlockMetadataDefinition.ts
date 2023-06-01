import S from 'fluent-json-schema';

export default function BlockMetadataDefinition() {
	return S.object()
		.required(['_metadata'])
		.prop('_metadata', S.object().required(['uid']).prop('uid', S.string()));
}
