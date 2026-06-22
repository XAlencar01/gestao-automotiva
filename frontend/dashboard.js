async function carregarDashboard() {
  try {
    const res = await fetch(`${API}/agendamentos`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      throw new Error('Erro ao buscar dados');
    }

    const resposta = await res.json();

    console.log('Resposta API:', resposta);

    // GARANTE ARRAY
    const dados = Array.isArray(resposta)
      ? resposta
      : resposta.dados || resposta.data || resposta.agendamentos || [];

    // CARDS
    document.getElementById('total').innerText = dados.length;

    document.getElementById('pendentes').innerText =
      dados.filter(a => a.status === 'pendente').length;

    document.getElementById('aprovados').innerText =
      dados.filter(a => a.status === 'aprovado').length;

    document.getElementById('recusados').innerText =
      dados.filter(a => a.status === 'recusado').length;

    // GRÁFICO
    const dias = {};

    dados.forEach(a => {
      if (!a.data) return;

      const data = new Date(a.data).toLocaleDateString('pt-BR');

      if (!dias[data]) {
        dias[data] = {
          aprovado: 0,
          pendente: 0,
          recusado: 0
        };
      }

      if (dias[data][a.status] !== undefined) {
        dias[data][a.status]++;
      }
    });

    const labels = Object.keys(dias).sort((a, b) => {
      const [da, ma, ya] = a.split('/');
      const [db, mb, yb] = b.split('/');
      return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
    });

    const aprovadosData = labels.map(d => dias[d].aprovado);
    const pendentesData = labels.map(d => dias[d].pendente);
    const recusadosData = labels.map(d => dias[d].recusado);

    const canvas = document.getElementById('grafico');

    if (canvas) {
      if (window.graficoInstance) {
        window.graficoInstance.destroy();
      }

      window.graficoInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Aprovados',
              data: aprovadosData,
              backgroundColor: '#22c55e',
              borderRadius: 6
            },
            {
              label: 'Pendentes',
              data: pendentesData,
              backgroundColor: '#f59e0b',
              borderRadius: 6
            },
            {
              label: 'Recusados',
              data: recusadosData,
              backgroundColor: '#ef4444',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#a8978c',
                padding: 16
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
                color: '#a8978c'
              },
              grid: {
                color: '#221b17'
              }
            },
            x: {
              ticks: {
                color: '#a8978c'
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // AGENDA DE HOJE
    const hoje = new Date().toLocaleDateString('pt-BR');

    const agendaHoje = dados
      .filter(a => {
        if (!a.data) return false;
        return new Date(a.data).toLocaleDateString('pt-BR') === hoje;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    const container = document.getElementById('agendaHoje');

    if (!container) return;

    container.innerHTML = '';

    const contador = document.getElementById('contador-hoje');

    if (contador) {
      contador.textContent =
        agendaHoje.length +
        (agendaHoje.length === 1 ? ' serviço' : ' serviços');
    }

    if (agendaHoje.length === 0) {
      container.innerHTML = `
        <div style="
          text-align:center;
          padding:2rem 0;
          color:#5a4b43;
          font-size:.875rem;
          font-style:italic;
        ">
          Nenhum serviço agendado para hoje.
        </div>
      `;

      return;
    }

    const badgeMap = {
      aprovado: {
        bg: 'rgba(34,197,94,.12)',
        color: '#22c55e',
        label: 'Aprovado'
      },
      pendente: {
        bg: 'rgba(251,191,36,.12)',
        color: '#fbbf24',
        label: 'Pendente'
      },
      recusado: {
        bg: 'rgba(239,68,68,.12)',
        color: '#ef4444',
        label: 'Recusado'
      }
    };

    agendaHoje.forEach(a => {
      const hora = new Date(a.data).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const badge = badgeMap[a.status] || badgeMap.pendente;

      const div = document.createElement('div');

      div.style.cssText = `
        display:flex;
        align-items:center;
        gap:12px;
        padding:10px 12px;
        border-radius:10px;
        background:rgba(30,41,59,.4);
        border:1px solid #221b17;
        margin-bottom:8px;
        transition:border-color .2s;
      `;

      div.onmouseenter = () => {
        div.style.borderColor = '#ff6b35';
      };

      div.onmouseleave = () => {
        div.style.borderColor = '#221b17';
      };

      const colHora = document.createElement('div');
      colHora.style.cssText = 'min-width:44px;text-align:center;';
      const spanHora = document.createElement('span');
      spanHora.style.cssText = 'font-size:.8rem;font-weight:800;color:#ff6b35;';
      spanHora.textContent = hora;
      colHora.appendChild(spanHora);

      const divisor = document.createElement('div');
      divisor.style.cssText = 'width:1px;height:32px;background:#3a2f29;flex-shrink:0;';

      const colInfo = document.createElement('div');
      colInfo.style.cssText = 'flex:1;min-width:0;';
      const pCliente = document.createElement('p');
      pCliente.style.cssText = 'margin:0;font-size:.875rem;font-weight:600;color:#fdf6f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      pCliente.textContent = a.cliente || 'Cliente não informado';
      const pDetalhe = document.createElement('p');
      pDetalhe.style.cssText = 'margin:2px 0 0;font-size:.75rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      pDetalhe.textContent = `${a.servico || '-'} · ${a.veiculo || '-'}`;
      colInfo.append(pCliente, pDetalhe);

      const spanBadge = document.createElement('span');
      spanBadge.style.cssText = `display:inline-flex;align-items:center;padding:3px 10px;border-radius:9999px;flex-shrink:0;font-size:.7rem;font-weight:700;background:${badge.bg};color:${badge.color};`;
      spanBadge.textContent = badge.label;

      div.append(colHora, divisor, colInfo, spanBadge);
      container.appendChild(div);
    });

  } catch (erro) {
    console.error('Erro no dashboard:', erro);
  }
}

// FUNIL DE CLIENTES
async function carregarFunilClientes() {
  try {
    const res = await fetch(`${API}/clientes?limit=1000`, { headers: getHeaders() });
    if (!res.ok) return;
    const body = await res.json();
    const dados = (body.dados ?? body).filter(c => c.nome !== 'Usuário Removido');

    const contagem = { novo: 0, ativo: 0, recorrente: 0, inativo: 0 };
    dados.forEach(c => {
      const status = c.status_funil ?? 'novo';
      if (contagem[status] !== undefined) contagem[status]++;
    });

    document.getElementById('funil-novo').textContent       = contagem.novo;
    document.getElementById('funil-ativo').textContent      = contagem.ativo;
    document.getElementById('funil-recorrente').textContent = contagem.recorrente;
    document.getElementById('funil-inativo').textContent     = contagem.inativo;
  } catch (erro) {
    console.error('Erro ao carregar funil de clientes:', erro);
  }
}

carregarDashboard();
carregarFunilClientes();