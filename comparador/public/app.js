// app.js — Lógica do frontend

// Ao carregar a página, busca a lista de veículos e popula os selects
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/veiculos');
        const data = await response.json();

        popularSelect('modeloEletrico', data.eletricos);
        popularSelect('modeloCombustao', data.combustao);
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
    }
});

/**
 * Popula um <select> com os veículos, agrupados por categoria via <optgroup>.
 */
function popularSelect(selectId, veiculos) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';

    // Agrupar veículos por categoria
    const grupos = {};
    veiculos.forEach(v => {
        if (!grupos[v.categoria]) {
            grupos[v.categoria] = [];
        }
        grupos[v.categoria].push(v);
    });

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

/**
 * Chamada quando o usuário clica em "Comparar Consumo".
 * Envia km + veículos escolhidos para o backend e exibe o resultado.
 */
async function calcularRota() {
    const distanciaKm = document.getElementById('distanciaKm').value;
    const modeloEletrico = document.getElementById('modeloEletrico').value;
    const modeloCombustao = document.getElementById('modeloCombustao').value;

    if (!distanciaKm || distanciaKm <= 0) {
        alert('Por favor, preencha uma distância válida!');
        return;
    }

    if (!modeloEletrico || !modeloCombustao) {
        alert('Por favor, selecione os dois veículos!');
        return;
    }

    try {
        const params = new URLSearchParams({
            distancia: distanciaKm,
            eletrico: modeloEletrico,
            combustao: modeloCombustao
        });

        const response = await fetch(`/api/comparar-consumo?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            alert('Erro: ' + data.error);
            return;
        }

        // Distância
        document.getElementById('distancia').innerText = data.rota.distanciaKm;

        // Dados do Elétrico
        document.getElementById('el-nome').innerText = data.comparacao.eletrico.veiculo;
        document.getElementById('el-rendimento').innerText = data.comparacao.eletrico.rendimentoEstradaEquivalente;
        document.getElementById('el-gasto').innerText = `Consumo: ${data.comparacao.eletrico.energiaGasta}`;
        document.getElementById('el-custo').innerText = data.comparacao.eletrico.custoTotal;

        // Dados da Combustão
        document.getElementById('comb-nome').innerText = data.comparacao.combustao.veiculo;
        document.getElementById('comb-rendimento').innerText = data.comparacao.combustao.rendimentoEstrada;
        document.getElementById('comb-gasto').innerText = `Consumo: ${data.comparacao.combustao.combustivelGasto}`;
        document.getElementById('comb-custo').innerText = data.comparacao.combustao.custoTotal;

        // Conclusão
        document.getElementById('vencedor').innerText = data.comparacao.analise.maisBarato;
        document.getElementById('diferenca').innerText = data.comparacao.analise.diferenca;

        // Mostrar resultado com animação
        const resultado = document.getElementById('resultado');
        resultado.classList.remove('hidden');
        resultado.style.animation = 'none';
        resultado.offsetHeight; // força reflow
        resultado.style.animation = '';

        async function carregarVeiculos() {
  try {
    const resp = await fetch('/api/veiculos');
    const { eletricos, combustao } = await resp.json();

    preencher('modeloEletrico', eletricos);
    preencher('modeloCombustao', combustao);
  } catch (e) {
    console.error('Erro ao carregar veículos:', e);
  }
}

function preencher(selectId, lista) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Selecione...</option>';
  lista.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.nome;
    select.appendChild(opt);
  });
}

carregarVeiculos();

    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Falha ao conectar com o servidor.');
    }
}