"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentfulAPI = void 0;
const apollo_datasource_http_1 = require("apollo-datasource-http");
const verifyThatContentfulEnvironmentVariablesAreSet_js_1 = require("./verifyThatContentfulEnvironmentVariablesAreSet.js");
class ContentfulAPI extends apollo_datasource_http_1.HTTPDataSource {
    _space;
    _accessToken;
    constructor({ space, accessToken }) {
        super('https://graphql.contentful.com');
        this._space = space;
        this._accessToken = accessToken;
    }
    async query(query) {
        (0, verifyThatContentfulEnvironmentVariablesAreSet_js_1.verifyThatContentfulEnvironmentVariablesAreSet)();
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