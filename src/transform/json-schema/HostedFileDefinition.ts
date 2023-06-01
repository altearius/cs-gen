import S from 'fluent-json-schema';

export default function HostedFileDefinition() {
	return S.object()
		.prop('uid', S.string())
		.prop('created_at', S.string().format('date-time'))
		.prop('updated_at', S.string().format('date-time'))
		.prop('created_by', S.string())
		.prop('updated_by', S.string())
		.prop('content_type', S.string())
		.prop('file_size', S.string().pattern(/^\d+$/u))
		.prop('tags', S.array().items(S.string()))
		.prop('filename', S.string())
		.prop('url', S.string().format('uri'))
		.prop('title', S.string())
		.required([
			'uid',
			'created_at',
			'updated_at',
			'created_by',
			'updated_by',
			'content_type',
			'file_size',
			'tags',
			'filename',
			'url',
			'title'
		]);
}
