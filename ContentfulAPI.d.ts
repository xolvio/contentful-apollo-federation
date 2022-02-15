import { HTTPDataSource } from 'apollo-datasource-http';
export declare class ContentfulAPI extends HTTPDataSource {
    _space: string;
    _accessToken: string;
    /**
     * @param options
     * @param options.space The Contentful space id.
     * @param options.accessToken The Contentful API access token.
     */
    constructor({ space, accessToken }: {
        space: string;
        accessToken: string;
    });
    query(query: string): Promise<import("apollo-datasource-http").Response<unknown>>;
}
//# sourceMappingURL=ContentfulAPI.d.ts.map