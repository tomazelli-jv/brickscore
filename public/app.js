/* =============================================================
   BRICKSCORE — app.js
   Vanilla JS, sem frameworks. Organizado em módulos (namespaces).
   ============================================================= */
'use strict';

/* =============================================================
   MODULE: DB  (persistência em localStorage)
   ============================================================= */
const DB_KEY = 'brickscore_db_v1';

const DB = (() => {

    const DEFAULT_LEAGUE_NAME = 'LNT - Liga Nacional de Tijoladas';

    function empty() {

        const year = new Date().getFullYear();

        return {
            players: [],
            matches: [],
            seasons: [year],
            currentSeason: year,
            leagueName: DEFAULT_LEAGUE_NAME
        };

    }

    let state = empty();

    async function load() {

        try {

            const response = await fetch('/api/db');

            if (!response.ok)
                throw new Error('Erro ao buscar banco');

            const data = await response.json();

            if (!data.players || !data.matches) {

                state = empty();

                await save();

            } else {

                state = data;

                if (!state.seasons)
                    state.seasons = [new Date().getFullYear()];

                if (!state.currentSeason)
                    state.currentSeason = state.seasons[state.seasons.length - 1];

                if (!state.leagueName)
                    state.leagueName = DEFAULT_LEAGUE_NAME;

            }

        } catch (e) {

            console.error(e);

            state = empty();

        }

    }

   async function save() {
    try {
        const response = await fetch("/api/db", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(state)
        });

        if (!response.ok) {
            const erro = await response.text();
            throw new Error(erro);
        }

        return true;
    } catch (err) {
        console.error(err);
        Toast.show("Erro ao salvar dados.");
        return false;
    }
}

    return {

        get data() {

            return state;

        },

        async load() {

            await load();

        },

        async save() {

            await DB.save();

        },

        async replace(newState) {

            state = newState;

            await save();

        },

        async reset() {

            state = empty();

            await save();

        }

    };

})();

/* =============================================================
   MODULE: Utils
   ============================================================= */
const Utils = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
  todayISO() {
    return new Date().toISOString().slice(0, 10);
  },
  nowISO() {
    return new Date().toISOString();
  },
  isSameDay(iso, dateISO) {
    return iso.slice(0, 10) === dateISO;
  },
  yearOf(iso) {
    return new Date(iso).getFullYear();
  },
  formatDateShort(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  },
  formatDateFull(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  },
  initials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },
  weekRange(refDate = new Date()) {
    const d = new Date(refDate);
    const day = (d.getDay() + 6) % 7; // 0 = segunda
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  },
  monthRange(refDate = new Date()) {
    const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  },
  round1(n) {
    return Math.round(n * 10) / 10;
  },
  formatSize(format) {
    return { '2x2': 2, '3x3': 3, '4x4': 4, '5x5': 5 }[format] || 2;
  },
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[m]));
  },
};

/* =============================================================
   MODULE: Toast
   ============================================================= */
const Toast = {
  show(msg) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  },
};

/* =============================================================
   MODULE: Players (CRUD)
   ============================================================= */
const Players = {

  list: [],

  async load() {

    const response = await fetch("/api/players");
    this.list = await response.json();

  },

  all() {

    return this.list;

  },

  byId(id) {

    return this.list.find(p => p.id === id);

  },

  async add(name) {

    const player = {
      id: Utils.uid(),
      name: name.trim(),
      createdAt: Utils.nowISO()
    };

    await fetch("/api/players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(player)
    });

    await this.load();

    return player;

  },

  async rename(id, name) {

    await fetch("/api/players/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name
      })
    });

    await this.load();

  },

  async remove(id) {

    await fetch("/api/players/" + id, {
      method: "DELETE"
    });

    await this.load();

  },

  search(term) {

    const t = term.trim().toLowerCase();

    if (!t)
      return this.list;

    return this.list.filter(p =>
      p.name.toLowerCase().includes(t)
    );

  }

};

/* =============================================================
   MODULE: Matches (CRUD)
   ============================================================= */
const Matches = {

  list: [],

  async load() {

    const response = await fetch("/api/matches");
    this.list = await response.json();

  },

  all() {

    return this.list.slice().sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

  },

  byId(id) {

    return this.list.find(m => m.id === id);

  },

  bySeason(year) {

    return this.all().filter(m => m.season === year);

  },

  async add(match) {

    match.id = Utils.uid();

    await fetch("/api/matches", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(match)

    });

    await this.load();

    return match;

  },

  async update(id, patch) {

    await fetch("/api/matches/" + id, {

      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(patch)

    });

    await this.load();

  },

  async remove(id) {

    await fetch("/api/matches/" + id, {

      method: "DELETE"

    });

    await this.load();

  },

  async duplicate(id) {

    const m = this.byId(id);

    if (!m)
      return null;

    const copy = JSON.parse(JSON.stringify(m));

    delete copy.id;

    copy.date = Utils.nowISO();

    copy.season = Utils.yearOf(copy.date);

    return await this.add(copy);

  },

  playerMatches(playerId, matchesPool) {

    const pool = matchesPool || this.all();

    return pool.filter(m =>
      m.teamAIds.includes(playerId) ||
      m.teamBIds.includes(playerId)
    );

  }

};

/* =============================================================
   MODULE: Stats  (motor de estatísticas — tudo derivado do histórico)
   ============================================================= */
