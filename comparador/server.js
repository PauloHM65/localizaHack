// server.js
const express = require('express');
const path = require('path');
const { processarRotaEConsumo } = require('./businessRules');
const { listarVeiculos } = require('./services/vehicleData');

const app = express();
const PORT = 3030;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint para listar os veículos agrupados por tipo (elétrico / combustão)
app.get('/api/veiculos', (req, res) => {
    try {
        const veiculos = listarVeiculos();
        res.json(veiculos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para comparar consumo
app.get('/api/comparar-consumo', async (req, res) => {
    const { distancia, eletrico, combustao } = req.query;
    
    if (!distancia) {
        return res.status(400).json({ error: 'A distância é obrigatória.' });
    }
    
    try {
        const resultado = await processarRotaEConsumo(Number(distancia), eletrico, combustao);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});