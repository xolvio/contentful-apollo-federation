"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResolvers = exports.removeArgumentsFromField = exports.addKeyDirectiveToNode = exports.isSysField = exports.isObjectTypeDefinitionWithSysField = exports.addPrimaryKeys = exports.generateSchema = exports.downloadSchema = exports.createApolloFederationEnabledContentfulServer = void 0;
const subgraph_1 = require("@apollo/subgraph");
const apollo_server_1 = require("apollo-server");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const graphql_1 = require("graphql");
const lodash_1 = require("lodash");
const ContentfulAPI_js_1 = require("./ContentfulAPI.js");
/**
 * @param options The options for the creation of the Apollo Federation enabled Contentful server.
 * @param options.space The Contentful space id.
 * @param options.accessToken The Contentful API access token.
 * @param options.schemaAdditions Additional GraphQL schema definitions.
 * @param options.modifySchema A function that receives the AST of the Contentful GraphQL schema, which can modify the schema.
 * @param options.additionalResolvers Additional Apollo Server resolvers for the Apollo server.
 * @param options.contentfulAPI An instance of the ContentfulAPI or a subclass, which allows adding additional methods to it.
 */
async function createApolloFederationEnabledContentfulServer({ space, accessToken, schemaAdditions, modifySchema, additionalResolvers, contentfulAPI }) {
    additionalResolvers = additionalResolvers || {};
    const schemaText = await generateSchema({
        space,
        accessToken,
        schemaAdditions,
        modifySchema,
    });
    const typeDefs = (0, apollo_server_1.gql) `${schemaText}`;
    const resolvers = (0, deepmerge_1.default)(generateResolvers(schemaText), additionalResolvers);
    const server = new apollo_server_1.ApolloServer({
        schema: (0, subgraph_1.buildSubgraphSchema)({ typeDefs, resolvers }),
        resolvers,
        dataSources: () => {
            return {
                contentfulAPI: contentfulAPI || new ContentfulAPI_js_1.ContentfulAPI({ space, accessToken }),
            };
        },
    });
    return {
        server,
        schema: schemaText
    };
}
exports.createApolloFederationEnabledContentfulServer = createApolloFederationEnabledContentfulServer;
async function downloadSchema({ space, accessToken }) {
    const query = (0, graphql_1.getIntrospectionQuery)();
    const response = await (0, cross_fetch_1.default)(`https://graphql.contentful.com/content/v1/spaces/${space}?access_token=${accessToken}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
        }),
    });
    const data = JSON.parse(await response.text());
    const schema = (0, graphql_1.buildClientSchema)(data.data);
    const schemaText = (0, graphql_1.printSchema)(schema);
    return schemaText;
}
exports.downloadSchema = downloadSchema;
async function generateSchema({ space, accessToken, schemaAdditions, modifySchema, }) {
    modifySchema = modifySchema || lodash_1.identity;
    const schemaText = await downloadSchema({ space, accessToken });
    const schemaTextWithAdditions = schemaText + '\n\n' + (schemaAdditions ?? '');
    const ast = (0, graphql_1.parse)(schemaTextWithAdditions);
    addPrimaryKeys(ast);
    const sysTypeNode = ast.definitions.find((node) => node.name.value === 'Sys');
    addKeyDirectiveToNode(sysTypeNode, 'id');
    modifySchema(ast);
    const text = (0, graphql_1.print)(ast);
    return text;
}
exports.generateSchema = generateSchema;
function addPrimaryKeys(ast) {
    const nodes = ast.definitions.filter(isObjectTypeDefinitionWithSysField);
    nodes.forEach(node => addKeyDirectiveToNode(node, 'sys { id }'));
}
exports.addPrimaryKeys = addPrimaryKeys;
function isObjectTypeDefinitionWithSysField(node) {
    return Boolean(node.kind === 'ObjectTypeDefinition' &&
        node.fields?.some(isSysField));
}
exports.isObjectTypeDefinitionWithSysField = isObjectTypeDefinitionWithSysField;
function isSysField(field) {
    return field.name.value === 'sys' && field.type.type.name.value === 'Sys';
}
exports.isSysField = isSysField;
function addKeyDirectiveToNode(node, id) {
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
    });
}
exports.addKeyDirectiveToNode = addKeyDirectiveToNode;
function removeArgumentsFromField(node, fieldName) {
    const field = node.fields.find((field) => field.name.value === fieldName);
    if (field) {
        field.arguments = [];
    }
    else {
        throw new Error(`Field "${fieldName} not found on node."`);
    }
}
exports.removeArgumentsFromField = removeArgumentsFromField;
function generateResolvers(schema) {
    const resolvers = {
        Query: {},
    };
    const ast = (0, graphql_1.parse)(schema);
    const queryField = ast.definitions.find((node) => node.kind === 'ObjectTypeDefinition' && node.name.value === 'Query');
    for (const field of queryField.fields) {
        const fieldName = field.name.value;
        resolvers.Query[fieldName] =
            async function query(_, __, { dataSources }, info) {
                const operationString = (0, graphql_1.print)(info.operation);
                const response = await dataSources.contentfulAPI.query(operationString);
                return response.body.data[fieldName];
            };
    }
    return resolvers;
}
exports.generateResolvers = generateResolvers;
//# sourceMappingURL=index.js.map