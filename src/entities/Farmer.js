const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Farmer",
  tableName: "farmer",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
    },
    first_name: {
      type: "varchar",
      length: 100,
    },
    last_name: {
      type: "varchar",
      length: 100,
    },
    gender: {
      type: "varchar",
      length: 10,
    },
    date_of_birth: {
      type: "date",
    },
    phone_number: {
      type: "varchar",
      length: 15,
    },
    alternate_phone_number: {
      type: "varchar",
      length: 15,
      nullable: true,
    },
    street_address: {
      type: "text",
    },
    state: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    lga: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    city: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    farmer_picture: {
      type: "text",
    },
    id_type: {
      type: "varchar",
      length: 50,
    },
    id_number: {
      type: "varchar",
      length: 50,
    },
    id_document_picture: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "timestamp",
      default: () => "CURRENT_TIMESTAMP",
    },
    user_latitude: {
      type: "double precision",
      nullable: true,
    },
    user_longitude: {
      type: "double precision",
      nullable: true,
    },
    remarks: {
      type: "text",
      nullable: true,
    },
    created_by: {
      type: "text",
      nullable: true,
    },
    farmer_id: {
      type: "uuid",
    },
    validation_time: {
      type: "timestamp",
      nullable: true,
    },
    validation_status: {
      type: "text",
      nullable: true,
    },
    validated_by: {
      type: "text",
      nullable: true,
    },
  },
});