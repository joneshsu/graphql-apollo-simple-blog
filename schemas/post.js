'use strict';

const { gql, ForbiddenError } = require('apollo-server');

const { isAuthenticated } = require('./helps');

const typeDefs = gql`
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
  
  extend type Query {
    posts: [Post]
    post(id: ID!): Post
  } 
  
  input AddPostInput {
    title: String!
    body: String
  }
  
  extend type Mutation {
    addPost(input: AddPostInput!): Post
    deletePost(postId: ID!): Post
    likePost(postId: ID!): Post   
  }
`;

const isPostAuthor = resolverFunc => (parent, args, context) => {
  const { postId } = args;
  const { me, postModel } = context;
  const post = postModel.findPostByPostId(postId);
  if (!post) throw new Error(`Post Not Found`);

  const isAuthor = post.authorId === me.id;
  if (!isAuthor) throw new ForbiddenError(`Only Author Can Delete Post`);

  return resolverFunc.apply(null, [parent, args, context]);
};

const resolvers = {
  Query: {
    post: (root, args, { postModel }) => postModel.findPostByPostId(Number(args.id)),
    posts: (root, args, { postModel }) => postModel.getPosts()
  },
  Mutation: {
    addPost: isAuthenticated((parent, { input }, { me, postModel }) => postModel.addPost(me, input)),
    deletePost: isAuthenticated(
      isPostAuthor((parent, { postId }, { postModel }) => postModel.deletePost(postId))
    ),
    likePost: isAuthenticated((parent, { postId }, { me, postModel }) => postModel.likePost(me, Number(postId))),
  },
  Post: {
    author: (parent, args, { userModel }) => userModel.findUserByUserId(parent.authorId),
    likeGivers: (parent, args, { userModel }) => userModel.filterUsersByUserIds(parent.likeGivers)
  }
};

module.exports = {
  typeDefs,
  resolvers
};
