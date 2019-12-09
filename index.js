'use strict';

const { ApolloServer, gql } = require('apollo-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 2;

const SECRET = 'this_is_a_random_secret';

const dummyUsers = [
  {
    id: 1,
    email: 'jones.th.hsu+1@gmail.com',
    // !qaz2wSx
    password: 'bdaeff992dac4c49c697ef6673b9835a16bddc08ab15da761b41df8e19fc3a91',
    name: 'Michael Jordan',
    age: 56,
    friendIds: [2, 3]
  },
  {
    id: 2,
    email: 'jones.th.hsu+2@gmail.com',
    // !qaz2wsx
    password: 'bdaeff992dac4c49c697ef6673b9835a16bddc08ab15da761b41df8e19fc3a91',
    name: 'LeBron James',
    age: 35,
    friendIds: [1]
  },
  {
    id: 3,
    email: 'jones.th.hsu+3@gmail.com',
    // !qaz2wsx
    password: 'bdaeff992dac4c49c697ef6673b9835a16bddc08ab15da761b41df8e19fc3a91',
    name: 'Kobe Bryant',
    age: 41,
    friendIds: [3]
  }
];

const dummyPosts = [
  {
    id: 1,
    authorId: 1,
    title: 'Hello GraphQL',
    body: 'This is the first post for GraphQL',
    likeGivers: [],
    createdAt: "2019-12-07T14:00:12.111Z"
  },
  {
    id: 2,
    authorId: 2,
    title: 'Hello Nodejs',
    body: 'The second post for Nodejs',
    likeGivers: [1],
    createdAt: "2019-12-08T13:12:48.124Z"
  }
];

const typeDefs = gql`
  """
  User
  """
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
    posts: [Post]
  }
  
  """
  Post
  """
  type Post {
    "Identity"
    id: ID!
    "Author"
    author: User
    "Title"
    title: String
    "Body"
    body: String
    "Likes"
    likeGivers: [User]
    createdAt: String
  }
  
  """
  Query
  """
  type Query {
    users: [User]
    user(id: ID!): User
    posts: [Post]
    post(id: ID!): Post
  } 
  
  input UpdateMyInfoInput {
    name: String
    age: Int
  }
  
  input AddPostInput {
    title: String!
    body: String
  }
  
  input SignUpInput {
    email: String!
    password: String!
    name: String!
  }
  
  type Mutation {
    updateMyInfo(input: UpdateMyInfoInput!): User
    addFriend(userId: ID!): User
    addPost(input: AddPostInput!): Post
    likePost(postId: ID!): Post   
    signUp(input: SignUpInput!): User
  }
  
`;

const myId = 1;

const filterUsersByUserIds = userIds => dummyUsers.filter(user => userIds.includes(user.id));

const findUserByUserId = userId => dummyUsers.find(user => user.id === Number(userId));

const findPostsByUserId = userId => dummyPosts.filter(post => post.authorId === userId);

const findPostByPostId = postId => dummyPosts.find(post => post.id === Number(postId));

const updateUserInfo = (userId, data) => Object.assign(findUserByUserId(userId), data);

const updateMyInfo = (parent, { input }) => {
  // filter null value
  const data = ['name', 'age'].reduce((obj, key) => (input[key] ? { ...obj, [key]: input[key] } : obj), {});

  return updateUserInfo(myId, data);
};

const addFriend = (parent, { userId }) => {
  userId = Number(userId);
  const user = findUserByUserId(myId);
  if (!user.friendIds.includes(userId)) {
    user.friendIds.push(userId);
  } else {
    user.friendIds = user.friendIds.filter(_userId => _userId !== userId);
  }
  return user;
};

const likePost = (parent, { postId }) => {
  postId = Number(postId);
  const post = findPostByPostId(postId);
  if (!post.likeGivers.includes(myId)) {
    post.likeGivers.push(myId);
  } else {
    post.likeGivers = post.likeGivers.filter(userId => userId !== myId);
  }

  return post;
};

const addPost = (parent, { input } ) => {
  const { title, body } = input;
  dummyPosts.push({
    id: dummyPosts.length + 1,
    authorId: myId,
    title: title,
    body: body || '',
    likeGivers: [],
    createdAt: new Date()
  });
  return dummyPosts[dummyPosts.length - 1];
};

const addUser = ({ name, email, password }) => (
  dummyUsers[dummyUsers.length] = {
    id: dummyUsers.length + 1,
    name: name,
    email: email,
    password: password,
    age: 0,
    friendIds: []
  }
);

const signUp = async (parent, { input }) => {
  const { email, password, name } = input;
  const user = dummyUsers.some(user => user.email === email);
  if (user) throw new Error(`User Email Duplicate`);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  return addUser({ name: name, email: email, password: hashedPassword });
};

const resolvers = {
  Query: {
    user: (root, args) => findUserByUserId(args.id),
    users: () => dummyUsers,
    post: (root, args) => findPostByPostId(args.id),
    posts: () => dummyPosts
  },
  Mutation: {
    updateMyInfo: updateMyInfo,
    addFriend: addFriend,
    addPost: addPost,
    likePost: likePost,
    signUp: signUp
  },
  User: {
    friends: (parent) => filterUsersByUserIds(parent.friendIds),
    posts: (parent) => findPostsByUserId(parent.id)
  },
  Post: {
    author: (parent) => findUserByUserId(parent.authorId),
    likeGivers: (parent) => filterUsersByUserIds(parent.likeGivers)
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.listen().then(({ url }) => {
  console.log(`Server started on ${url}`);
});