
const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        if (!req.body || !req.body.imagem) {
            return res.status(400).json({ mensagem: "Corpo da requisição inválido ou campo 'imagem' ausente." });
        }
        const response = await fetch('https://serverless.roboflow.com/thomazs-workspace/workflows/find-water-and-scale', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: process.env.AI_API_KEY,
                inputs: {
                    "image": { "type": "base64", "value": req.body.imagem }
                }
            })
        });

        const result = await response.json();
        

        if (result && result.outputs) {
            const listaDeDeteccoes = result.outputs[0].predictions.predictions;

            const escalas = listaDeDeteccoes.filter(item => item.class === "scale");
            const aguas = listaDeDeteccoes.filter(item => item.class === "water");

            res.json({
                mensagem: "Imagem processada com sucesso",
                resumo: {
                    escalaEncontrada: escalas.length > 0,
                    aguaEncontrada: aguas.length > 0,
                    dadosEscala: escalas,
                    dadosAgua: aguas
                }
            });
        }
    }
    catch (error) {
        res.json({ mensagem: "Não foi possivel processar a imagem", erro: error.message })
    }
})
module.exports = router;