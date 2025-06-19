// src/entities/Herbicide.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Herbicide",
  tableName: "herbicides",
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
    target_weeds: {
      type: "text",
      nullable: false,
    },
    growth_stage: {
      type: "text",
      nullable: true,
    },
    mode_of_action: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    spectrum: {
      type: "text",
      nullable: true,
    },
    application_method: {
      type: "varchar",
      length: 100,
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