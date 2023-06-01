import type { IGetAllContentTypesResponse } from "../pull/GetAllContentTypesResponse.schema.js";

type IContentType = IGetAllContentTypesResponse['content_types'][number];

export default IContentType;
