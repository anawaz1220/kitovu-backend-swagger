const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "FarmerAffiliation",
  tableName: "farmer_affiliation",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    farmer_id: {
      type: "uuid",
      nullable: false,
    },
    member_of_cooperative: {
      type: "boolean",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    activities: {
      type: "text",
      nullable: true,
    },
    updated_by: {
      type: "uuid",
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
    created_by: {
      type: "text",
      nullable: true,
    },
  },
  relations: {
    updated_by_user: {
      type: "many-to-one",
      target: "User", // Assuming you have a User entity
      joinColumn: {
        name: "updated_by",
        referencedColumnName: "id",
      },
    },
  },
});