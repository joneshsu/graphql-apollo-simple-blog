'use strict';

const { ApolloServer } = require('apollo-server');

const {
  userModel,
  postModel
} = require('./models');

const { typeDefs, resolvers, schemaDirectives } = require('./schemas');

const jwt = require('jsonwebtoken');

const SECRET = 'this_is_a_random_secret';
const SALT_ROUNDS = 2;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives,
  context: async({ req }) => {
    const context = {
      secret: SECRET,
      saltRounds: SALT_ROUNDS,
      userModel,
      postModel
    };
    const token = req.headers['x-token'];
    if (token) {
      try {
        const { me } = await jwt.verify(token, SECRET);
        return { ...context, me };
      } catch (e) {
        throw new Error(`Token Expired`);
      }
    }

    return context;
  }
});

server.listen().then(({ url }) => {
  console.log(`Server started on ${url}`);
});