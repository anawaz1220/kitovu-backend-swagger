const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Location",
  tableName: "location",
  columns: {
    gid: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 40,
      nullable: true,
    },
    type: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    geom: {
      type: "geometry",
      spatialFeatureType: "MultiPolygon",
      srid: 4326,
      nullable: true,
    },
  },
});