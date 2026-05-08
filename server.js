const cors = require('cors');
const express = require("express");
require("dotenv").config();

const aiRioRouter= require("./aiRio.js")

const app = express()
app.use(cors())
app.use(express.json())

app.use("/analise", aiRioRouter)

app.listen(3000, ()=>{
    console.log("Servidor rodando em http://127.0.0.1:3000")
})