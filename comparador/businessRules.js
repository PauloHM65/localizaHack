// businessRules.js
// Responsabilidade: orquestrar os serviços e aplicar as regras de cálculo
const { obterDadosVeiculos } = require('./services/vehicleData');

function formatarNumero(valorStr) {
    if (!valorStr || valorStr === "ND" || valorStr === "-") return 0;
    return parseFloat(valorStr.replace(',', '.'));
}

/**
 * Calcula a comparação de custo entre veículo elétrico e a combustão.
 * Regra de negócio pura — recebe distância e dados, retorna comparação.
 */
function calcularComparacao(distanciaKm, dadosVeiculos) {
    const { eletrico, combustao, precos } = dadosVeiculos;

    // CÁLCULO ELÉTRICO
    const consumoMjKm = formatarNumero(eletrico.consumo_energetico_mj_km);
    const consumoKwhKm = consumoMjKm / 3.6; 
    const kmLEquivalenteEstrada = formatarNumero(eletrico.modo_eletrico_estrada_ve_ou_ve_hp_gasolina_km_lequivalente);
    const kwhNecessarios = distanciaKm * consumoKwhKm;
    const custoEletrico = kwhNecessarios * precos.kwh;

    // CÁLCULO COMBUSTÃO
    const kmPorLitroEstradaGasolina = formatarNumero(combustao.gasolina_ou_diesel_estrada_km_l);
    const kmPorLitroEstradaEtanol = formatarNumero(combustao.etanol_estrada_km_l); 
    const litrosNecessarios = distanciaKm / kmPorLitroEstradaGasolina;
    const custoCombustao = litrosNecessarios * precos.gasolina;

    const diferenca = Math.abs(custoCombustao - custoEletrico);
    const vencedor = custoEletrico < custoCombustao ? 'Elétrico' : 'Combustão';

    return {
        eletrico: {
            veiculo: `${eletrico.marca} ${eletrico.modelo} (${eletrico.versao})`,
            rendimentoEstradaEquivalente: `${kmLEquivalenteEstrada} km/l (Equivalente Gasolina)`, 
            energiaGasta: `${kwhNecessarios.toFixed(2)} kWh`,
            custoTotal: `R$ ${custoEletrico.toFixed(2)}`
        },
        combustao: {
            veiculo: `${combustao.marca} ${combustao.modelo} (${combustao.versao})`,
            rendimentoEstrada: `${kmPorLitroEstradaGasolina} km/l (Gasolina) / ${kmPorLitroEstradaEtanol} km/l (Etanol)`,
            combustivelGasto: `${litrosNecessarios.toFixed(2)} Litros de Gasolina`,
            custoTotal: `R$ ${custoCombustao.toFixed(2)}`
        },
        analise: {
            diferenca: `R$ ${diferenca.toFixed(2)}`,
            maisBarato: vencedor
        }
    };
}

/**
 * Orquestra: busca dados de veículos → calcula comparação.
 * Recebe a distância já pronta e os IDs dos modelos escolhidos pelo usuário.
 */
async function processarRotaEConsumo(distanciaKm, modeloEletrico, modeloCombustao) {
    const dadosVeiculos = await obterDadosVeiculos(modeloEletrico, modeloCombustao); 
    const comparacao = calcularComparacao(distanciaKm, dadosVeiculos);

    return {
        rota: { distanciaKm: distanciaKm.toFixed(2) },
        comparacao
    };
}

module.exports = { processarRotaEConsumo, calcularComparacao };