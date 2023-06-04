import S from 'fluent-json-schema';

export default function EntryDefinition() {
	return S.object().required(['uid']).prop('uid', S.string());
}
