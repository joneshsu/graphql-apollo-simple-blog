'use strict';

const { ApolloServer } = require('apollo-server');

const DataLoader = require('dataloader');

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
  tracing: true,
  schemaDirectives,
  context: async({ req }) => {
    const context = {
      secret: SECRET,
      saltRounds: SALT_ROUNDS,
      userModel,
      postModel,
      dataLoaders: {
        users: new DataLoader(async userIds => {
          const users = await userModel.filterUsersByUserIds(userIds);
          return users.sort(
            (a, b) => userIds.indexOf(a.id) - userIds.indexOf(b.id)
          );
        })
      }
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