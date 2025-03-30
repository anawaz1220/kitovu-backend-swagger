const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Farmer API",
      version: "1.0.0",
      description: "API for managing farmers",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints"
      },
      {
        name: "Farmers",
        description: "Farmer management"
      },
      {
        name: "Farmer Affiliation",
        description: "Farmer affiliation management"
      },
      {
        name: "Farms",
        description: "Farm management"
      },
      {
        name: "Location",
        description: "Location data management"
      }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
      schemas: {
        Farmer: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Auto-generated UUID",
            },
            first_name: {
              type: "string",
              maxLength: 100,
            },
            last_name: {
              type: "string",
              maxLength: 100,
            },
            gender: {
              type: "string",
              maxLength: 10,
            },
            date_of_birth: {
              type: "string",
              format: "date",
            },
            phone_number: {
              type: "string",
              maxLength: 15,
            },
            alternate_phone_number: {
              type: "string",
              maxLength: 15,
              nullable: true,
            },
            street_address: {
              type: "string",
            },
            state: {
              type: "string",
              maxLength: 100,
              nullable: true,
            },
            lga: {
              type: "string",
              maxLength: 100,
              nullable: true,
            },
            city: {
              type: "string",
              maxLength: 100,
              nullable: true,
            },
            farmer_picture: {
              type: "string",
              description: "URL of the farmer's picture",
            },
            id_type: {
              type: "string",
              maxLength: 50,
            },
            id_number: {
              type: "string",
              maxLength: 50,
            },
            id_document_picture: {
              type: "string",
              description: "URL of the ID document picture",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
            user_latitude: {
              type: "number",
              format: "double",
              nullable: true,
            },
            user_longitude: {
              type: "number",
              format: "double",
              nullable: true,
            },
            remarks: {
              type: "string",
              nullable: true,
            },
            created_by: {
              type: "string",
              nullable: true,
            },
            farmer_id: {
              type: "string",
              format: "uuid",
            },
            validation_time: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            validation_status: {
              type: "string",
              nullable: true,
            },
            validated_by: {
              type: "string",
              nullable: true,
            },
          },
        },
        FarmerAffiliation: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Auto-generated UUID",
            },
            farmer_id: {
              type: "string",
              format: "uuid",
              description: "ID of the farmer",
            },
            member_of_cooperative: {
              type: "boolean",
              description: "Whether the farmer is a member of a cooperative",
            },
            name: {
              type: "string",
              description: "Name of the cooperative",
            },
            activities: {
              type: "string",
              description: "Activities of the cooperative",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
            created_by: {
              type: "string",
              nullable: true,
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};