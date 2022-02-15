import { buildSubgraphSchema } from '@apollo/subgraph'
import { ApolloServer, gql } from 'apollo-server'
import fetch from 'cross-fetch'
import deepMerge from 'deepmerge'
import type { DefinitionNode, DocumentNode } from 'graphql'
import { buildClientSchema, getIntrospectionQuery, parse, print, printSchema } from 'graphql'
import type { FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql/language/ast.js'
import { identity } from 'lodash'
import { resolve } from 'path'
import { ContentfulAPI } from './ContentfulAPI.js'

interface CreateContentfulServerOptions {
  space: string
  accessToken: string
  schemaAdditions?: string
  modifySchema?: (ast: DocumentNode) => void
  additionalResolvers?: any
  contentfulAPI?: any
}

/**
 * @param options The options for the creation of the Apollo Federation enabled Contentful server.
 * @param options.space The Contentful space id.
 * @param options.accessToken The Contentful API access token.
 * @param options.schemaAdditions Additional GraphQL schema definitions.
 * @param options.modifySchema A function that receives the AST of the Contentful GraphQL schema, which can modify the schema.
 * @param options.additionalResolvers Additional Apollo Server resolvers for the Apollo server.
 * @param options.contentfulAPI An instance of the ContentfulAPI or a subclass, which allows adding additional methods to it.
 */
export async function createApolloFederationEnabledContentfulServer(
  {
    space,
    accessToken,
    schemaAdditions,
    modifySchema,
    additionalResolvers,
    contentfulAPI
  }: CreateContentfulServerOptions,
): Promise<{server: ApolloServer, schema: string}> {
  additionalResolvers = additionalResolvers || {}

  const schemaText = await generateSchema({
    space,
    accessToken,
    schemaAdditions,
    modifySchema,
  })
  const typeDefs = gql`${schemaText}`
  const resolvers = deepMerge<any>(generateResolvers(schemaText), additionalResolvers)
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    resolvers,
    dataSources: () => {
      return {
        contentfulAPI: contentfulAPI || new ContentfulAPI({ space, accessToken }),
      }
    },
  })
  return {
    server,
    schema: schemaText
  }
}

export async function downloadSchema({ space, accessToken }: { space: string, accessToken: string }): Promise<string> {
  const query = getIntrospectionQuery()
  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${ space }?access_token=${ accessToken }`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    },
  )
  const data = JSON.parse(await response.text())
  const schema = buildClientSchema(data.data)
  const schemaText = printSchema(schema)

  return schemaText
}

interface GenerateSchemaOptions {
  space: string
  accessToken: string
  schemaAdditions?: string
  modifySchema?: (ast: DocumentNode) => void
}

export async function generateSchema({
  space,
  accessToken,
  schemaAdditions,
  modifySchema,
}: GenerateSchemaOptions): Promise<string> {
  modifySchema = modifySchema || identity

  const schemaText = await downloadSchema({ space, accessToken })
  const schemaTextWithAdditions = schemaText + '\n\n' + (schemaAdditions ?? '')
  const ast = parse(schemaTextWithAdditions)

  addPrimaryKeys(ast)

  const sysTypeNode: any = ast.definitions.find((node: any) => node.name.value === 'Sys')!
  addKeyDirectiveToNode(sysTypeNode, 'id')

  modifySchema(ast)

  const text = print(ast)

  return text
}

export function addPrimaryKeys(ast: DocumentNode): void {
  const nodes = ast.definitions.filter(isObjectTypeDefinitionWithSysField)
  nodes.forEach(node => addKeyDirectiveToNode(node, 'sys { id }'))
}

export function isObjectTypeDefinitionWithSysField(node: DefinitionNode): boolean {
  return Boolean(
    node.kind === 'ObjectTypeDefinition' &&
    node.fields?.some(isSysField),
  )
}

export function isSysField(field: FieldDefinitionNode): boolean {
  return field.name.value === 'sys' && (field.type as any).type.name.value === 'Sys'
}

export function addKeyDirectiveToNode(node: any, id: string): void {
  node.directives.push({
    kind: 'Directive',
    name: {
      kind: 'Name',
      value: 'key',
    },
    arguments: [
      {
        kind: 'Argument',
        name: {
          kind: 'Name',
          value: 'fields',
        },
        value: {
          kind: 'StringValue',
          value: id,
          block: false,
        },
      },
    ],
  })
}

export function removeArgumentsFromField(node: any, fieldName: string) {
  const field = node.fields.find((field: any) => field.name.value === fieldName)
  if (field) {
    field.arguments = []
  } else {
    throw new Error(`Field "${ fieldName } not found on node."`)
  }
}

export function generateResolvers(schema: string): any {
  const resolvers: any = {
    Query: {},
  }
  const ast = parse(schema)

  const queryField = ast.definitions.find(
    (node: DefinitionNode) => node.kind === 'ObjectTypeDefinition' && node.name.value === 'Query',
  )! as ObjectTypeDefinitionNode

  for (const field of queryField.fields!) {
    const fieldName = field.name.value
    resolvers.Query[fieldName] =
      async function query(_: any, __: any, { dataSources }: any, info: any): Promise<any> {
        const operationString = print(info.operation)
        const response = await dataSources.contentfulAPI.query(operationString)
        return response.body.data[fieldName]
      }
  }

  return resolvers
}
