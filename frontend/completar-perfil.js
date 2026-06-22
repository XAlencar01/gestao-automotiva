/**
 * completar-perfil.js
 * Modal de conclusão de cadastro + banner persistente se pular
 */

(function () {

  // Injeta estilos 
  function injetarEstilos() {
    if (document.getElementById('cp-styles')) return;
    const style = document.createElement('style');
    style.id = 'cp-styles';
    style.textContent = `
      #cp-overlay {
        position: fixed; inset: 0; z-index: 8000;
        background: rgba(2,6,23,0.92);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        padding: 1rem;
        animation: cpFadeIn 0.3s ease;
      }
      @keyframes cpFadeIn { from{opacity:0} to{opacity:1} }

      #cp-box {
        background: #17120f;
        border: 1px solid #3a2f29;
        border-radius: 1.5rem;
        padding: 2rem 2rem 1.5rem;
        width: 100%; max-width: 560px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 30px 80px rgba(0,0,0,0.7);
        animation: cpSlide 0.35s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes cpSlide {
        from{opacity:0;transform:scale(0.93) translateY(16px)}
        to{opacity:1;transform:scale(1) translateY(0)}
      }

      .cp-titulo { font-size:1.25rem; font-weight:800; color:#fdf6f0; margin-bottom:0.25rem; }
      .cp-subtitulo { font-size:0.875rem; color:#64748b; margin-bottom:1.5rem; line-height:1.5; }
      .cp-secao { font-size:0.7rem; font-weight:700; color:#ff6b35; text-transform:uppercase; letter-spacing:0.08em; margin:1.25rem 0 0.75rem; }
      .cp-grid { display:grid; gap:0.75rem; }
      .cp-grid-2 { grid-template-columns:1fr 1fr; }
      .cp-grid-3 { grid-template-columns:1fr 1fr 1fr; }
      .cp-label { display:block; font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.35rem; }
      .cp-input { background:#221b17; border:1px solid #3a2f29; color:#fdf6f0; border-radius:0.65rem; padding:0.6rem 0.875rem; font-size:0.875rem; outline:none; width:100%; box-sizing:border-box; transition:border-color 0.2s; font-family:inherit; }
      .cp-input:focus { border-color:#ff6b35; }
      .cp-input::placeholder { color:#5a4b43; }
      .cp-input:disabled { opacity:0.5; cursor:not-allowed; }
      .cp-cep-wrapper { position:relative; }
      .cp-cep-wrapper .cp-input { padding-right:6rem; }
      .cp-btn-cep { position:absolute; right:0.4rem; top:50%; transform:translateY(-50%); background:#cc4a1f; color:white; border:none; border-radius:0.5rem; padding:0.3rem 0.75rem; font-size:0.75rem; font-weight:700; cursor:pointer; transition:background 0.2s; }
      .cp-btn-cep:hover { background:#e85a2a; }
      .cp-btn-cep:disabled { opacity:0.5; cursor:wait; }
      .cp-cep-status { font-size:0.72rem; margin-top:0.3rem; min-height:1rem; }
      .cp-cep-ok { color:#22c55e; }
      .cp-cep-err { color:#ef4444; }
      .cp-rodape { display:flex; gap:0.75rem; margin-top:1.75rem; padding-top:1.25rem; border-top:1px solid #221b17; }
      .cp-btn-pular { flex:1; padding:0.7rem; border-radius:0.75rem; border:1px solid #3a2f29; background:transparent; color:#64748b; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.2s; font-family:inherit; }
      .cp-btn-pular:hover { color:#fdf6f0; border-color:#5a4b43; }
      .cp-btn-salvar { flex:2; padding:0.7rem; border-radius:0.75rem; border:none; background:#ff6b35; color:white; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.2s; font-family:inherit; }
      .cp-btn-salvar:hover { background:#e85a2a; }
      .cp-btn-salvar:disabled { opacity:0.6; cursor:wait; }
      .cp-lgpd { font-size:0.7rem; color:#5a4b43; text-align:center; margin-top:0.75rem; line-height:1.5; }

      /* Banner aniversário */
      #cp-banner-aniversario { display:none; background:linear-gradient(135deg,rgba(251,191,36,.12),rgba(245,158,11,.06)); border:1px solid rgba(251,191,36,.3); border-radius:1rem; padding:1rem 1.25rem; margin-bottom:1.5rem; text-align:center; }
      #cp-banner-aniversario .cp-aniv-emoji { font-size:2rem; margin-bottom:0.5rem; }
      #cp-banner-aniversario .cp-aniv-titulo { font-size:1rem; font-weight:800; color:#fbbf24; margin-bottom:0.25rem; }
      #cp-banner-aniversario .cp-aniv-desc { font-size:0.8rem; color:#d97706; }

      /* Banner persistente de perfil incompleto */
      #cp-banner-incompleto {
        display: none;
        position: fixed;
        bottom: 1.5rem; left: 50%; transform: translateX(-50%);
        z-index: 7000;
        background: linear-gradient(135deg, #221b17, #17120f);
        border: 1px solid rgba(251,191,36,0.4);
        border-radius: 1rem;
        padding: 0.875rem 1.25rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        display: flex; align-items: center; gap: 0.875rem;
        max-width: 480px; width: calc(100% - 2rem);
        animation: cpBannerUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes cpBannerUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      #cp-banner-incompleto .cp-banner-icon { font-size:1.5rem; flex-shrink:0; }
      #cp-banner-incompleto .cp-banner-texto { flex:1; }
      #cp-banner-incompleto .cp-banner-titulo { font-size:0.8rem; font-weight:800; color:#fbbf24; margin-bottom:0.15rem; }
      #cp-banner-incompleto .cp-banner-desc { font-size:0.72rem; color:#a8978c; }
      #cp-banner-incompleto .cp-banner-btn {
        background:#ff6b35; color:white; border:none;
        border-radius:0.65rem; padding:0.5rem 1rem;
        font-size:0.8rem; font-weight:700; cursor:pointer;
        white-space:nowrap; flex-shrink:0; font-family:inherit;
        transition:background 0.2s;
      }
      #cp-banner-incompleto .cp-banner-btn:hover { background:#e85a2a; }
      #cp-banner-incompleto .cp-banner-fechar {
        background:transparent; border:none; color:#5a4b43;
        cursor:pointer; padding:0.25rem; flex-shrink:0;
        font-size:1rem; line-height:1; transition:color 0.2s;
      }
      #cp-banner-incompleto .cp-banner-fechar:hover { color:#fdf6f0; }

      @media(max-width:520px) {
        .cp-grid-2, .cp-grid-3 { grid-template-columns:1fr; }
        #cp-box { padding:1.5rem 1.25rem 1.25rem; }
      }
    `;
    document.head.appendChild(style);
  }

  //Cria banner persistente 
  function criarBannerPersistente() {
    if (document.getElementById('cp-banner-incompleto')) return;
    const div = document.createElement('div');
    div.id = 'cp-banner-incompleto';
    div.innerHTML = `
      <span class="cp-banner-icon">⚠️</span>
      <div class="cp-banner-texto">
        <div class="cp-banner-titulo">Cadastro incompleto</div>
        <div class="cp-banner-desc">Complete seu perfil para aproveitar todos os recursos do sistema.</div>
      </div>
      <button class="cp-banner-btn" onclick="window._cpAbrirModal()">Completar agora</button>
      <button class="cp-banner-fechar" onclick="document.getElementById('cp-banner-incompleto').style.display='none'" title="Fechar">✕</button>
    `;
    document.body.appendChild(div);
    // Garante exibição
    setTimeout(() => { div.style.display = 'flex'; }, 100);
  }

  // Cria o modal 
  function criarModal() {
    const div = document.createElement('div');
    div.id = 'cp-overlay';
    div.innerHTML = `
      <div id="cp-box">
        <div id="cp-banner-aniversario">
          <div class="cp-aniv-emoji">🎂</div>
          <div class="cp-aniv-titulo">Feliz Aniversário!</div>
          <div class="cp-aniv-desc">No seu próximo agendamento você ganha <strong>15% de desconto</strong> + um brinde especial!</div>
        </div>

        <div class="cp-titulo">Complete o seu cadastro</div>
        <p class="cp-subtitulo">Precisamos de mais alguns dados para personalizar o seu atendimento. Todos os dados são protegidos pela <strong style="color:#a8978c">LGPD</strong>.</p>

        <div class="cp-secao">📋 Dados Pessoais</div>
        <div class="cp-grid cp-grid-2">
          <div>
            <label class="cp-label">Telefone *</label>
            <input id="cp-telefone" class="cp-input" type="tel" placeholder="(11) 99999-9999" maxlength="15" oninput="maskTelefone(this)">
          </div>
          <div>
            <label class="cp-label">Data de Nascimento *</label>
            <input id="cp-nascimento" class="cp-input" type="date" max="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>

        <div class="cp-secao">📍 Endereço</div>
        <div style="margin-bottom:0.75rem">
          <label class="cp-label">CEP *</label>
          <div class="cp-cep-wrapper">
            <input id="cp-cep" class="cp-input" type="text" placeholder="00000-000" maxlength="9"
                   oninput="window._cpFormatarCEP(this)">
            <button class="cp-btn-cep" onclick="window._cpBuscarCEP()">Buscar</button>
          </div>
          <div id="cp-cep-status" class="cp-cep-status"></div>
        </div>

        <div class="cp-grid cp-grid-3" style="margin-bottom:0.75rem">
          <div style="grid-column:span 2">
            <label class="cp-label">Logradouro *</label>
            <input id="cp-logradouro" class="cp-input" placeholder="Rua das Flores">
          </div>
          <div>
            <label class="cp-label">Número</label>
            <input id="cp-numero" class="cp-input" placeholder="123">
          </div>
        </div>

        <div class="cp-grid cp-grid-3">
          <div>
            <label class="cp-label">Complemento</label>
            <input id="cp-complemento" class="cp-input" placeholder="Apto 4B">
          </div>
          <div>
            <label class="cp-label">Bairro</label>
            <input id="cp-bairro" class="cp-input" placeholder="Centro">
          </div>
          <div>
            <label class="cp-label">Cidade *</label>
            <input id="cp-cidade" class="cp-input" placeholder="São Paulo">
          </div>
        </div>

        <div style="margin-top:0.75rem;max-width:120px">
          <label class="cp-label">Estado *</label>
          <input id="cp-estado" class="cp-input" placeholder="SP" maxlength="2"
                 oninput="this.value=this.value.toUpperCase()">
        </div>

        <div class="cp-rodape">
          <button class="cp-btn-pular" onclick="window._cpPular()">Pular por agora</button>
          <button class="cp-btn-salvar" id="cp-btn-salvar" onclick="window._cpSalvar()">Salvar e continuar</button>
        </div>

        <p class="cp-lgpd">🔒 Seus dados são armazenados com segurança e não serão compartilhados.</p>
      </div>
    `;
    document.body.appendChild(div);
  }

  // Abre o modal (usado pelo banner) 
  window._cpAbrirModal = function () {
    const banner = document.getElementById('cp-banner-incompleto');
    if (banner) banner.style.display = 'none';
    if (!document.getElementById('cp-overlay')) criarModal();
  };

  // Formata CEP
  window._cpFormatarCEP = function (input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
    input.value = v;
  };

  // Busca ViaCEP
  window._cpBuscarCEP = async function () {
    const cep    = document.getElementById('cp-cep').value.replace(/\D/g, '');
    const status = document.getElementById('cp-cep-status');
    const btn    = document.querySelector('.cp-btn-cep');

    if (cep.length !== 8) {
      status.textContent = 'Digite um CEP válido com 8 dígitos.';
      status.className   = 'cp-cep-status cp-cep-err';
      return;
    }

    btn.disabled = true; btn.textContent = '...';
    status.textContent = 'Buscando...'; status.className = 'cp-cep-status';

    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        status.textContent = 'CEP não encontrado.';
        status.className   = 'cp-cep-status cp-cep-err';
        return;
      }

      document.getElementById('cp-logradouro').value  = data.logradouro  || '';
      document.getElementById('cp-bairro').value      = data.bairro      || '';
      document.getElementById('cp-cidade').value      = data.localidade  || '';
      document.getElementById('cp-estado').value      = data.uf          || '';
      document.getElementById('cp-complemento').value = data.complemento || '';

      status.textContent = `✓ ${data.localidade} — ${data.uf}`;
      status.className   = 'cp-cep-status cp-cep-ok';
      document.getElementById('cp-numero').focus();

    } catch {
      status.textContent = 'Erro ao buscar CEP.';
      status.className   = 'cp-cep-status cp-cep-err';
    } finally {
      btn.disabled = false; btn.textContent = 'Buscar';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement?.id === 'cp-cep') window._cpBuscarCEP();
  });

  // Pular → mostra banner 
  window._cpPular = function () {
    const overlay = document.getElementById('cp-overlay');
    if (overlay) overlay.remove();
    criarBannerPersistente();
  };

  // Salvar perfil 
  window._cpSalvar = async function () {
    const btn            = document.getElementById('cp-btn-salvar');
    const telefone       = document.getElementById('cp-telefone').value.trim();
    const data_nascimento = document.getElementById('cp-nascimento').value;
    const cep            = document.getElementById('cp-cep').value.trim();
    const logradouro     = document.getElementById('cp-logradouro').value.trim();
    const numero         = document.getElementById('cp-numero').value.trim();
    const complemento    = document.getElementById('cp-complemento').value.trim();
    const bairro         = document.getElementById('cp-bairro').value.trim();
    const cidade         = document.getElementById('cp-cidade').value.trim();
    const estado         = document.getElementById('cp-estado').value.trim();

    if (!telefone || !data_nascimento || !cep || !logradouro || !cidade || !estado) {
      toast?.aviso('Preencha os campos obrigatórios (*).') ?? alert('Preencha os campos obrigatórios.');
      return;
    }

    btn.disabled = true; btn.textContent = 'Salvando...';

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${window.API}/cliente/minha-conta`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ telefone, data_nascimento, cep, logradouro, numero, complemento, bairro, cidade, estado })
      });

      const data = await res.json();

      if (!res.ok) {
        toast?.erro(data.erro ?? 'Erro ao salvar.') ?? alert(data.erro ?? 'Erro ao salvar.');
        return;
      }

      toast?.sucesso('Cadastro concluído com sucesso! 🎉');

      // Remove modal e banner
      document.getElementById('cp-overlay')?.remove();
      document.getElementById('cp-banner-incompleto')?.remove();

      if (typeof preencherInfoConta === 'function') preencherInfoConta();
      if (typeof carregarDadosConta === 'function') carregarDadosConta();

    } catch {
      toast?.erro('Erro de conexão.') ?? alert('Erro de conexão.');
    } finally {
      btn.disabled = false; btn.textContent = 'Salvar e continuar';
    }
  };

  // Banner de aniversário 
  function mostrarBannerAniversario() {
    const banner = document.getElementById('cp-banner-aniversario');
    if (banner) banner.style.display = 'block';
  }

  // Verifica perfil ao carregar
  async function verificarPerfil() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${window.API}/cliente/minha-conta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const conta = await res.json();

      if (conta.aniversario_hoje && conta.perfil_completo) {
        toast?.sucesso('🎂 Feliz Aniversário! Seu próximo agendamento tem 15% de desconto!', { duracao: 8000 });
      }

      if (conta.perfil_completo) return;

      injetarEstilos();
      criarModal();
      if (conta.aniversario_hoje) mostrarBannerAniversario();

    } catch (err) {
      console.warn('Erro ao verificar perfil:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarPerfil);
  } else {
    setTimeout(verificarPerfil, 800);
  }

})();