import { HTTPDataSource } from 'apollo-datasource-http'
import { verifyThatContentfulEnvironmentVariablesAreSet } from './verifyThatContentfulEnvironmentVariablesAreSet.js'

export class ContentfulAPI extends HTTPDataSource {
  _space: string
  _accessToken: string

  constructor({space, accessToken}: {space: string, accessToken: string}) {
    super('https://graphql.contentful.com')
    this._space = space
    this._accessToken = accessToken
  }

  async query(query: string) {
    verifyThatContentfulEnvironmentVariablesAreSet()

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
