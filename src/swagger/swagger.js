const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Farmer API",
      version: "1.0.0",
      description: "API for managing farmers and farm advisory services",
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
        description: "Agricultural advisory services"
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
        CropHealthResponse: {
          type: "object",
          properties: {
            farm_id: {
              type: "string",
              format: "uuid",
              description: "ID of the farm"
            },
            analysis_date: {
              type: "string",
              format: "date-time",
              description: "Date when the analysis was performed"
            },
            crop: {
              type: "string",
              description: "Type of crop"
            },
            growth_stage: {
              type: "string",
              description: "Current growth stage of the crop"
            },
            overall_health_index: {
              type: "integer",
              description: "Overall health index (0-100)"
            },
            status: {
              type: "string",
              description: "Overall health status"
            },
            ndvi_analysis: {
              type: "object",
              properties: {
                average_ndvi: {
                  type: "number",
                  format: "float",
                  description: "Average NDVI value"
                },
                min_ndvi: {
                  type: "number",
                  format: "float",
                  description: "Minimum NDVI value"
                },
                max_ndvi: {
                  type: "number",
                  format: "float",
                  description: "Maximum NDVI value"
                },
                zones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      zone_id: {
                        type: "integer",
                        description: "Zone identifier"
                      },
                      status: {
                        type: "string",
                        description: "Health status of the zone"
                      },
                      ndvi_range: {
                        type: "string",
                        description: "NDVI value range"
                      },
                      area_percentage: {
                        type: "number",
                        format: "float",
                        description: "Percentage of the total area"
                      },
                      area_hectares: {
                        type: "number",
                        format: "float",
                        description: "Area in hectares"
                      }
                    }
                  }
                }
              }
            },
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  severity: {
                    type: "string",
                    description: "Severity of the alert (low, medium, high)"
                  },
                  type: {
                    type: "string",
                    description: "Type of the alert"
                  },
                  description: {
                    type: "string",
                    description: "Description of the alert"
                  },
                  affected_area_percentage: {
                    type: "number",
                    format: "float",
                    description: "Percentage of affected area"
                  }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "string",
                description: "Recommendation for action"
              }
            }
          }
        }
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};