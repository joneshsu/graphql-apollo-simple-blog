'use strict';

const { gql } = require('apollo-server');

const userSchema = require('./user');
const postSchema = require('./post');

const typeDefs = gql`
  type Query {
    hello: String
  }
  
  type Mutation {
    test: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'World'
  },
  Mutation: {
    test: () => 'test'
  }
};

module.exports = {
  typeDefs: [typeDefs, userSchema.typeDefs, postSchema.typeDefs],
  resolvers: [resolvers, userSchema.resolvers, postSchema.resolvers]
};
