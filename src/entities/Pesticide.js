// src/entities/Pesticide.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Pesticide",
  tableName: "pesticides",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    active_ingredient: {
      type: "varchar",
      length: 200,
      nullable: false,
    },
    application_time: {
      type: "text",
      nullable: false,
    },
    target_pests: {
      type: "text",
      nullable: false,
    },
    growth_stage: {
      type: "text",
      nullable: true,
    },
    spectrum_of_control: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    application_method: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    regions_commonly_used: {
      type: "text",
      nullable: true,
    },
    special_notes: {
      type: "text",
      nullable: true,
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
});