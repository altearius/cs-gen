import S from 'fluent-json-schema';

export default function HostedFileDefinition() {
	return S.object()
		.prop('_version', S.number())
		.prop('ACL', S.array())
		.prop('content_type', S.string())
		.prop('created_at', S.string().format('date-time'))
		.prop('created_by', S.string())
		.prop('file_size', S.string().pattern(/^\d+$/u))
		.prop('filename', S.string())
		.prop('is_dir', S.boolean())
		.prop('parent_uid', S.string())
		.prop(
			'publish_details',
			S.object()
				.prop('environment', S.string())
				.prop('locale', S.string())
				.prop('time', S.string())
				.prop('user', S.string())
				.required(['environment', 'locale', 'time', 'user'])
		)
		.prop('tags', S.array().items(S.string()))
		.prop('title', S.string())
		.prop('uid', S.string())
		.prop('updated_at', S.string().format('date-time'))
		.prop('updated_by', S.string())
		.prop('url', S.string().format('uri'))
		.required([
			'_version',
			'ACL',
			'content_type',
			'created_at',
			'created_by',
			'file_size',
			'filename',
			'is_dir',
			'parent_uid',
			'publish_details',
			'tags',
			'title',
			'uid',
			'updated_at',
			'updated_by',
			'url'
		]);
}
