// Update to swagger.js
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Farmer API",
      version: "1.0.0",
      description: "API for managing farmers and agricultural advisory services",
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
      },
      {
        name: "Advisory",
        description: "Agricultural advisory services including crop health and fertilizer recommendations"
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
            ward: {
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
            // New fields
            education: {
              type: "string",
              maxLength: 100,
              nullable: true,
            },
            agricultural_training: {
              type: "boolean",
              nullable: true,
            },
            training_provider: {
              type: "string",
              maxLength: 255,
              nullable: true,
            },
            certificate_issued: {
              type: "boolean",
              nullable: true,
            },
            received_financing: {
              type: "boolean",
              nullable: true,
            },
            finance_provider: {
              type: "string",
              maxLength: 255,
              nullable: true,
            },
            finance_amount: {
              type: "number",
              format: "double",
              nullable: true,
            },
            interest_rate: {
              type: "number",
              format: "double",
              nullable: true,
            },
            financing_duration_years: {
              type: "integer",
              nullable: true,
            },
            financing_duration_months: {
              type: "integer",
              nullable: true,
            },
            // Related affiliation fields
            member_of_cooperative: {
              type: "boolean",
              nullable: true,
            },
            cooperative_name: {
              type: "string",
              nullable: true,
            },
            cooperative_activities: {
              type: "string",
              nullable: true,
            },
            marketing_channel: {
              type: "string",
              maxLength: 100,
              nullable: true,
            },
            offtaker_name: {
              type: "string",
              maxLength: 255,
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
            // New fields
            marketing_channel: {
              type: "string",
              maxLength: 100,
              nullable: true,
              description: "Marketing channel used by the farmer",
            },
            offtaker_name: {
              type: "string",
              maxLength: 255,
              nullable: true,
              description: "Name of the offtaker",
            },
          },
        },
        // Add Farm schema with new fields
        Farm: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Auto-generated UUID",
            },
            farmer_id: {
              type: "string",
              description: "ID of the farmer",
            },
            farm_id: {
              type: "integer",
              description: "Auto-incremented farm ID",
            },
            Draw_Farm: {
              type: "object",
              description: "GeoJSON representation of the farm boundary",
            },
            farm_type: {
              type: "string",
              maxLength: 100,
              description: "Type of the farm (e.g., Crops, Livestock)",
            },
            ownership_status: {
              type: "string",
              maxLength: 50,
              description: "Ownership status (e.g., Owned, Leased)",
            },
            lease_years: {
              type: "integer",
              description: "Number of years on lease (if applicable)",
            },
            lease_months: {
              type: "integer",
              description: "Number of months on lease (if applicable)",
            },
            calculated_area: {
              type: "number",
              format: "double",
              description: "Calculated area of the farm in acres",
            },
            crop_type: {
              type: "string",
              maxLength: 100,
              description: "Type of crops grown on the farm",
            },
            area: {
              type: "number",
              format: "double",
              description: "Area of the farm",
            },
            livestock_type: {
              type: "string",
              maxLength: 100,
              description: "Type of livestock present on the farm",
            },
            number_of_animals: {
              type: "integer",
              description: "Number of animals on the farm (if applicable)",
            },
            farm_latitude: {
              type: "number",
              format: "double",
              description: "Latitude coordinate of the farm's central point",
            },
            farm_longitude: {
              type: "number",
              format: "double",
              description: "Longitude coordinate of the farm's central point",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
            // New fields
            distance_to_farm_km: {
              type: "number",
              format: "double",
              description: "Distance to the farm in kilometers",
            },
            crop_yield: {
              type: "number",
              format: "double",
              description: "Crop yield information",
            },
            livestock_yield: {
              type: "number",
              format: "double",
              description: "Livestock yield information",
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