const Stats = {
  forPlayer(playerId, matchesPool) {
    const pool = (matchesPool || Matches.all())
      .filter((m) => m.teamAIds.includes(playerId) || m.teamBIds.includes(playerId))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const out = {
      games: 0, wins: 0, losses: 0, draws: 0,
      points: 0, threePoints: 0, assists: 0, mvps: 0,
      avgPoints: 0, maxPoints: 0, maxAssists: 0, maxThreePoints: 0,
      currentStreak: 0, bestStreak: 0, efficiency: 0,
      history: [],
    };

    let runStreak = 0;
    pool.forEach((m) => {
      const s = m.stats[playerId];
      if (!s) return;
      const onTeamA = m.teamAIds.includes(playerId);
      const won = (onTeamA && m.winner === 'A') || (!onTeamA && m.winner === 'B');
      const drew = m.winner === 'draw';

      out.games += 1;
      out.points += s.points || 0;
      out.threePoints += s.threePoints || 0;
      out.assists += s.assists || 0;
      if (m.mvpId === playerId) out.mvps += 1;

      out.maxPoints = Math.max(out.maxPoints, s.points || 0);
      out.maxAssists = Math.max(out.maxAssists, s.assists || 0);
      out.maxThreePoints = Math.max(out.maxThreePoints, s.threePoints || 0);

      if (drew) { out.draws += 1; runStreak = 0; }
      else if (won) { out.wins += 1; runStreak += 1; }
      else { out.losses += 1; runStreak = 0; }
      out.bestStreak = Math.max(out.bestStreak, runStreak);

      out.history.push({
        date: m.date, points: s.points || 0, assists: s.assists || 0,
        threePoints: s.threePoints || 0, win: won, matchId: m.id,
      });
    });

    out.currentStreak = runStreak;
    out.avgPoints = out.games ? Utils.round1(out.points / out.games) : 0;
    const avgAssists = out.games ? out.assists / out.games : 0;
    const avgThree = out.games ? out.threePoints / out.games : 0;
    out.efficiency = out.games
      ? Utils.round1(out.avgPoints + avgAssists * 1.5 + avgThree * 1.2)
      : 0;

    return out;
  },

  forAllPlayers(matchesPool) {
    const pool = matchesPool || Matches.all();
    const ids = new Set();
    pool.forEach((m) => { m.teamAIds.forEach((id) => ids.add(id)); m.teamBIds.forEach((id) => ids.add(id)); });
    return Array.from(ids).map((id) => ({ player: Players.byId(id), stats: Stats.forPlayer(id, pool) }))
      .filter((r) => r.player);
  },

  matchesForPeriod(period, season) {
    const all = Matches.all();
    if (period === 'geral') return all;
    if (period === 'temporada') return all.filter((m) => m.season === season);
    if (period === 'hoje') return all.filter((m) => Utils.isSameDay(m.date, Utils.todayISO()));
    if (period === 'semana') {
      const { start, end } = Utils.weekRange();
      return all.filter((m) => { const d = new Date(m.date); return d >= start && d <= end; });
    }
    if (period === 'mes') {
      const { start, end } = Utils.monthRange();
      return all.filter((m) => { const d = new Date(m.date); return d >= start && d <= end; });
    }
    return all;
  },

  ranking(type, matchesPool) {
    const rows = Stats.forAllPlayers(matchesPool);
    const valueOf = (r) => {
      switch (type) {
        case 'pontos': return r.stats.points;
        case 'assistencias': return r.stats.assists;
        case 'bolas3': return r.stats.threePoints;
        case 'vitorias': return r.stats.wins;
        case 'mvp': return r.stats.mvps;
        case 'eficiencia': return r.stats.efficiency;
        case 'media': return r.stats.avgPoints;
        default: return r.stats.points;
      }
    };
    return rows
      .map((r) => ({ ...r, value: valueOf(r) }))
      .sort((a, b) => b.value - a.value);
  },

  mvpOfPeriod(period) {
    const pool = Stats.matchesForPeriod(period, DB.data.currentSeason);
    const rank = Stats.ranking('pontos', pool);
    return rank.length ? rank[0] : null;
  },

  ratingFor(playerId) {
    const s = Stats.forPlayer(playerId);
    if (!s.games) return 0;
    const winRate = s.wins / s.games;
    return Utils.round1(s.avgPoints + winRate * 8 + s.efficiency * 0.5);
  },
};

/* =============================================================
   MODULE: Badges (conquistas)
   ============================================================= */
const Badges = {
  DEFS: [
    { id: 'pts100', icon: '🔥', label: '100 Pontos', test: (s) => s.points >= 100 },
    { id: 'pts500', icon: '🏀', label: '500 Pontos', test: (s) => s.points >= 500 },
    { id: 'wins50', icon: '🏆', label: '50 Vitórias', test: (s) => s.wins >= 50 },
    { id: 'mvp1', icon: '⭐', label: 'MVP', test: (s) => s.mvps >= 1 },
    { id: 'three20', icon: '🎯', label: 'Especialista em 3', test: (s) => s.threePoints >= 20 },
    { id: 'ast100', icon: '🤝', label: 'Mestre das Assistências', test: (s) => s.assists >= 100 },
    { id: 'legend', icon: '💎', label: 'Lenda', test: (s) => s.games >= 50 && s.efficiency >= 20 },
  ],
  forPlayer(playerId) {
    const s = Stats.forPlayer(playerId);
    const earned = Badges.DEFS.filter((b) => b.test(s));
    if (Badges.isChampion(playerId, DB.data.currentSeason)) {
      earned.push({ id: 'champion', icon: '👑', label: `Campeão ${DB.data.currentSeason}` });
    }
    return earned;
  },
  isChampion(playerId, season) {
    const pool = Matches.bySeason(season);
    if (!pool.length) return false;
    const rank = Stats.ranking('vitorias', pool);
    return rank.length > 0 && rank[0].player.id === playerId && rank[0].value > 0;
  },
};

/* =============================================================
   MODULE: Modal (genérico)
   ============================================================= */
const Modal = {
  open(html) {
    document.getElementById('modal-container').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-container').innerHTML = '';
  },
  confirm(title, message, onConfirm, confirmLabel = 'Confirmar') {
    Modal.open(`
      <div class="modal-header"><h2>${Utils.escapeHtml(title)}</h2>
        <button class="modal-close" id="m-close">✕</button></div>
      <div class="modal-body"><p style="color:var(--text-dim);font-size:14px;line-height:1.5;">${Utils.escapeHtml(message)}</p></div>
      <div class="modal-footer">
        <button class="btn-secondary" id="m-cancel">Cancelar</button>
        <button class="btn-danger" id="m-confirm" style="flex:1;">${Utils.escapeHtml(confirmLabel)}</button>
      </div>`);
    document.getElementById('m-close').onclick = Modal.close;
    document.getElementById('m-cancel').onclick = Modal.close;
    document.getElementById('m-confirm').onclick = () => { onConfirm(); Modal.close(); };
  },
};

/* =============================================================
   MODULE: PlayerForm (modal de criar/editar jogador)
   ============================================================= */
