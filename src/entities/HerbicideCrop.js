// src/entities/HerbicideCrop.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "HerbicideCrop",
  tableName: "herbicide_crops",
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
    crop_type: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    is_primary_crop: {
      type: "boolean",
      default: false,
    },
    special_instructions: {
      type: "text",
      nullable: true,
    },
    created_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
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
  indexes: [
    {
      name: "IDX_HERBICIDE_CROP",
      columns: ["herbicide_id", "crop_type"],
    },
  ],
});