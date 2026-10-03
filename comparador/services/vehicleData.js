// services/vehicleData.js
// Responsabilidade: fornecer dados dos veículos lendo do arquivo JSON do Inmetro
const veiculosData = require('./data/pbev_2026_veiculos.json');

/**
 * Lista todos os veículos agrupados por tipo para popular os selects do frontend.
 * Retorna só Elétricos e Combustão (ignora Híbridos/Plug-in).
 */
function listarVeiculos() {
    const eletricos = veiculosData
        .filter(v => v.tipo_propulsao === 'Elétrico')
        .map(v => ({
            id: `${v.marca}|${v.modelo}|${v.versao}`,
            nome: `${v.marca} ${v.modelo} (${v.versao})`,
            categoria: v.categoria,
            motor: v.motor
        }));

    const combustao = veiculosData
        .filter(v => v.tipo_propulsao === 'Combustão')
        .map(v => ({
            id: `${v.marca}|${v.modelo}|${v.versao}`,
            nome: `${v.marca} ${v.modelo} (${v.versao})`,
            categoria: v.categoria,
            motor: v.motor
        }));

    return { eletricos, combustao };
}

/**
 * Busca os dados completos de um veículo elétrico e um a combustão pelo ID.
 * ID no formato "MARCA|MODELO|VERSAO"
 */
async function obterDadosVeiculos(idEletrico, idCombustao) {
    let eletrico, combustao;

    if (idEletrico) {
        const [marca, modelo, versao] = idEletrico.split('|');
        eletrico = veiculosData.find(v =>
            v.marca === marca && v.modelo === modelo && v.versao === versao && v.tipo_propulsao === 'Elétrico'
        );
    }
    // Fallback: primeiro elétrico da lista
    if (!eletrico) {
        eletrico = veiculosData.find(v => v.tipo_propulsao === 'Elétrico');
    }

    if (idCombustao) {
        const [marca, modelo, versao] = idCombustao.split('|');
        combustao = veiculosData.find(v =>
            v.marca === marca && v.modelo === modelo && v.versao === versao && v.tipo_propulsao === 'Combustão'
        );
    }
    // Fallback: primeiro combustão da lista
    if (!combustao) {
        combustao = veiculosData.find(v => v.tipo_propulsao === 'Combustão');
    }

    if (!eletrico || !combustao) {
        throw new Error("Veículos não encontrados na base de dados.");
    }

    return {
        eletrico,
        combustao,
        // Preços para o cálculo (já que o Inmetro não fornece preços de energia/combustível)
        precos: {
            kwh: 0.90,       // R$ por kWh
            gasolina: 5.80,  // R$ por Litro de gasolina
            etanol: 3.90     // R$ por Litro de etanol
        }
    };
}

module.exports = { obterDadosVeiculos, listarVeiculos };