const PlayerForm = {
  open(playerId) {
    const editing = playerId ? Players.byId(playerId) : null;
    Modal.open(`
      <div class="modal-header"><h2>${editing ? 'Editar jogador' : 'Novo jogador'}</h2>
        <button class="modal-close" id="pf-close">✕</button></div>
      <div class="modal-body">
        <div class="field">
          <label>Nome do jogador</label>
          <input type="text" id="pf-name" placeholder="Ex: João Silva" value="${editing ? Utils.escapeHtml(editing.name) : ''}" maxlength="40">
        </div>
      </div>
      <div class="modal-footer">
        ${editing ? '<button class="btn-danger" id="pf-delete">Excluir</button>' : '<button class="btn-secondary" id="pf-cancel">Cancelar</button>'}
        <button class="btn-primary" id="pf-save" style="flex:1;">Salvar</button>
      </div>`);
    document.getElementById('pf-close').onclick = Modal.close;
    const cancelBtn = document.getElementById('pf-cancel');
    if (cancelBtn) cancelBtn.onclick = Modal.close;
    const input = document.getElementById('pf-name');
    setTimeout(() => input.focus(), 50);

    document.getElementById('pf-save').onclick = () => {
      const name = input.value.trim();
      if (!name) { Toast.show('Digite um nome'); return; }
      if (editing) Players.rename(editing.id, name);
      else Players.add(name);
      Modal.close();
      Router.render();
      Toast.show('Jogador salvo');
    };

    const delBtn = document.getElementById('pf-delete');
    if (delBtn) {
      delBtn.onclick = () => {
        Modal.confirm('Excluir jogador', `Remover ${editing.name}? O histórico de partidas será mantido, mas o jogador sairá das listagens.`, () => {
          Players.remove(editing.id);
          Router.go('players');
          Toast.show('Jogador excluído');
        }, 'Excluir');
      };
    }
  },
};

/* =============================================================
   MODULE: MatchWizard (fluxo de Registrar/Editar Partida)
   ============================================================= */
