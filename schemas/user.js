'use strict';

const { gql } = require('apollo-server');

const { generateJWT, isAuthenticated } = require('./helps');

const bcrypt = require('bcrypt');

// using extend keyword, if you wanna use schema of files
const typeDefs = gql`
  type User {
    "Identity"
    id: ID!
    "Account"
    email: String!
    "Name"
    name: String
    "Age"
    age: Int @deprecated (reason: "It's secret")
    "Friends"
    friends: [User]
    posts: [Post]
  }
  
  type Token {
    "Access token"
    token: String
    "Expiration time"
    expiresIn: Date
  }
  
  extend type Query {
    me: User
    users: [User]
    user(id: ID!): User
  } 
  
  input UpdateMyInfoInput {
    name: String
    age: Int
  }
  
  input SignUpInput {
    email: String!
    password: String!
    name: String!
  }
  
  input LoginInput {
    email: String!
    password: String!
  }
  
  extend type Mutation {
    updateMyInfo(input: UpdateMyInfoInput!): User
    addFriend(userId: ID!): User
    signUp(input: SignUpInput!): User
    login(input: LoginInput!): Token
  }
`;

const resolvers = {
  Query: {
    user: (root, args, { userModel }) => userModel.findUserByUserId(Number(args.id)),
    users: (root, args, { userModel }) => userModel.getUsers(),
    me: isAuthenticated((root, args, { me, userModel }) => userModel.findUserByUserId(me.id)),
  },
  Mutation: {
    updateMyInfo: isAuthenticated((parent, { input }, { me, userModel }) => userModel.updateMyInfo(me, input)),
    addFriend: isAuthenticated((parent, { userId }, { me, userModel }) => userModel.addFriend(me, Number(userId))),
    signUp: async (parent, { input }, { userModel, saltRounds }) => {
      const { email, password, name } = input;
      const user = userModel.findUserByEmail(email);
      if (user) throw new Error(`User Email Duplicate`);

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      return userModel.addUser({ name, email, password: hashedPassword });
    },
    login: async (parent, { input }, { userModel, secret }) => {
      const { email, password } = input;
      const user = userModel.findUserByEmail(email);

      if (!user) throw new Error(`Account Not Found`);

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error(`User Password Incorrect`);

      return await generateJWT(user, secret);
    }
  },
  User: {
    friends: (parent, args, { userModel }) =>
      userModel.filterUsersByUserIds(parent.friendIds),
    posts: (parent, args, { postModel }) =>
      postModel.findPostsByUserId(parent.id)
  }
};

module.exports = {
  typeDefs,
  resolvers
};
