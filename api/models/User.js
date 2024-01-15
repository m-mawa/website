const sequelize = require("../db")
const { DataTypes } = require('sequelize');

const UserModel = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [4, Infinity], // Minimum length of 4 characters
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

(async () => {
  await sequelize.sync();
  console.log('Database synchronized');
})();

module.exports = UserModel;