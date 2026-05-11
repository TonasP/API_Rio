const ort = require('onnxruntime-node');
const { Jimp } = require('jimp');
const fs = require('fs'); // Módulo nativo do Windows/Node para arquivos
const path = require('path'); // Módulo para resolver caminhos

async function processarImagemYOLO(nomeDoArquivo) {
    try {
        console.log("Carregando o modelo...");
        const session = await ort.InferenceSession.create('./best.onnx');

        // 1. Monta o caminho exato e à prova de falhas para a sua imagem
        const caminhoExato = path.join(__dirname, nomeDoArquivo);

        // 2. Trava de segurança: Verifica se a foto realmente está na pasta
        if (!fs.existsSync(caminhoExato)) {
            console.error(`\n❌ ERRO FATAL: O arquivo não foi encontrado!`);
            console.error(`O Node procurou exatamente aqui: ${caminhoExato}`);
            return;
        }

        console.log("Preparando a foto da câmera...");
        // 3. Lê a foto do HD como um "Buffer bruto" para o Jimp não achar que é um site
        const arquivoBruto = fs.readFileSync(caminhoExato);
        const image = await Jimp.read(arquivoBruto);
        
        // Redimensiona para o formato matemático do YOLO
        image.resize({ w: 640, h: 640 }); 
        
        const imageBuffer = image.bitmap.data;
        const tensorData = new Float32Array(640 * 640 * 3);
        
        for (let i = 0; i < 640 * 640; i++) {
            tensorData[i] = imageBuffer[i * 4] / 255.0;           
            tensorData[i + 640 * 640] = imageBuffer[i * 4 + 1] / 255.0;   
            tensorData[i + 2 * 640 * 640] = imageBuffer[i * 4 + 2] / 255.0; 
        }
        const tensorEntrada = new ort.Tensor('float32', tensorData, [1, 3, 640, 640]);

        console.log("Procurando a marcação da água...");
        const resultados = await session.run({ images: tensorEntrada });
        
        const saida = resultados.output0.data; 
        const numDeteccoes = 8400; 

        let melhorConfianca = 0;
        let melhorIndice = -1;

        for (let i = 0; i < numDeteccoes; i++) {
            const confianca = saida[4 * numDeteccoes + i]; 
            if (confianca > melhorConfianca) {
                melhorConfianca = confianca;
                melhorIndice = i;
            }
        }

        if (melhorConfianca > 0.5) { 
            const y_center = saida[1 * numDeteccoes + melhorIndice];
            const height = saida[3 * numDeteccoes + melhorIndice];

            const y_min = y_center - (height / 2);

            console.log(`\n🌊 ÁGUA ENCONTRADA COM SUCESSO!`);
            console.log(`Certeza da IA: ${(melhorConfianca * 100).toFixed(2)}%`);
            console.log(`Topo da água (y_min): ${y_min.toFixed(2)} pixels (na escala de 0 a 640)`);
            
        } else {
            console.log("\n❌ A IA não encontrou água com clareza nesta foto.");
        }

    } catch (erro) {
        console.error("\nErro na execução:", erro);
    }
}

// O nome exato da foto (agora usando a sua extensão PNG)
processarImagemYOLO('foto_teste_rio.png');