import S from 'fluent-json-schema';

export default function LinkDefinition() {
	return S.object()
		.prop('title', S.string())
		.prop('href', S.string().format('uri'))
		.required(['title', 'href']);
}
