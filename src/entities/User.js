const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    email: {
      type: "varchar",
      length: 255,
      unique: true,
    },
    username: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    password: {
      type: "varchar",
      length: 100,
    },
    role: {
      type: "varchar",
      length: 20,
    },
    created_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
});