const MatchWizard = {
  state: null,

  open(editingId) {
    const editing = editingId ? Matches.byId(editingId) : null;
    if (editing) {
      this.state = {
        editingId,
        step: 0,
        teamAName: editing.teamA,
        teamBName: editing.teamB,
        format: editing.format,
        selected: new Set([...editing.teamAIds, ...editing.teamBIds]),
        teamAIds: editing.teamAIds.slice(),
        teamBIds: editing.teamBIds.slice(),
        statsMap: JSON.parse(JSON.stringify(editing.stats)),
        search: '',
      };
    } else {
      this.state = {
        editingId: null,
        step: 0,
        teamAName: 'Time A',
        teamBName: 'Time B',
        format: '3x3',
        selected: new Set(),
        teamAIds: [],
        teamBIds: [],
        statsMap: {},
        search: '',
      };
    }
    this.render();
  },

  size() { return Utils.formatSize(this.state.format); },

  render() {
    Modal.open(`
      <div class="modal-header">
        <div class="mh-titles">
          <div class="mh-eyebrow">${this.state.editingId ? 'Editar partida' : 'Nova partida'}</div>
          <h2 id="mw-title"></h2>
        </div>
        <button class="modal-close" id="mw-close">✕</button>
      </div>
      <div class="modal-body" id="mw-body"></div>
      <div class="modal-footer" id="mw-footer"></div>
    `);
    document.getElementById('mw-close').onclick = () => {
      Modal.confirm('Cancelar registro', 'Deseja descartar esta partida?', Modal.close, 'Descartar');
    };
    this.renderStep();
  },

  stepTitle() {
    return ['Times e formato', 'Selecionar jogadores', 'Montar times', 'Registrar estatísticas'][this.state.step];
  },

  renderStep() {
    const body = document.getElementById('mw-body');
    const footer = document.getElementById('mw-footer');
    const s = this.state;
    document.getElementById('mw-title').textContent = this.stepTitle();

    if (s.step === 0) {
      body.innerHTML = `
        <div class="field-row">
          <div class="field"><label>Nome do time A</label><input type="text" id="mw-teamA" value="${Utils.escapeHtml(s.teamAName)}" maxlength="20"></div>
          <div class="field"><label>Nome do time B</label><input type="text" id="mw-teamB" value="${Utils.escapeHtml(s.teamBName)}" maxlength="20"></div>
        </div>
        <div class="field">
          <label>Formato da partida</label>
          <div class="format-grid">
            ${['2x2', '3x3', '4x4', '5x5'].map((f) => `<div class="format-opt ${f === s.format ? 'active' : ''}" data-fmt="${f}">${f}</div>`).join('')}
          </div>
        </div>`;
      body.querySelectorAll('.format-opt').forEach((el) => {
        el.onclick = () => {
          s.teamAName = document.getElementById('mw-teamA').value.trim() || 'Time A';
          s.teamBName = document.getElementById('mw-teamB').value.trim() || 'Time B';
          s.format = el.dataset.fmt;
          this.renderStep();
        };
      });
      footer.innerHTML = `<button class="btn-primary" id="mw-next" style="flex:1;">Continuar</button>`;
      document.getElementById('mw-next').onclick = () => {
        s.teamAName = document.getElementById('mw-teamA').value.trim() || 'Time A';
        s.teamBName = document.getElementById('mw-teamB').value.trim() || 'Time B';
        s.step = 1; this.renderStep();
      };
      return;
    }

    if (s.step === 1) {
      const needed = this.size() * 2;
      const list = Players.search(s.search);
      body.innerHTML = `
        <div class="section-title" style="margin-bottom:8px;">
          <h2>Jogadores presentes</h2>
          <span class="link">${s.selected.size} / ${needed}</span>
        </div>
        <div class="field"><input type="text" id="mw-search" placeholder="Buscar jogador..." value="${Utils.escapeHtml(s.search)}"></div>
        <div class="player-pick-list" id="mw-pick-list">
          ${list.length ? list.map((p) => `
            <div class="player-pick-row ${s.selected.has(p.id) ? 'selected' : ''}" data-id="${p.id}">
              <div class="avatar sm orange">🏀</div>
              <div class="row-main"><div class="row-title">${Utils.escapeHtml(p.name)}</div></div>
              <div class="pick-toggle">${s.selected.has(p.id) ? '✓' : '+'}</div>
            </div>`).join('') : '<div class="empty-state">Nenhum jogador. Cadastre em "Jogadores".</div>'}
        </div>`;

      document.getElementById('mw-search').oninput = (e) => { s.search = e.target.value; this.renderStep(); document.getElementById('mw-search').focus(); };
      body.querySelectorAll('.player-pick-row').forEach((row) => {
        row.onclick = () => {
          const id = row.dataset.id;
          if (s.selected.has(id)) s.selected.delete(id); else s.selected.add(id);
          this.renderStep();
        };
      });

      footer.innerHTML = `
        <button class="btn-secondary" id="mw-back">Voltar</button>
        <button class="btn-primary" id="mw-next" style="flex:1;" ${s.selected.size !== needed ? 'disabled style="opacity:.4;flex:1;"' : ''}>Continuar</button>`;
      document.getElementById('mw-back').onclick = () => { s.step = 0; this.renderStep(); };
      document.getElementById('mw-next').onclick = () => {
        if (s.selected.size !== needed) { Toast.show(`Selecione exatamente ${needed} jogadores`); return; }
        if (!s.teamAIds.length && !s.teamBIds.length) this.autoDraft();
        else this.reconcileTeams();
        s.step = 2; this.renderStep();
      };
      return;
    }

    if (s.step === 2) {
      const size = this.size();
      body.innerHTML = `
        <p style="color:var(--text-dim);font-size:13px;margin:0 0 4px;">O sorteio equilibra os times pelo histórico de desempenho. Você pode mover jogadores manualmente.</p>
        <button class="btn-chip" id="mw-shuffle" style="margin-bottom:12px;">🔀 Sortear novamente</button>
        <div class="team-split">
          <div class="team-col"><h4>${Utils.escapeHtml(s.teamAName)} (${s.teamAIds.length}/${size})</h4>${this.teamColHtml(s.teamAIds, 'A')}</div>
          <div class="team-col"><h4>${Utils.escapeHtml(s.teamBName)} (${s.teamBIds.length}/${size})</h4>${this.teamColHtml(s.teamBIds, 'B')}</div>
        </div>`;
      document.getElementById('mw-shuffle').onclick = () => { this.autoDraft(); this.renderStep(); };
      body.querySelectorAll('[data-move]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.dataset.move;
          const from = btn.dataset.from;
          if (from === 'A') { s.teamAIds = s.teamAIds.filter((x) => x !== id); s.teamBIds.push(id); }
          else { s.teamBIds = s.teamBIds.filter((x) => x !== id); s.teamAIds.push(id); }
          this.renderStep();
        };
      });
      const balanced = s.teamAIds.length === size && s.teamBIds.length === size;
      footer.innerHTML = `
        <button class="btn-secondary" id="mw-back">Voltar</button>
        <button class="btn-primary" id="mw-next" style="flex:1;" ${balanced ? '' : 'disabled style="opacity:.4;flex:1;"'}>Continuar</button>`;
      document.getElementById('mw-back').onclick = () => { s.step = 1; this.renderStep(); };
      document.getElementById('mw-next').onclick = () => {
        if (!balanced) { Toast.show(`Cada time precisa de ${size} jogadores`); return; }
        [...s.teamAIds, ...s.teamBIds].forEach((id) => { if (!s.statsMap[id]) s.statsMap[id] = { points: 0, assists: 0, threePoints: 0 }; });
        s.step = 3; this.renderStep();
      };
      return;
    }

    if (s.step === 3) {
      this.renderStatsStep(body, footer);
    }
  },

  teamColHtml(ids, side) {
    if (!ids.length) return '<p style="color:var(--text-faint);font-size:12.5px;">Nenhum jogador</p>';
    return ids.map((id) => {
      const p = Players.byId(id);
      if (!p) return '';
      return `<div class="tp"><span>${Utils.escapeHtml(p.name)}</span><button data-move="${id}" data-from="${side}" title="Mover para o outro time">⇄</button></div>`;
    }).join('');
  },

  autoDraft() {
    const s = this.state;
    const size = this.size();
    const ids = Array.from(s.selected);
    const ranked = ids.map((id) => ({ id, rating: Stats.ratingFor(id) + Math.random() * 0.01 }))
      .sort((a, b) => b.rating - a.rating);
    const A = []; const B = [];
    ranked.forEach((r, i) => {
      // draft em serpentina para equilibrar: 0->A,1->B,2->B,3->A,4->A,5->B...
      const cycle = i % 4;
      if (cycle === 0 || cycle === 3) { if (A.length < size) A.push(r.id); else B.push(r.id); }
      else if (B.length < size) B.push(r.id); else A.push(r.id);
    });
    s.teamAIds = A.slice(0, size);
    s.teamBIds = B.slice(0, size);
  },

  reconcileTeams() {
    // mantém alocações existentes, distribui novos selecionados nos times com vaga
    const s = this.state;
    const size = this.size();
    s.teamAIds = s.teamAIds.filter((id) => s.selected.has(id));
    s.teamBIds = s.teamBIds.filter((id) => s.selected.has(id));
    const placed = new Set([...s.teamAIds, ...s.teamBIds]);
    Array.from(s.selected).filter((id) => !placed.has(id)).forEach((id) => {
      if (s.teamAIds.length < size) s.teamAIds.push(id);
      else if (s.teamBIds.length < size) s.teamBIds.push(id);
    });
  },

  renderStatsStep(body, footer) {
    const s = this.state;
    const scoreA = s.teamAIds.reduce((sum, id) => sum + (Number(s.statsMap[id]?.points) || 0), 0);
    const scoreB = s.teamBIds.reduce((sum, id) => sum + (Number(s.statsMap[id]?.points) || 0), 0);

    const rowsFor = (ids) => ids.map((id) => {
      const p = Players.byId(id);
      const st = s.statsMap[id] || { points: 0, assists: 0, threePoints: 0 };
      return `
        <div class="stat-input-row" data-pid="${id}">
          <span class="siname">${Utils.escapeHtml(p ? p.name : '?')}</span>
          <div><input type="number" min="0" class="si-points" value="${st.points}"><div class="silabel">PTS</div></div>
          <div><input type="number" min="0" class="si-assists" value="${st.assists}"><div class="silabel">AST</div></div>
          <div><input type="number" min="0" class="si-three" value="${st.threePoints}"><div class="silabel">3PT</div></div>
        </div>`;
    }).join('');

    body.innerHTML = `
      <div class="score-preview" id="mw-score-preview">
        <div class="side"><div class="tname">${Utils.escapeHtml(s.teamAName)}</div><div class="tscore" id="mw-scoreA">${scoreA}</div></div>
        <div class="vs">VS</div>
        <div class="side"><div class="tname">${Utils.escapeHtml(s.teamBName)}</div><div class="tscore" id="mw-scoreB">${scoreB}</div></div>
      </div>
      <div class="section-sub">${Utils.escapeHtml(s.teamAName)}</div>
      ${rowsFor(s.teamAIds)}
      <div class="section-sub">${Utils.escapeHtml(s.teamBName)}</div>
      ${rowsFor(s.teamBIds)}
    `;

    const recalc = () => {
      body.querySelectorAll('.stat-input-row').forEach((row) => {
        const id = row.dataset.pid;
        s.statsMap[id] = {
          points: Number(row.querySelector('.si-points').value) || 0,
          assists: Number(row.querySelector('.si-assists').value) || 0,
          threePoints: Number(row.querySelector('.si-three').value) || 0,
        };
      });
      const nScoreA = s.teamAIds.reduce((sum, id) => sum + (s.statsMap[id]?.points || 0), 0);
      const nScoreB = s.teamBIds.reduce((sum, id) => sum + (s.statsMap[id]?.points || 0), 0);
      document.getElementById('mw-scoreA').textContent = nScoreA;
      document.getElementById('mw-scoreB').textContent = nScoreB;
    };
    body.querySelectorAll('input').forEach((inp) => { inp.oninput = recalc; });

    footer.innerHTML = `
      <button class="btn-secondary" id="mw-back">Voltar</button>
      <button class="btn-primary" id="mw-save" style="flex:1;">Salvar partida</button>`;
    document.getElementById('mw-back').onclick = () => { recalc(); s.step = 2; this.renderStep(); };
    document.getElementById('mw-save').onclick = () => { recalc(); this.save(); };
  },

  computeMvp() {
    const s = this.state;
    const all = [...s.teamAIds, ...s.teamBIds];
    let best = [];
    let bestKey = null;
    all.forEach((id) => {
      const st = s.statsMap[id] || { points: 0, assists: 0, threePoints: 0 };
      const key = [st.points, st.assists, st.threePoints];
      if (!bestKey || key[0] > bestKey[0] ||
          (key[0] === bestKey[0] && key[1] > bestKey[1]) ||
          (key[0] === bestKey[0] && key[1] === bestKey[1] && key[2] > bestKey[2])) {
        bestKey = key; best = [id];
      } else if (key[0] === bestKey[0] && key[1] === bestKey[1] && key[2] === bestKey[2]) {
        best.push(id);
      }
    });
    return best.length === 1 ? { mvpId: best[0], tie: null } : { mvpId: null, tie: best };
  },

  save() {
    const s = this.state;
    const scoreA = s.teamAIds.reduce((sum, id) => sum + (s.statsMap[id]?.points || 0), 0);
    const scoreB = s.teamBIds.reduce((sum, id) => sum + (s.statsMap[id]?.points || 0), 0);
    const winner = scoreA === scoreB ? 'draw' : (scoreA > scoreB ? 'A' : 'B');
    const { mvpId, tie } = this.computeMvp();
    const date = s.editingId ? Matches.byId(s.editingId).date : Utils.nowISO();

    const payload = {
      date,
      season: Utils.yearOf(date),
      format: s.format,
      teamA: s.teamAName,
      teamB: s.teamBName,
      teamAIds: s.teamAIds,
      teamBIds: s.teamBIds,
      stats: s.statsMap,
      scoreA, scoreB, winner,
      mvpId, mvpTie: tie,
    };

    if (s.editingId) Matches.update(s.editingId, payload);
    else Matches.add(payload);

    Modal.close();
    Toast.show(tie ? 'Partida salva — empate de MVP' : 'Partida salva!');
    Router.go('matches');
  },
};

