import { ApolloServer } from 'apollo-server';
import type { DefinitionNode, DocumentNode } from 'graphql';
import type { FieldDefinitionNode } from 'graphql/language/ast.js';
interface CreateContentfulServerOptions {
    space: string;
    accessToken: string;
    schemaAdditions?: string;
    modifySchema?: (ast: DocumentNode) => void;
    additionalResolvers?: any;
    contentfulAPI?: any;
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
export declare function createApolloFederationEnabledContentfulServer({ space, accessToken, schemaAdditions, modifySchema, additionalResolvers, contentfulAPI }: CreateContentfulServerOptions): Promise<{
    server: ApolloServer;
    schema: string;
}>;
export declare function downloadSchema({ space, accessToken }: {
    space: string;
    accessToken: string;
}): Promise<string>;
interface GenerateSchemaOptions {
    space: string;
    accessToken: string;
    schemaAdditions?: string;
    modifySchema?: (ast: DocumentNode) => void;
}
export declare function generateSchema({ space, accessToken, schemaAdditions, modifySchema, }: GenerateSchemaOptions): Promise<string>;
export declare function addPrimaryKeys(ast: DocumentNode): void;
export declare function isObjectTypeDefinitionWithSysField(node: DefinitionNode): boolean;
export declare function isSysField(field: FieldDefinitionNode): boolean;
export declare function addKeyDirectiveToNode(node: any, id: string): void;
export declare function removeArgumentsFromField(node: any, fieldName: string): void;
export declare function generateResolvers(schema: string): any;
export {};
//# sourceMappingURL=index.d.ts.map