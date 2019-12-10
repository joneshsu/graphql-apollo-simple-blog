'use strict';

const { gql, ForbiddenError } = require('apollo-server');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 2;

const SECRET = 'this_is_a_random_secret';
const EXPIRATION_TIME = '1h';

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
    age: Int
    "Friends"
    friends: [User]
  }
  
  type Token {
    "Access token"
    token: String
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

const generateJWT = (user) => (
  jwt.sign({
    me: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  }, SECRET, { expiresIn: EXPIRATION_TIME })
);

const isAuthenticated = resolverFunc => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError(`Please Login First`);
  return resolverFunc.apply(null, [parent, args, context])
};

const resolvers = {
  Query: {
    user: (root, args, { userModel }) => userModel.findUserByUserId(Number(args.id)),
    users: (root, args, { userModel }) => userModel.getUsers(),
    me: isAuthenticated((root, args, { me, userModel }) => userModel.findUserByUserId(me.id)),
  },
  Mutation: {
    updateMyInfo: isAuthenticated((parent, { input }, { me, userModel }) => userModel.updateMyInfo(me, input)),
    addFriend: isAuthenticated((parent, { userId }, { me, userModel }) => userModel.addFriend(me, Number(userId))),
    signUp: async (parent, { input }, { userModel }) => {
      const { email, password, name } = input;
      const user = userModel.findUserByEmail(email);
      if (user) throw new Error(`User Email Duplicate`);

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      return userModel.addUser({ name, email, password: hashedPassword });
    },
    login: async (parent, { input }, { userModel }) => {
      const { email, password } = input;
      const user = userModel.findUserByEmail(email);

      if (!user) throw new Error(`Account Not Found`);

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error(`User Password Incorrect`);

      return { token: await generateJWT(user)};
    }
  }
};

module.exports = {
  typeDefs,
  resolvers
};
