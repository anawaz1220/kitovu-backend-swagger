// src/entities/PesticideTarget.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PesticideTarget",
  tableName: "pesticide_targets",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    pesticide_id: {
      type: "uuid",
      nullable: false,
    },
    target_type: {
      type: "varchar",
      length: 50,
      nullable: false, // 'pest' or 'disease'
    },
    target_name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    severity_level: {
      type: "varchar",
      length: 20,
      nullable: true, // 'high', 'medium', 'low'
    },
    efficacy_rating: {
      type: "int",
      default: 5, // 1-10 scale
    },
    created_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    pesticide: {
      type: "many-to-one",
      target: "Pesticide",
      joinColumn: {
        name: "pesticide_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
  indexes: [
    {
      name: "IDX_PESTICIDE_TARGET_TYPE",
      columns: ["pesticide_id", "target_type", "target_name"],
    },
  ],
});