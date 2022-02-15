"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentfulAPI = void 0;
const apollo_datasource_http_1 = require("apollo-datasource-http");
class ContentfulAPI extends apollo_datasource_http_1.HTTPDataSource {
    _space;
    _accessToken;
    constructor({ space, accessToken }) {
        super('https://graphql.contentful.com');
        this._space = space;
        this._accessToken = accessToken;
    }
    async query(query) {
        return this.post(`/content/v1/spaces/${this._space}`, {
            query: {
                access_token: this._accessToken
            },
            body: {
                query
            }
        });
    }
}
exports.ContentfulAPI = ContentfulAPI;
//# sourceMappingURL=ContentfulAPI.js.map