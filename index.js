const cors = require("cors");
const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwt = require("jsonwebtoken");
dotenv.config();

// const secretKey = process.env.JWT_KEY;

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

// Login Credentials

// app.use("/login", (req, res) => {
//   res.send({
//     token: "test123",
//   });
// });

app.post("/login", async (req, res) => {
  try {
    const email = req.body.username;
    const password = req.body.password;
    console.log(email);

    if (!(email && password)) {
      return res.status(400).send("All input is required");
    }

    const query =
      "SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)";
    const values = [email, password];
    const result = await pool.query(query, values);

    if (result.rows.length === 1) {
      const user = result.rows[0];

      const token = jwt.sign(
        { user_id: user.user_id, email },
        process.env.TOKEN_KEY,
        { expiresIn: "2h" }
      );

      const updateUserQuery = "UPDATE users SET token = $1 WHERE user_id = $2";
      const updateUserValues = [token, user.user_id];
      await pool.query(updateUserQuery, updateUserValues);

      user.token = token;
      return res.status(200).json({"token":token});
    }

    return res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
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

// POST endpoint to insert data into commit_history table

/**
 * @swagger
 * /history/insert:
 *   post:
 *     summary: Insert commit history
 *     description: Insert commit history data into the database.
 *     tags:
 *       - History
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               branch_name:
 *                 type: string
 *               commit_date:
 *                 type: string
 *                 format: date
 *               commit_id:
 *                 type: string
 *               no_of_deletion:
 *                 type: integer
 *               no_of_addition:
 *                 type: integer
 *               project_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Error message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 err:
 *                   type: string
 *       243:
 *         description: Project ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

app.post("/history/insert", (req, res) => {
  const username = req.body.username;
  const branch_name = req.body.branch_name;
  const commit_date = req.body.commit_date;
  const commit_id = req.body.commit_id;
  const no_of_deletion = req.body.no_of_deletion;
  const no_of_addition = req.body.no_of_addition;
  const project_id = req.body.project_id;

  pool.query(
    `INSERT INTO commit_history (project, user_name, branch_name, commit_date, commit_id, num_additions, num_deletions)
    VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [
      project_id,
      username,
      branch_name,
      commit_date,
      commit_id,
      no_of_addition,
      no_of_deletion,
    ],
    (err, result) => {
      if (err) {
        if (err.constraint === "fk_project") {
          return res.status(243).json({ error: "project_id does not exist" });
        } else {
          res.send({ err: err });
        }
      } else {
        res.send({ message: "added", data: result.rows[0] });
      }
    }
  );
});
