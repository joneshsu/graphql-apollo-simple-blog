'use strict';

const dummyUsers = [
  {
    id: 1,
    email: 'jones.th.hsu+1@gmail.com',
    // original password => !qaz2wSx, below is hashed password
    password: '$2b$04$X4rAP.cV/awEAekwqnBRd.JOJgPRc0AzIVCN/RjXAy6OgiGoI5I/W',
    name: 'Michael Jordan',
    age: 56,
    friendIds: [2, 3]
  },
  {
    id: 2,
    email: 'jones.th.hsu+2@gmail.com',
    // !qaz2wsx
    password: '$2b$04$X4rAP.cV/awEAekwqnBRd.JOJgPRc0AzIVCN/RjXAy6OgiGoI5I/W',
    name: 'LeBron James',
    age: 35,
    friendIds: [1]
  },
  {
    id: 3,
    email: 'jones.th.hsu+3@gmail.com',
    // !qaz2wsx
    password: '$2b$04$X4rAP.cV/awEAekwqnBRd.JOJgPRc0AzIVCN/RjXAy6OgiGoI5I/W',
    name: 'Kobe Bryant',
    age: 41,
    friendIds: [3]
  }
];

const getUsers = () => dummyUsers;

const findUserByUserId = userId => dummyUsers.find(user => user.id === userId);

const findUserByEmail = email => dummyUsers.find(user => user.email === email);

const filterUsersByUserIds = userIds => dummyUsers.filter(user => userIds.includes(user.id));

const addFriend = (me, userId) => {
  const user = findUserByUserId(me.id);
  if (user.friendIds.includes(userId)) {
    user.friendIds.splice(
      user.friendIds.findIndex(_userId => _userId === userId),
      1
    );
  } else {
    user.friendIds.push(userId);
  }
  return user;
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

const updateUserInfo = (userId, data) => Object.assign(findUserByUserId(userId), data);

const updateMyInfo = (me, entity) => {
  // filter null value
  const data = ['name', 'age'].reduce((obj, key) => (entity[key] ? { ...obj, [key]: entity[key] } : obj), {});

  return updateUserInfo(me.id, data);
};

module.exports = {
  findUserByUserId,
  findUserByEmail,
  filterUsersByUserIds,
  addFriend,
  addUser,
  getUsers,
  updateMyInfo
};

