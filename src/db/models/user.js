const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
  }
  User.init({
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    birthday: {
      type: DataTypes.DATEONLY,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  // Instance method — uses `function` (not =>) so `this` refers to the user instance
  User.prototype.verifyPassword = async function verifyPassword(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
