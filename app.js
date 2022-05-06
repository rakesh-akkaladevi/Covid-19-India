const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running successfully at localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStatetoResponse = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const convertDistrictToResponse = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API GET STATES

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;
    `;
  const statesObject = await db.all(getStatesQuery);
  response.send(statesObject.map((item) => convertStatetoResponse(item)));
});

//API GET STATE

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `;
  const stateObject = await db.get(getStateQuery);
  response.send(convertStatetoResponse(stateObject));
});

//API POST DISTRICT

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district(state_id, district_name, cases, cured, active, deaths)
    VALUES (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths})
    `;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API GET DISTRICT

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `;
  const districtObject = await db.get(getDistrictQuery);
  response.send(convertDistrictToResponse(districtObject));
});

//API DELETE DISTRICT

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE DISTRICT

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE district
    SET district_name = '${districtName}', state_id = ${stateId}, cases = ${cases}, cured = ${cured}, active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// GET STATISTICS BASED ON STATE ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateStatisticsQuery = `
    SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths)
    FROM district
    WHERE state_id = ${stateId};
    `;
  const stats = await db.get(stateStatisticsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API GET DISTRICT

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_name
    FROM state NATURAL JOIN district 
    WHERE district_id = ${districtId};
    `;
  const stateDistrictQuery = await db.get(getDistrictQuery);
  response.send({ stateName: stateDistrictQuery.state_name });
});

module.exports = app;
