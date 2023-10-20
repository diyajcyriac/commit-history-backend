const cors = require("cors");
const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.listen(5000, () => {
  console.log("Listening...");
});

// POST endpoint to insert data
app.post("/project/insert", (req, res) => {
  const project = req.body.project;
  const link = req.body.link;

  pool.query(
    `INSERT INTO data(project, link) VALUES($1, $2) RETURNING *`,
    [project, link],
    (err, result) => {
      if (err) {
        if (err.constraint === "data_link_key") {
          return res.status(400).json({ error: "Link already exists." });
        } else {
          res.send({ err: err });
        }
      } else {
        res.send({ message: "added", data: result.rows[0] });
      }
    }
  );
});
// DELETE endpoint for deleting projects

const deleteUser = (request, response) => {
  const id = Number(request?.query?.id);

  pool.query("DELETE FROM data WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`User deleted with ID: ${id}`);
  });
};

app.delete("/project/delete/", async (req, res) => {
  console.log("inside delete");
  deleteUser(req, res);
});

// PUT endpoints for updating projects

app.put("/project/update/", (req, res) => {
  const id = Number(req?.query?.id);
  const project = req.body.project;
  const link = req.body.link;

  pool.query(
    "UPDATE data SET project = $1, link = $2 WHERE id = $3",
    [project, link, id],
    (err, result) => {
      if (err) {
        if (err.constraint === "data_link_key") {
          return res.status(400).json({ error: "Link already exists." });
        } else {
          res.send({ err: err });
        }
      } else {
        res.send({ message: "updated" });
      }
    }
  );
});


// GET all projects for home page

async function getData() {
  const query = "SELECT * FROM data";

  const data = await pool.query(query);

  return data.rows;
}

app.get("/projects", async (req, res) => {
  const result = await getData();
  res.send(result).status(200);
});

// GET for commit history details

async function getProjectData(request) {
  const id = Number(request?.query?.id);
  const query = "SELECT * FROM commit_history WHERE project = $1";
  const values = [id];

  const data = await pool.query(query, values);

  return data.rows;
}

app.get("/history", async (req, res) => {
  const result = await getProjectData(req);
  res.status(200).send(result);
});


// GET for commit history details after date filter

async function getProjectDataFilterDate(request){
  const id = Number(request?.query?.id);
  const startDate = String(request?.query?.startDate);
  const endDate = String(request?.query?.endDate);
  const query = "SELECT * FROM commit_history WHERE commit_date >= $1 AND commit_date <= $2 AND project = $3";
  const values = [startDate,endDate,id];
  const data = await pool.query(query, values);
  return data.rows;
}

app.get("/history/filterDate/", async (req, res) => {
  const result = await getProjectDataFilterDate(req);
  res.status(200).send(result);
});

// GET for commit history header

async function getProjectDataUsingId(request) {
  const id = Number(request?.query?.id);
  const query = "SELECT * FROM data WHERE id = $1";
  const values = [id];

  const data = await pool.query(query, values);

  return data.rows;
}

app.get("/history/header/", async (req, res) => {
  const result = await getProjectDataUsingId(req);
  console.log(result,"herre111");
  res.status(200).send(result);
});