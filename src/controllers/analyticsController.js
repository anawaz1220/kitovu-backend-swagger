const AppDataSource = require("../data-source");
const Farmer = require("../entities/Farmer");
const Farm = require("../entities/Farm");

const farmFilter = async (req, res) => {
  try {
    const { state, lga, city, farm_type, crop_type } = req.body;

    // Build the base query with all possible filters
    let baseQuery = `
      FROM farmer f
      INNER JOIN farm fa ON f.farmer_id::text = fa.farmer_id::text
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (state) {
      paramCount++;
      baseQuery += ` AND f.state = $${paramCount}`;
      queryParams.push(state);
    }
    if (lga) {
      paramCount++;
      baseQuery += ` AND f.lga = $${paramCount}`;
      queryParams.push(lga);
    }
    if (city) {
      paramCount++;
      baseQuery += ` AND f.city = $${paramCount}`;
      queryParams.push(city);
    }
    if (farm_type && farm_type !== "both") {
      paramCount++;
      baseQuery += ` AND fa.farm_type = $${paramCount}`;
      queryParams.push(farm_type);
    } else if (farm_type === "both") {
      baseQuery += ` AND fa.farm_type IN ('livestock_farming', 'crop_farming')`;
    }
    if (crop_type) {
      paramCount++;
      baseQuery += ` AND fa.crop_type = $${paramCount}`;
      queryParams.push(crop_type);
    }

    // Summary query
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT f.farmer_id) as total_farmers,
        COUNT(DISTINCT fa.id) as total_farms,
        COALESCE(SUM(fa.calculated_area), 0) as total_area_acres
      ${baseQuery}
    `;

    // Map data queries
    const farmersMapQuery = `
      SELECT DISTINCT 
        f.farmer_id,
        f.user_latitude as latitude,
        f.user_longitude as longitude
      ${baseQuery}
      AND f.user_latitude IS NOT NULL 
      AND f.user_longitude IS NOT NULL
    `;

    const farmsMapQuery = `
      SELECT 
        fa.id as farm_id,
        ST_Y(ST_Centroid(fa.geom)) as centroid_latitude,
        ST_X(ST_Centroid(fa.geom)) as centroid_longitude
      ${baseQuery}
      AND fa.geom IS NOT NULL
    `;

    // Breakdown queries (simplified without nested aggregates)
    const stateBreakdownQuery = `
      SELECT 
        f.state as name,
        COUNT(DISTINCT f.farmer_id) as farmers_count,
        COUNT(DISTINCT fa.id) as farms_count,
        COALESCE(SUM(fa.calculated_area), 0) as total_area_acres
      ${baseQuery}
      GROUP BY f.state
      ORDER BY farmers_count DESC
    `;

    const lgaBreakdownQuery = `
      SELECT 
        f.lga as name,
        COUNT(DISTINCT f.farmer_id) as farmers_count,
        COUNT(DISTINCT fa.id) as farms_count,
        COALESCE(SUM(fa.calculated_area), 0) as total_area_acres
      ${baseQuery}
      GROUP BY f.lga
      ORDER BY farmers_count DESC
    `;

    const communityBreakdownQuery = `
      SELECT 
        f.city as name,
        COUNT(DISTINCT f.farmer_id) as farmers_count,
        COUNT(DISTINCT fa.id) as farms_count,
        COALESCE(SUM(fa.calculated_area), 0) as total_area_acres
      ${baseQuery}
      GROUP BY f.city
      ORDER BY farmers_count DESC
    `;

    // Separate crop breakdown queries
    const stateCropsQuery = `
      SELECT 
        f.state,
        fa.crop_type,
        COUNT(DISTINCT fa.id) as farm_count
      ${baseQuery}
      AND fa.crop_type IS NOT NULL
      GROUP BY f.state, fa.crop_type
    `;

    const lgaCropsQuery = `
      SELECT 
        f.lga,
        fa.crop_type,
        COUNT(DISTINCT fa.id) as farm_count
      ${baseQuery}
      AND fa.crop_type IS NOT NULL
      GROUP BY f.lga, fa.crop_type
    `;

    const communityCropsQuery = `
      SELECT 
        f.city,
        fa.crop_type,
        COUNT(DISTINCT fa.id) as farm_count
      ${baseQuery}
      AND fa.crop_type IS NOT NULL
      GROUP BY f.city, fa.crop_type
    `;

    const uniqueCropsQuery = `
      SELECT DISTINCT fa.crop_type
      ${baseQuery}
      AND fa.crop_type IS NOT NULL
      ORDER BY fa.crop_type
    `;

    // Execute all queries
    const [
      summaryResult,
      farmersMapData,
      farmsMapData,
      stateBreakdown,
      lgaBreakdown,
      communityBreakdown,
      stateCropsData,
      lgaCropsData,
      communityCropsData,
      uniqueCropsResult
    ] = await Promise.all([
      AppDataSource.query(summaryQuery, queryParams),
      AppDataSource.query(farmersMapQuery, queryParams),
      AppDataSource.query(farmsMapQuery, queryParams),
      AppDataSource.query(stateBreakdownQuery, queryParams),
      AppDataSource.query(lgaBreakdownQuery, queryParams),
      AppDataSource.query(communityBreakdownQuery, queryParams),
      AppDataSource.query(stateCropsQuery, queryParams),
      AppDataSource.query(lgaCropsQuery, queryParams),
      AppDataSource.query(communityCropsQuery, queryParams),
      AppDataSource.query(uniqueCropsQuery, queryParams)
    ]);

    const summary = {
      total_farmers: parseInt(summaryResult[0].total_farmers) || 0,
      total_farms: parseInt(summaryResult[0].total_farms) || 0,
      total_area_acres: parseFloat(summaryResult[0].total_area_acres) || 0
    };

    // Helper function to build crops object from crops data
    const buildCropsMap = (cropsData, locationKey) => {
      const cropsMap = {};
      cropsData.forEach(row => {
        if (!cropsMap[row[locationKey]]) {
          cropsMap[row[locationKey]] = {};
        }
        cropsMap[row[locationKey]][row.crop_type] = parseInt(row.farm_count);
      });
      return cropsMap;
    };

    const stateCropsMap = buildCropsMap(stateCropsData, 'state');
    const lgaCropsMap = buildCropsMap(lgaCropsData, 'lga');
    const communityCropsMap = buildCropsMap(communityCropsData, 'city');

    const response = {
      filters_applied: {
        state: state || null,
        lga: lga || null,
        city: city || null,
        farm_type: farm_type || null,
        crop_type: crop_type || null
      },
      summary,
      map_data: {
        farmers: farmersMapData.map(farmer => ({
          farmer_id: farmer.farmer_id,
          latitude: parseFloat(farmer.latitude) || null,
          longitude: parseFloat(farmer.longitude) || null
        })).filter(f => f.latitude !== null && f.longitude !== null),
        farms: farmsMapData.map(farm => ({
          farm_id: farm.farm_id,
          centroid_latitude: parseFloat(farm.centroid_latitude) || null,
          centroid_longitude: parseFloat(farm.centroid_longitude) || null
        })).filter(f => f.centroid_latitude !== null && f.centroid_longitude !== null)
      },
      breakdowns: {
        by_state: stateBreakdown.map(item => ({
          name: item.name,
          farmers_count: parseInt(item.farmers_count),
          farms_count: parseInt(item.farms_count),
          total_area_acres: parseFloat(item.total_area_acres),
          crops: stateCropsMap[item.name] || {}
        })),
        by_lga: lgaBreakdown.map(item => ({
          name: item.name,
          farmers_count: parseInt(item.farmers_count),
          farms_count: parseInt(item.farms_count),
          total_area_acres: parseFloat(item.total_area_acres),
          crops: lgaCropsMap[item.name] || {}
        })),
        by_community: communityBreakdown.map(item => ({
          name: item.name,
          farmers_count: parseInt(item.farmers_count),
          farms_count: parseInt(item.farms_count),
          total_area_acres: parseFloat(item.total_area_acres),
          crops: communityCropsMap[item.name] || {}
        }))
      },
      unique_crops: uniqueCropsResult.map(row => row.crop_type).filter(Boolean)
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error in farmFilter:", error);
    res.status(500).json({ 
      message: "Error processing farm analytics", 
      error: error.message 
    });
  }
};

const debugData = async (req, res) => {
  try {
    // Check what states exist
    const statesQuery = `
      SELECT DISTINCT f.state, COUNT(*) as farmer_count
      FROM farmer f 
      WHERE f.state IS NOT NULL 
      GROUP BY f.state 
      ORDER BY f.state
    `;
    
    // Check farmer-farm relationship
    const relationshipQuery = `
      SELECT 
        COUNT(DISTINCT f.farmer_id) as total_farmers,
        COUNT(DISTINCT fa.id) as total_farms,
        COUNT(*) as total_records
      FROM farmer f
      LEFT JOIN farm fa ON f.farmer_id::text = fa.farmer_id::text
    `;
    
    // Check sample data
    const sampleQuery = `
      SELECT 
        f.state, f.lga, f.city, f.farmer_id,
        fa.farm_type, fa.crop_type, fa.calculated_area
      FROM farmer f
      LEFT JOIN farm fa ON f.farmer_id::text = fa.farmer_id::text
      LIMIT 10
    `;

    const [statesResult, relationshipResult, sampleResult] = await Promise.all([
      AppDataSource.query(statesQuery),
      AppDataSource.query(relationshipQuery),
      AppDataSource.query(sampleQuery)
    ]);

    res.status(200).json({
      states: statesResult,
      relationship_stats: relationshipResult[0],
      sample_data: sampleResult
    });
  } catch (error) {
    console.error("Error in debugData:", error);
    res.status(500).json({ 
      message: "Error debugging data", 
      error: error.message 
    });
  }
};

module.exports = {
  farmFilter,
  debugData
};