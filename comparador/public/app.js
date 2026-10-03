// app.js — Lógica do frontend (100% client-side para GitHub Pages)

// ==================== CONFIGURAÇÃO ====================
const PRECOS = {
    kwh: 0.90,       // R$ por kWh
    gasolina: 5.80,  // R$ por Litro de gasolina
    etanol: 3.90     // R$ por Litro de etanol
};

// Cache dos dados do JSON
let veiculosData = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[LOAD] 🚀 Página carregada. Buscando veículos do JSON...');
    try {
        // Caminho relativo — funciona tanto local quanto no GitHub Pages
        const response = await fetch('./data/pbev_2026_veiculos.json');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        veiculosData = await response.json();

        console.log('[LOAD] ✅ JSON carregado com sucesso:', veiculosData.length, 'veículos no total');

        const eletricos = filtrarVeiculos('Elétrico');
        const combustao = filtrarVeiculos('Combustão');

        console.log('[LOAD] 🔋 Elétricos:', eletricos.length, 'veículos');
        console.log('[LOAD] ⛽ Combustão:', combustao.length, 'veículos');
        console.table(eletricos.slice(0, 10));
        console.table(combustao.slice(0, 10));

        popularSelect('modeloEletrico', eletricos);
        popularSelect('modeloCombustao', combustao);

        console.log('[LOAD] ✅ Selects populados com sucesso.');
    } catch (error) {
        console.error('[LOAD] ❌ Erro ao carregar veículos:', error);
    }
});

// ==================== DADOS DE VEÍCULOS ====================

/**
 * Filtra veículos pelo tipo de propulsão e retorna lista formatada para o select.
 */
function filtrarVeiculos(tipoPropulsao) {
    return veiculosData
        .filter(v => v.tipo_propulsao === tipoPropulsao)
        .map(v => ({
            id: `${v.marca}|${v.modelo}|${v.versao}`,
            nome: `${v.marca} ${v.modelo} (${v.versao})`,
            categoria: v.categoria,
            motor: v.motor
        }));
}

/**
 * Busca os dados completos de um veículo pelo ID (formato "MARCA|MODELO|VERSAO").
 */
function buscarVeiculo(id, tipoPropulsao) {
    if (!id) return null;
    const [marca, modelo, versao] = id.split('|');
    return veiculosData.find(v =>
        v.marca === marca && v.modelo === modelo && v.versao === versao && v.tipo_propulsao === tipoPropulsao
    );
}

// ==================== REGRAS DE NEGÓCIO ====================

function formatarNumero(valorStr) {
    if (!valorStr || valorStr === "ND" || valorStr === "-") return 0;
    return parseFloat(valorStr.replace(',', '.'));
}

/**
 * Calcula a comparação de custo entre veículo elétrico e a combustão.
 */
function calcularComparacao(distanciaKm, eletrico, combustao) {
    // CÁLCULO ELÉTRICO
    const consumoMjKm = formatarNumero(eletrico.consumo_energetico_mj_km);
    const consumoKwhKm = consumoMjKm / 3.6;
    const kmLEquivalenteEstrada = formatarNumero(eletrico.modo_eletrico_estrada_ve_ou_ve_hp_gasolina_km_lequivalente);
    const kwhNecessarios = distanciaKm * consumoKwhKm;
    const custoEletrico = kwhNecessarios * PRECOS.kwh;

    // CÁLCULO COMBUSTÃO
    const kmPorLitroEstradaGasolina = formatarNumero(combustao.gasolina_ou_diesel_estrada_km_l);
    const kmPorLitroEstradaEtanol = formatarNumero(combustao.etanol_estrada_km_l);
    const litrosNecessarios = distanciaKm / kmPorLitroEstradaGasolina;
    const custoCombustao = litrosNecessarios * PRECOS.gasolina;

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

// ==================== UI: POPULAR SELECTS ====================

/**
 * Popula um <select> com os veículos, agrupados por categoria via <optgroup>.
 */
function popularSelect(selectId, veiculos) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';

    console.log(`[SELECT] Populando select "${selectId}" com ${veiculos.length} veículos`);

    // Agrupar veículos por categoria
    const grupos = {};
    veiculos.forEach(v => {
        if (!grupos[v.categoria]) {
            grupos[v.categoria] = [];
        }
        grupos[v.categoria].push(v);
    });

    console.log(`[SELECT] Categorias encontradas para "${selectId}":`, Object.keys(grupos));

    // Criar optgroups
    for (const categoria in grupos) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoria;

        grupos[categoria].forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = v.nome;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    }
}

// ==================== UI: COMPARAR CONSUMO ====================

/**
 * Chamada quando o usuário clica em "Comparar Consumo".
 * Tudo é calculado client-side — sem chamadas a API.
 */
