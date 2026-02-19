module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'confirmed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'confirmed');
  },
};
