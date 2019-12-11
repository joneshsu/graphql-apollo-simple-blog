'use strict';

const { gql } = require('apollo-server');
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const userSchema = require('./user');
const postSchema = require('./post');

const typeDefs = gql`
  type Query {
    hello: String
    now: Date
  }
  
  type Mutation {
    test: String
  }
  
  scalar Date
`;

const resolvers = {
  Query: {
    hello: () => 'World',
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
  resolvers: [resolvers, userSchema.resolvers, postSchema.resolvers]
};
