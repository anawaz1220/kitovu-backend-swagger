// src/entities/HerbicideBrand.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "HerbicideBrand",
  tableName: "herbicide_brands",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    herbicide_id: {
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
    safety_period: {
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
    herbicide: {
      type: "many-to-one",
      target: "Herbicide",
      joinColumn: {
        name: "herbicide_id",
        referencedColumnName: "id",
      },
      onDelete: "CASCADE",
    },
  },
});