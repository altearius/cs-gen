#!/usr/bin/env bash

yarn \
	json2ts \
		-i 'src/pull/ContentField.schema.json' \
		-o 'src/pull/ContentField.schema.d.ts' \
		--cwd src/pull \
		--format false \
		--unreachableDefinitions \
		--bannerComment ''

yarn \
	json2ts \
		-i 'src/pull/GetAllContentTypesResponse.schema.json' \
		-o 'src/pull/GetAllContentTypesResponse.schema.d.ts' \
		--cwd src/pull \
		--declareExternallyReferenced false \
		--format false \
		--bannerComment 'import type { IContentField } from "./ContentField.schema"'

yarn \
	json2ts \
		-i 'src/pull/GetAllGlobalFieldsResponse.schema.json' \
		-o 'src/pull/GetAllGlobalFieldsResponse.schema.d.ts' \
		--cwd src/pull \
		--declareExternallyReferenced false \
		--format false \
		--bannerComment 'import type { IContentField } from "./ContentField.schema"'

yarn prettier --write src/pull/*.schema.d.ts

