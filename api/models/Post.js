const sequelize = require("../db")
const { DataTypes } = require('sequelize');
const User = require('./User');

const Post = sequelize.define('Post', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cover: {
      type: DataTypes.STRING,
    
      allowNull: true, 
    },
  });

Post.belongsTo(User, { foreignKey: 'author' });

(async () => {
  await sequelize.sync();
  console.log('Database synchronized');
})();

module.exports = Post;