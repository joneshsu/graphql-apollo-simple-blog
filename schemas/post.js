'use strict';

const { gql, ForbiddenError, UserInputError } = require('apollo-server');

const { isAuthenticated } = require('./helps');

const typeDefs = gql`
  type PostConnection {
    "Data"
    edges: [PostEdge!]!
    "Pagination information"
    pageInfo: PostInfo!
  }
  
  type PostEdge {
    "An identity with base64"
    cursor: String
    "Actual Post data"
    node: Post!
  }
  
  type PostInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalPageCount: Int
  }

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
    posts(
      first: Int
      after: String
      last: Int
      before: String
    ): PostConnection! 
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
    posts: (root, { first, after, last, before }, { postModel }) => {
      if (!first && after) throw new UserInputError(`after must be with first`);

      if ((last && !before) || (!last && before)) throw new UserInputError(`last and before must be used together`);

      if (first && after && last && before) throw new UserInputError(`Incorrect Arguments Usage.`);

      let posts, countWithoutLimit;

      if (first) {
        [ posts, countWithoutLimit ] = postModel.getPaginationPostsAfterCreationTime
          ((after ? Buffer.from(after, 'base64').toString() : null), first
        );
      }

      if (last) {
        [ posts, countWithoutLimit ] = postModel.getPaginationPostsBeforeCreationTime(
          Buffer.from(before, 'base64').toString(), last
        );
      }

      const allCount = postModel.getPostsCount();


      return {
        edges: posts.map(post => ({
          cursor: Buffer.from(post.createdAt).toString('base64'),
          node: post,
        })),
        pageInfo: {
          hasNextPage: first ? countWithoutLimit > first : allCount > countWithoutLimit,
          hasPreviousPage: last ? countWithoutLimit > last : allCount > countWithoutLimit
        }
      };
    }
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
