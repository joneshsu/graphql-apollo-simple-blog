'use strict';

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

const getPosts = () => dummyPosts;

const findPostsByUserId = userId => dummyPosts.filter(post => post.authorId === userId);

const findPostByPostId = postId => dummyPosts.find(post => post.id === Number(postId));

const findPostIndex = postId => dummyPosts.findIndex(post => post.id === Number(postId));

const deletePost = postId => (
  dummyPosts.splice(findPostIndex(postId), 1)[0]
);

const likePost = (me, postId) => {
  const post = findPostByPostId(postId);
  if (!post.likeGivers.includes(me.id)) {
    post.likeGivers.push(me.id);
  } else {
    post.likeGivers = post.likeGivers.filter(userId => userId !== me.id);
  }

  return post;
};

const addPost = (me, entity) => {
  const { title, body } = entity;
  dummyPosts.push({
    id: dummyPosts.length + 1,
    authorId: me.id,
    title: title,
    body: body || '',
    likeGivers: [],
    createdAt: new Date()
  });
  return dummyPosts[dummyPosts.length - 1];
};

module.exports = {
  findPostIndex,
  findPostByPostId,
  findPostsByUserId,
  addPost,
  likePost,
  deletePost,
  getPosts
};
