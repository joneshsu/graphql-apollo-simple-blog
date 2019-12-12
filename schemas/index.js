'use strict';

const { gql, SchemaDirectiveVisitor } = require('apollo-server');
const { GraphQLScalarType, defaultFieldResolver } = require('graphql');
const { Kind } = require('graphql/language');

const userSchema = require('./user');
const postSchema = require('./post');

class LowerCaseDirective extends SchemaDirectiveVisitor {
  // override visitFieldDefinition
  visitFieldDefinition(field, details) {
    const { resolve = defaultFieldResolver } = field;
    // modify the function of resolve of field
    field.resolve = async function(...args) {
      const result = await resolve.apply(this, args);
      if (typeof result === 'string') {
        return result.toLowerCase();
      }

      return result;
    };
  }
}

const typeDefs = gql`
  directive @lower on FIELD_DEFINITION
  
  type Query {
    hello: String @lower
    now: Date
  }
  
  type Mutation {
    test: String
  }
  
  scalar Date
`;

const resolvers = {
  Query: {
    hello: () => 'Hello World!',
    now: () => new Date()
  },
  Mutation: {
    test: () => 'test'
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date Type',
    serialize(value) {
      // sending value to the client
      return value.getTime();
    },
    parseValue(value) {
      // sending value to the resolver from the client
      return new Date(value);
    },
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.INT:
          return new Date(parseInt(ast.value, 10));
      }
      return null;
    }
  })
};

module.exports = {
  typeDefs: [typeDefs, userSchema.typeDefs, postSchema.typeDefs],
  resolvers: [resolvers, userSchema.resolvers, postSchema.resolvers],
  schemaDirectives: {
    lower: LowerCaseDirective
  }
};
