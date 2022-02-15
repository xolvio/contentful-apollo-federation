import { HTTPDataSource } from 'apollo-datasource-http'

export class ContentfulAPI extends HTTPDataSource {
  _space: string
  _accessToken: string

  /**
   * @param options
   * @param options.space The Contentful space id.
   * @param options.accessToken The Contentful API access token.
   */
  constructor({space, accessToken}: {space: string, accessToken: string}) {
    super('https://graphql.contentful.com')
    this._space = space
    this._accessToken = accessToken
  }

  async query(query: string) {
    return this.post(
      `/content/v1/spaces/${ this._space }`, {
        query: {
          access_token: this._accessToken
        },
        body: {
          query
        }
      }
    )
  }
}