async function calcularRota() {
    const distanciaKm = document.getElementById('distanciaKm').value;
    const modeloEletrico = document.getElementById('modeloEletrico').value;
    const modeloCombustao = document.getElementById('modeloCombustao').value;

    console.log('[CLICK] 🖱️ Botão "Comparar Consumo" clicado');
    console.log('[CLICK] 📏 Distância informada:', distanciaKm, 'km');
    console.log('[CLICK] 🔋 Elétrico selecionado (ID):', modeloEletrico);
    console.log('[CLICK] ⛽ Combustão selecionado (ID):', modeloCombustao);

    if (!distanciaKm || distanciaKm <= 0) {
        console.warn('[CLICK] ⚠️ Distância inválida:', distanciaKm);
        alert('Por favor, preencha uma distância válida!');
        return;
    }

    if (!modeloEletrico || !modeloCombustao) {
        console.warn('[CLICK] ⚠️ Veículos não selecionados. Elétrico:', modeloEletrico, '| Combustão:', modeloCombustao);
        alert('Por favor, selecione os dois veículos!');
        return;
    }

    try {
        // Buscar dados completos dos veículos no cache local
        const eletrico = buscarVeiculo(modeloEletrico, 'Elétrico');
        const combustao = buscarVeiculo(modeloCombustao, 'Combustão');

        console.log('[DADOS] 🔋 Dados completos do elétrico:', eletrico);
        console.log('[DADOS] ⛽ Dados completos da combustão:', combustao);

        if (!eletrico || !combustao) {
            console.error('[DADOS] ❌ Veículo não encontrado no JSON!');
            alert('Erro: Veículo não encontrado na base de dados.');
            return;
        }

        // Calcular comparação client-side
        const distancia = Number(distanciaKm);
        const comparacao = calcularComparacao(distancia, eletrico, combustao);

        console.log('[CALCULO] 📊 Resultado da comparação:', JSON.stringify(comparacao, null, 2));

        // Distância
        console.log('[INSERT] 📏 Inserindo distância no DOM:', distancia.toFixed(2));
        document.getElementById('distancia').innerText = distancia.toFixed(2);

        // Dados do Elétrico
        console.log('[INSERT] 🔋 Inserindo dados do elétrico:');
        console.log('[INSERT]   → Veículo:', comparacao.eletrico.veiculo);
        console.log('[INSERT]   → Rendimento:', comparacao.eletrico.rendimentoEstradaEquivalente);
        console.log('[INSERT]   → Energia gasta:', comparacao.eletrico.energiaGasta);
        console.log('[INSERT]   → Custo total:', comparacao.eletrico.custoTotal);

        document.getElementById('el-nome').innerText = comparacao.eletrico.veiculo;
        document.getElementById('el-rendimento').innerText = comparacao.eletrico.rendimentoEstradaEquivalente;
        document.getElementById('el-gasto').innerText = `Consumo: ${comparacao.eletrico.energiaGasta}`;
        document.getElementById('el-custo').innerText = comparacao.eletrico.custoTotal;

        // Dados da Combustão
        console.log('[INSERT] ⛽ Inserindo dados da combustão:');
        console.log('[INSERT]   → Veículo:', comparacao.combustao.veiculo);
        console.log('[INSERT]   → Rendimento:', comparacao.combustao.rendimentoEstrada);
        console.log('[INSERT]   → Combustível gasto:', comparacao.combustao.combustivelGasto);
        console.log('[INSERT]   → Custo total:', comparacao.combustao.custoTotal);

        document.getElementById('comb-nome').innerText = comparacao.combustao.veiculo;
        document.getElementById('comb-rendimento').innerText = comparacao.combustao.rendimentoEstrada;
        document.getElementById('comb-gasto').innerText = `Consumo: ${comparacao.combustao.combustivelGasto}`;
        document.getElementById('comb-custo').innerText = comparacao.combustao.custoTotal;

        // Conclusão
        console.log('[INSERT] 🏆 Inserindo análise:');
        console.log('[INSERT]   → Mais barato:', comparacao.analise.maisBarato);
        console.log('[INSERT]   → Diferença:', comparacao.analise.diferenca);

        document.getElementById('vencedor').innerText = comparacao.analise.maisBarato;
        document.getElementById('diferenca').innerText = comparacao.analise.diferenca;

        // Mostrar resultado com animação
        const resultado = document.getElementById('resultado');
        resultado.classList.remove('hidden');
        resultado.style.animation = 'none';
        resultado.offsetHeight; // força reflow
        resultado.style.animation = '';

        console.log('[INSERT] ✅ Todos os dados inseridos no DOM com sucesso!');

    } catch (error) {
        console.error('[ERROR] ❌ Erro no cálculo:', error);
        alert('Falha ao processar a comparação.');
    }
}