/* =============================================================
   MODULE: Router / State
   ============================================================= */
const State = {
  view: 'home',
  playerProfileId: null,
  matchDetailId: null,
  playersSearch: '',
  matchesSeasonFilter: 'todas',
  rankingPeriod: 'geral',
  rankingType: 'pontos',
};

const Router = {
  go(view, params = {}) {
    Object.assign(State, params);
    State.view = view;
    this.render();
    window.scrollTo(0, 0);
  },

  render() {
    document.querySelectorAll('.view').forEach((el) => el.classList.add('hidden'));
    const el = document.getElementById(`view-${State.view}`);
    if (el) el.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach((btn) => {
      const navTarget = { home: 'home', players: 'players', 'player-profile': 'players', matches: 'matches', 'match-detail': 'matches', ranking: 'ranking' }[State.view];
      btn.classList.toggle('active', btn.dataset.nav === navTarget);
    });

    switch (State.view) {
      case 'home': UI.renderHome(); break;
      case 'players': UI.renderPlayers(); break;
      case 'player-profile': UI.renderPlayerProfile(); break;
      case 'matches': UI.renderMatches(); break;
      case 'match-detail': UI.renderMatchDetail(); break;
      case 'ranking': UI.renderRanking(); break;
      case 'settings': UI.renderSettings(); break;
      default: break;
    }
    UI.paintHeader();
  },
};

/* =============================================================
   MODULE: UI (renderização das telas)
   ============================================================= */
