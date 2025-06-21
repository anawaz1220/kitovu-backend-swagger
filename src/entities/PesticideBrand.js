// src/entities/PesticideBrand.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "PesticideBrand",
  tableName: "pesticide_brands",
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
    brand_name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    concentration: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    application_rate: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    dilution_rate: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    safety_period_before_harvest: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    manufacturer: {
      type: "varchar",
      length: 200,
      nullable: true,
    },
    contraindications: {
      type: "text",
      nullable: true,
    },
    is_available: {
      type: "boolean",
      default: true,
    },
    created_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
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
});