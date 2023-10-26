const cors = require("cors");
const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
dotenv.config();

const app = express();
app.use(express.json());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node JS API Project for PostgreSQL",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:5000/",
      },
    ],
  },
  apis: ["./index.js"],
};
const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

pool.connect();

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

/**
 * @swagger
 * /project/insert:
 *   post:
 *     summary: Insert a project
 *     description: Insert a new project with a project name and link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response with the added project.
 *       400:
 *         description: Bad request or link already exists.
 */

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

/**
 * @swagger
 * /project/delete:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by its ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the project to be deleted.
 *     responses:
 *       200:
 *         description: Successful response with the ID of the deleted project.
 */

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

/**
 * @swagger
 * /project/insert:
 *   post:
 *     summary: Insert a project
 *     description: Insert a new project with a project name and link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response with the added project.
 *       400:
 *         description: Bad request or link already exists.
 */

/**
 * @swagger
 * /project/delete:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project by its ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the project to be deleted.
 *     responses:
 *       200:
 *         description: Successful response with the ID of the deleted project.
 */

/**
 * @swagger
 * /project/update:
 *   put:
 *     summary: Update a project
 *     description: Update a project with a new project name and link.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the project to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful response after updating the project.
 *       400:
 *         description: Bad request or link already exists.
 */

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

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve a list of projects from the database.
 *     responses:
 *       200:
 *         description: Successful response with an array of projects.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 project: Project 1
 *                 link: https://github.com/project1.git
 *               - id: 2
 *                 project: Project 2
 *                 link: https://github.com/project2.git
 */

async function getData() {
  const query = "SELECT * FROM data";

  const data = await pool.query(query);

  return data.rows;
}

app.get("/projects", async (req, res) => {
  const result = await getData();
  res.send(result).status(200);
});
// GET for commit history details after date filter

/**
 * @swagger
 * /history/filterDate:
 *   get:
 *     summary: Get commit history details for the dates mentioned
 *     description: Retrieve commit history details for a specific project in a specific date range
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the project to get commit history for.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start Date of the date filter in the format "dd-mm-yyyy".
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End Date of the date filter in the format "dd-mm-yyyy".
 *     responses:
 *       200:
 *         description: Successful response with commit history details.
 *         content:
 *           application/json:
 *             example:
 *               - id: 18
 *                 user_name: user3
 *                 branch_name: dev
 *                 commit_date: 2023-10-07T18:30:00.000Z
 *                 commit_id: commit8
 *                 num_additions: 14
 *                 num_deletions: 9
 *                 project: 152
 */
async function getProjectDataFilterDate(request) {
  const id = Number(request?.query?.id);
  const startDate = String(request?.query?.startDate);
  const endDate = String(request?.query?.endDate);
  const query =
    "SELECT * FROM commit_history WHERE commit_date >= $1 AND commit_date <= $2 AND project = $3";
  const values = [startDate, endDate, id];
  const data = await pool.query(query, values);
  return data.rows;
}

app.get("/history/filterDate/", async (req, res) => {
  const result = await getProjectDataFilterDate(req);
  res.status(200).send(result);
});

// GET for commit history header

/**
 * @swagger
 * /history/header:
 *   get:
 *     summary: Get commit history header
 *     description: Retrieve header information for a specific project's commit history.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the project to get commit history header for.
 *     responses:
 *       200:
 *         description: Successful response with header information for commit history.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 project: Project 1
 *                 link: https://github.com/project1.git
 */

async function getProjectDataUsingId(request) {
  const id = Number(request?.query?.id);
  const query = "SELECT * FROM data WHERE id = $1";
  const values = [id];

  const data = await pool.query(query, values);

  return data.rows;
}

app.get("/history/header/", async (req, res) => {
  const result = await getProjectDataUsingId(req);
  console.log(result, "herre111");
  res.status(200).send(result);
});