const UI = {

  /* ---------------- HEADER ---------------- */
  paintHeader() {
    const name = DB.data.leagueName;
    document.getElementById('league-name-label').textContent = name.toUpperCase();
    document.getElementById('btn-profile').textContent = Utils.initials(name).slice(0, 1);
    const heroSeason = document.getElementById('hero-season');
    if (heroSeason) {
      const month = new Date().toLocaleDateString('pt-BR', { month: 'long' });
      heroSeason.textContent = `${month.toUpperCase()} ${DB.data.currentSeason}`;
    }
  },

  /* ---------------- HOME ---------------- */
  renderHome() {
    const players = Players.all();
    const matches = Matches.all();
    const todayMatches = Stats.matchesForPeriod('hoje');
    const topScorer = Stats.ranking('pontos').slice(0, 1)[0];
    const topWinner = Stats.ranking('vitorias').slice(0, 1)[0];

    document.getElementById('home-today-summary').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${todayMatches.length}</div>
        <div class="stat-label">Partidas hoje</div>
        <div class="stat-caption ${todayMatches.length ? '' : 'muted'}">${todayMatches.length ? '↑ em atividade' : 'sem jogos hoje'}</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-value">${topScorer ? topScorer.value : 0}</div>
        <div class="stat-label">Cestinha geral</div>
        <div class="stat-caption ${topScorer ? '' : 'muted'}">${topScorer ? Utils.escapeHtml(topScorer.player.name) : 'sem dados'}</div>
      </div>`;

    document.getElementById('home-overall-summary').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${topWinner ? topWinner.value : 0}</div>
        <div class="stat-label">Mais vitórias</div>
        <div class="stat-caption ${topWinner ? '' : 'muted'}">${topWinner ? 'no histórico' : 'sem dados'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${players.length}</div>
        <div class="stat-label">Jogadores</div>
        <div class="stat-caption">ativos</div>
      </div>`;

    const top5 = Stats.ranking('pontos').slice(0, 5);
    document.getElementById('home-ranking').innerHTML = top5.length
      ? top5.map((r, i) => UI.rankRowHtml(r, i)).join('')
      : '<div class="empty-state">Registre partidas para ver o ranking.</div>';
    document.querySelectorAll('#home-ranking .list-row').forEach((row) => {
      row.onclick = () => Router.go('player-profile', { playerProfileId: row.dataset.id });
    });

    const recent = matches.slice(0, 5);
    document.getElementById('home-recent-matches').innerHTML = recent.length
      ? recent.map((m) => UI.matchCardHtml(m)).join('')
      : '<div class="empty-state">Nenhuma partida registrada ainda.</div>';
    document.querySelectorAll('#home-recent-matches .match-card').forEach((row) => {
      row.onclick = () => Router.go('match-detail', { matchDetailId: row.dataset.id });
    });
  },

  rankRowHtml(r, i) {
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `
      <div class="list-row" data-id="${r.player.id}">
        <div class="rank-pos ${posClass}">${i + 1}</div>
        <div class="avatar sm">${Utils.initials(r.player.name)}</div>
        <div class="row-main">
          <div class="row-title">${Utils.escapeHtml(r.player.name)}</div>
          <div class="row-sub">${r.stats.games} jogos · ${r.stats.wins}V ${r.stats.losses}D</div>
        </div>
        <div class="row-value">
          <div class="big">${r.value}</div>
          <div class="small">pts</div>
        </div>
      </div>`;
  },

  matchCardHtml(m) {
    const aWin = m.winner === 'A'; const bWin = m.winner === 'B';
    const winnerName = aWin ? m.teamA : (bWin ? m.teamB : null);
    const mvpName = m.mvpId ? (Players.byId(m.mvpId)?.name) : (m.mvpTie ? m.mvpTie.map((id) => Players.byId(id)?.name).filter(Boolean).join(' / ') : null);
    const isToday = Utils.isSameDay(m.date, Utils.todayISO());
    const dateLabel = isToday ? 'Hoje, agora' : Utils.formatDateShort(m.date);
    return `
      <div class="match-card" data-id="${m.id}">
        <div class="mc-date">${isToday ? '<span class="live-dot"></span>' : ''}${dateLabel} · ${m.format}</div>
        <div class="mc-line ${aWin ? 'win' : 'lose'}"><span>${Utils.escapeHtml(m.teamA)}</span><span class="mc-score">${m.scoreA}</span></div>
        <div class="mc-line ${bWin ? 'win' : 'lose'}"><span>${Utils.escapeHtml(m.teamB)}</span><span class="mc-score">${m.scoreB}</span></div>
        ${(winnerName || mvpName) ? `
        <div class="mc-footer">
          <span class="mc-win">${winnerName ? '🏆 ' + Utils.escapeHtml(winnerName) : 'Empate'}</span>
          <span class="mc-mvp">${mvpName ? '⭐ ' + Utils.escapeHtml(mvpName) : ''}</span>
        </div>` : ''}
      </div>`;
  },

  /* ---------------- PLAYERS ---------------- */
  renderPlayers() {
    const wrap = document.getElementById('players-list');
    const input = document.getElementById('player-search');
    input.value = State.playersSearch;
    input.oninput = (e) => { State.playersSearch = e.target.value; UI.paintPlayersList(); };
    UI.paintPlayersList();
  },

  paintPlayersList() {
    const wrap = document.getElementById('players-list');
    const list = Players.search(State.playersSearch);
    wrap.innerHTML = list.length ? list.map((p) => {
      const s = Stats.forPlayer(p.id);
      return `
        <div class="list-row" data-id="${p.id}">
          <div class="avatar">${Utils.initials(p.name)}</div>
          <div class="row-main">
            <div class="row-title">${Utils.escapeHtml(p.name)}</div>
            <div class="row-sub">${s.games} jogos · ${s.wins}V ${s.losses}D</div>
          </div>
          <div class="row-value">
            <div class="big">${s.avgPoints}</div>
            <div class="small">média pts</div>
          </div>
        </div>`;
    }).join('') : '<div class="empty-state">Nenhum jogador encontrado. Toque em "+ Novo" para cadastrar.</div>';
    wrap.querySelectorAll('.list-row').forEach((row) => {
      row.onclick = () => Router.go('player-profile', { playerProfileId: row.dataset.id });
    });
  },

  /* ---------------- PLAYER PROFILE ---------------- */
  renderPlayerProfile() {
    const p = Players.byId(State.playerProfileId);
    const content = document.getElementById('profile-content');
    if (!p) { content.innerHTML = '<div class="empty-state">Jogador não encontrado.</div>'; return; }
    const s = Stats.forPlayer(p.id);
    const badges = Badges.forPlayer(p.id);

    content.innerHTML = `
      <div class="profile-hero">
        <div class="avatar">${Utils.initials(p.name)}</div>
        <div class="name">${Utils.escapeHtml(p.name)}</div>
        <div class="since">Desde ${Utils.formatDateFull(p.createdAt)}</div>
        <div class="badge-row">
          ${badges.length ? badges.map((b) => `<span class="badge-pill">${b.icon} ${Utils.escapeHtml(b.label)}</span>`).join('') : '<span class="badge-pill">Sem conquistas ainda</span>'}
        </div>
        <button class="btn-chip" id="pp-edit" style="margin-top:14px;">Editar jogador</button>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s.games}</div><div class="stat-label">Jogos</div></div>
        <div class="stat-card"><div class="stat-value">${s.wins}V / ${s.losses}D</div><div class="stat-label">Vitórias/Derrotas</div></div>
        <div class="stat-card"><div class="stat-value">${s.points}</div><div class="stat-label">Pontos totais</div></div>
        <div class="stat-card"><div class="stat-value">${s.avgPoints}</div><div class="stat-label">Média de pontos</div></div>
        <div class="stat-card"><div class="stat-value">${s.assists}</div><div class="stat-label">Assistências</div></div>
        <div class="stat-card"><div class="stat-value">${s.threePoints}</div><div class="stat-label">Bolas de 3</div></div>
        <div class="stat-card gold"><div class="stat-value">${s.mvps}</div><div class="stat-label">MVPs</div></div>
        <div class="stat-card accent"><div class="stat-value">${s.efficiency}</div><div class="stat-label">Eficiência</div></div>
      </div>

      <div class="section-sub">Evolução (últimos jogos)</div>
      <div class="card sparkline-wrap">${UI.sparklineSvg(s.history)}</div>

      <div class="section-sub">Recordes</div>
      <div class="card">
        <div class="record-item"><span class="rlabel">Maior pontuação</span><span class="rvalue">${s.maxPoints} pts</span></div>
        <div class="record-item"><span class="rlabel">Maior nº de assistências</span><span class="rvalue">${s.maxAssists}</span></div>
        <div class="record-item"><span class="rlabel">Maior nº de bolas de 3</span><span class="rvalue">${s.maxThreePoints}</span></div>
        <div class="record-item"><span class="rlabel">Sequência atual</span><span class="rvalue">${s.currentStreak}</span></div>
        <div class="record-item"><span class="rlabel">Maior sequência de vitórias</span><span class="rvalue">${s.bestStreak}</span></div>
      </div>

      <div class="section-sub">Últimos jogos</div>
      <div class="card list-card" id="pp-history">
        ${s.history.length ? s.history.slice().reverse().slice(0, 10).map((h) => `
          <div class="list-row" data-id="${h.matchId}">
            <div class="row-main">
              <div class="row-title">${h.win ? 'Vitória' : 'Derrota'} · ${Utils.formatDateShort(h.date)}</div>
              <div class="row-sub">${h.points} pts · ${h.assists} ast · ${h.threePoints} 3pt</div>
            </div>
          </div>`).join('') : '<div class="empty-state">Nenhum jogo registrado.</div>'}
      </div>
    `;
    content.querySelectorAll('#pp-history .list-row').forEach((row) => {
      row.onclick = () => Router.go('match-detail', { matchDetailId: row.dataset.id });
    });
    document.getElementById('pp-edit').onclick = () => PlayerForm.open(p.id);
  },

  sparklineSvg(history) {
    const data = history.slice(-10);
    if (!data.length) return '<div class="empty-state">Sem dados suficientes.</div>';
    const w = 500; const h = 90; const pad = 10;
    const max = Math.max(...data.map((d) => d.points), 5);
    const stepX = (w - pad * 2) / Math.max(data.length - 1, 1);
    const pts = data.map((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (d.points / max) * (h - pad * 2);
      return `${x},${y}`;
    });
    const circles = data.map((d, i) => {
      const [x, y] = pts[i].split(',');
      return `<circle cx="${x}" cy="${y}" r="3" fill="${d.win ? '#22C55E' : '#EF4444'}" />`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">
      <polyline points="${pts.join(' ')}" fill="none" stroke="#FF7A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}
    </svg>`;
  },

  /* ---------------- MATCHES (HISTÓRICO) ---------------- */
  renderMatches() {
    const chipsWrap = document.getElementById('matches-season-filter');
    const seasons = DB.data.seasons.slice().sort((a, b) => b - a);
    chipsWrap.innerHTML = ['todas', ...seasons].map((s) => `
      <div class="filter-chip ${State.matchesSeasonFilter == s ? 'active' : ''}" data-s="${s}">${s === 'todas' ? 'Todas' : s}</div>
    `).join('');
    chipsWrap.querySelectorAll('.filter-chip').forEach((c) => {
      c.onclick = () => { State.matchesSeasonFilter = c.dataset.s === 'todas' ? 'todas' : Number(c.dataset.s); UI.paintMatchesList(); UI.renderMatches(); };
    });
    UI.paintMatchesList();
  },

  paintMatchesList() {
    const wrap = document.getElementById('matches-list');
    let list = Matches.all();
    if (State.matchesSeasonFilter !== 'todas') list = list.filter((m) => m.season === State.matchesSeasonFilter);
    wrap.innerHTML = list.length ? list.map((m) => UI.matchCardHtml(m)).join('') : '<div class="empty-state">Nenhuma partida nesta temporada.</div>';
    wrap.querySelectorAll('.match-card').forEach((row) => {
      row.onclick = () => Router.go('match-detail', { matchDetailId: row.dataset.id });
    });
  },

  /* ---------------- MATCH DETAIL ---------------- */
  renderMatchDetail() {
    const m = Matches.byId(State.matchDetailId);
    const content = document.getElementById('match-detail-content');
    if (!m) { content.innerHTML = '<div class="empty-state">Partida não encontrada.</div>'; return; }
    const mvp = m.mvpId ? Players.byId(m.mvpId) : null;
    const aWin = m.winner === 'A'; const bWin = m.winner === 'B';

    const tableFor = (ids) => `
      <table class="stat-table">
        <thead><tr><th>Jogador</th><th>PTS</th><th>3PT</th><th>AST</th></tr></thead>
        <tbody>
          ${ids.map((id) => {
            const p = Players.byId(id);
            const st = m.stats[id] || { points: 0, assists: 0, threePoints: 0 };
            return `<tr><td>${Utils.escapeHtml(p ? p.name : '?')}</td><td>${st.points}</td><td>${st.threePoints}</td><td>${st.assists}</td></tr>`;
          }).join('')}
        </tbody>
      </table>`;

    content.innerHTML = `
      <div style="text-align:center;">
        <div class="eyebrow">${m.winner === 'draw' ? 'PARTIDA FINALIZADA' : 'PARTIDA FINALIZADA'}</div>
        <p style="color:var(--text-dim);font-size:12.5px;margin:4px 0 14px;">${Utils.formatDateFull(m.date)} · ${m.format}</p>
      </div>

      <div class="score-preview">
        <div class="side ${aWin ? 'win' : ''}"><div class="tname">${Utils.escapeHtml(m.teamA)}</div><div class="tscore">${m.scoreA}</div></div>
        <div class="vs">VS</div>
        <div class="side ${bWin ? 'win' : ''}"><div class="tname">${Utils.escapeHtml(m.teamB)}</div><div class="tscore">${m.scoreB}</div></div>
      </div>

      ${m.winner !== 'draw' ? `<div class="winner-banner">🏆 ${Utils.escapeHtml(aWin ? m.teamA : m.teamB)} venceu</div>` : '<div class="winner-banner">🤝 Empate</div>'}

      ${mvp ? `<div class="mvp-banner"><div><div class="mtag">⭐ MVP DA PARTIDA</div><div class="mname">${Utils.escapeHtml(mvp.name)}</div></div></div>`
        : (m.mvpTie ? `<div class="mvp-banner"><div><div class="mtag">⭐ EMPATE DE MVP</div><div class="mname">${m.mvpTie.map((id) => Utils.escapeHtml(Players.byId(id)?.name || '?')).join(' / ')}</div></div></div>` : '')}

      <div class="section-sub">${Utils.escapeHtml(m.teamA)}</div>
      <div class="card">${tableFor(m.teamAIds)}</div>
      <div class="section-sub">${Utils.escapeHtml(m.teamB)}</div>
      <div class="card">${tableFor(m.teamBIds)}</div>

      <div class="field-row" style="margin-top:20px;">
        <button class="btn-secondary" id="md-edit" style="flex:1;">Editar</button>
        <button class="btn-secondary" id="md-duplicate" style="flex:1;">Duplicar</button>
      </div>
      <button class="btn-danger" id="md-delete" style="width:100%;margin-top:10px;">Excluir partida</button>
    `;
    document.getElementById('md-edit').onclick = () => MatchWizard.open(m.id);
    document.getElementById('md-duplicate').onclick = () => {
      const copy = Matches.duplicate(m.id);
      Toast.show('Partida duplicada');
      Router.go('match-detail', { matchDetailId: copy.id });
    };
    document.getElementById('md-delete').onclick = () => {
      Modal.confirm('Excluir partida', 'Esta ação removerá a partida e todas as estatísticas associadas a ela.', () => {
        Matches.remove(m.id);
        Toast.show('Partida excluída');
        Router.go('matches');
      }, 'Excluir');
    };
  },

  /* ---------------- RANKING ---------------- */
  renderRanking() {
    const periodChips = document.getElementById('ranking-period-filter');
    const periods = [['hoje', 'Hoje'], ['semana', 'Semana'], ['mes', 'Mês'], ['temporada', 'Temporada'], ['geral', 'Geral']];
    periodChips.innerHTML = periods.map(([k, label]) => `<div class="filter-chip ${State.rankingPeriod === k ? 'active' : ''}" data-p="${k}">${label}</div>`).join('');
    periodChips.querySelectorAll('.filter-chip').forEach((c) => { c.onclick = () => { State.rankingPeriod = c.dataset.p; UI.renderRanking(); }; });

    const typeChips = document.getElementById('ranking-type-filter');
    const types = [['pontos', 'Pontos'], ['assistencias', 'Assistências'], ['bolas3', 'Bolas de 3'], ['vitorias', 'Vitórias'], ['mvp', 'MVP'], ['eficiencia', 'Eficiência'], ['media', 'Média']];
    typeChips.innerHTML = types.map(([k, label]) => `<div class="filter-chip ${State.rankingType === k ? 'active' : ''}" data-t="${k}">${label}</div>`).join('');
    typeChips.querySelectorAll('.filter-chip').forEach((c) => { c.onclick = () => { State.rankingType = c.dataset.t; UI.renderRanking(); }; });

    const pool = Stats.matchesForPeriod(State.rankingPeriod, DB.data.currentSeason);
    const rank = Stats.ranking(State.rankingType, pool);
    const wrap = document.getElementById('ranking-list');
    wrap.innerHTML = rank.length ? rank.map((r, i) => UI.rankRowHtml(r, i)).join('') : '<div class="empty-state">Sem dados para este filtro.</div>';
    wrap.querySelectorAll('.list-row').forEach((row) => { row.onclick = () => Router.go('player-profile', { playerProfileId: row.dataset.id }); });
  },

  /* ---------------- SETTINGS ---------------- */
  renderSettings() {
    const input = document.getElementById('settings-league-name');
    input.value = DB.data.leagueName;
    input.onchange = () => {
      DB.data.leagueName = input.value.trim() || 'BRICKSCORE';
      DB.save();
      UI.paintHeader();
      Toast.show('Nome da liga atualizado');
    };
  },
};

/* =============================================================
   MODULE: Seasons (gerenciar temporadas)
   ============================================================= */
const SeasonManager = {
  open() {
    const seasons = DB.data.seasons.slice().sort((a, b) => b - a);
    Modal.open(`
      <div class="modal-header"><h2>Temporadas</h2><button class="modal-close" id="sm-close">✕</button></div>
      <div class="modal-body">
        <div class="card list-card" id="sm-list">
          ${seasons.map((y) => `
            <div class="list-row" data-y="${y}">
              <div class="row-main"><div class="row-title">Temporada ${y}</div>
                <div class="row-sub">${Matches.bySeason(y).length} partidas</div></div>
              ${y === DB.data.currentSeason ? '<span class="badge-pill">Atual</span>' : '<button class="btn-chip" data-select="' + y + '">Usar</button>'}
            </div>`).join('')}
        </div>
        <button class="btn-secondary" id="sm-add" style="width:100%;margin-top:14px;">+ Adicionar próxima temporada</button>
      </div>`);
    document.getElementById('sm-close').onclick = Modal.close;
    document.getElementById('sm-add').onclick = () => {
      const next = Math.max(...DB.data.seasons) + 1;
      if (!DB.data.seasons.includes(next)) DB.data.seasons.push(next);
      DB.data.currentSeason = next;
      DB.save();
      Toast.show(`Temporada ${next} criada`);
      SeasonManager.open();
      Router.render();
    };
    document.querySelectorAll('[data-select]').forEach((btn) => {
      btn.onclick = () => {
        DB.data.currentSeason = Number(btn.dataset.select);
        DB.save();
        SeasonManager.open();
        Router.render();
      };
    });
  },
};

/* =============================================================
   MODULE: DataTransfer (backup / restauração / reset)
   ============================================================= */
const DataTransfer = {
  export() {
    const blob = new Blob([JSON.stringify(DB.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brickscore-backup-${Utils.todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Toast.show('Backup exportado');
  },
  import(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.players || !parsed.matches) throw new Error('Formato inválido');
        DB.replace(parsed);
        Router.render();
        Toast.show('Dados importados com sucesso');
      } catch (e) {
        Toast.show('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  },
};

/* =============================================================
   INIT / EVENTOS GLOBAIS
   ============================================================= */
async function initApp() {
 
  await DB.load();
  await Players.load(); 
 
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => Router.go(el.dataset.nav));
  });

  document.getElementById('btn-open-register').onclick = () => MatchWizard.open();
  document.getElementById('btn-open-register-2').onclick = () => MatchWizard.open();
  document.getElementById('btn-add-player').onclick = () => PlayerForm.open();
  document.getElementById('btn-profile').onclick = () => Router.go('settings');
  document.getElementById('btn-manage-seasons').onclick = () => SeasonManager.open();
  document.getElementById('btn-export').onclick = () => DataTransfer.export();
  document.getElementById('btn-import').onclick = () => document.getElementById('import-file').click();
  document.getElementById('import-file').onchange = (e) => {
    if (e.target.files[0]) DataTransfer.import(e.target.files[0]);
    e.target.value = '';
  };
  document.getElementById('btn-reset').onclick = () => {
    Modal.confirm('Apagar todos os dados', 'Esta ação é irreversível e removerá todos os jogadores e partidas deste dispositivo.', () => {
      DB.reset();
      Router.go('home');
      Toast.show('Dados apagados');
    }, 'Apagar tudo');
  };

  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') { /* clique fora não fecha durante fluxo de registro para evitar perda acidental */ }
  });

  Router.render();
}

document.addEventListener('DOMContentLoaded', initApp);
