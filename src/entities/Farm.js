// Update to Farm.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Farm",
  tableName: "farm",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    farmer_id: {
      type: "text",
      nullable: false,
    },
    farm_id: {
      type: "int",
      generated: "increment",
    },
    Draw_Farm: {
      type: "text",
      nullable: true,
    },
    farm_type: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    ownership_status: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    lease_years: {
      type: "int",
      nullable: true,
    },
    lease_months: {
      type: "int",
      nullable: true,
    },
    calculated_area: {
      type: "numeric",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    crop_type: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    area: {
      type: "numeric",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    livestock_type: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    number_of_animals: {
      type: "int",
      nullable: true,
    },
    farm_latitude: {
      type: "double precision",
      nullable: true,
    },
    farm_longitude: {
      type: "double precision",
      nullable: true,
    },
    geom: {
      type: "geometry",
      spatialFeatureType: "MultiPolygon",
      srid: 4326,
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
    // New fields
    distance_to_farm_km: {
      type: "numeric",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    crop_yield: {
      type: "numeric",
      precision: 15,
      scale: 2,
      nullable: true,
    },
    livestock_yield: {
      type: "numeric",
      precision: 15,
      scale: 2,
      nullable: true,
    },
  },
});