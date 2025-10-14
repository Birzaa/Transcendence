import { navigate } from "../main.js";
import { fetchData } from "../tools/fetchData.js";
import { elo } from "../tools/elo.js";
import { updateUI, t } from "../utils/i18n.js";
export async function renderPerformances() {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.status === 401)
        return navigate('/auth');
    const me = await res.json();
    const stats = await fetch('/api/myStats', { credentials: 'include' }).then(r => r.json());
    const games = await fetchData('gamesHistory', me.id);
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
    <div class="mt-[128px] min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <div class="min-h-screen flex items-center justify-center">
        <div class="w-full max-w-5xl bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300 p-8 rounded-xl">
          <div class="bg-purple-600 text-pink-100 p-3 rounded-t-md mb-6 shadow-md">
            <h1 class="text-2xl md:text-3xl font-bold text-center" data-i18n="Performance_Title">📈 Mes performances</h1>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-md shadow">
              <h2 class="text-xl font-semibold text-purple-700 mb-4" data-i18n="Performance_GeneralStats">Statistiques générales</h2>
              <ul class="text-purple-900 space-y-1 text-lg">
                <li><span data-i18n="Performance_GamesPlayed">Parties jouées</span> : <strong>${stats.total}</strong></li>
                <li><span data-i18n="Performance_Wins">Victoires</span> : <strong>${stats.wins}</strong></li>
                <li><span data-i18n="Performance_Losses">Défaites</span> : <strong>${stats.losses}</strong></li>
                <li><span data-i18n="Performance_Draws">Égalités</span> : <strong>${stats.draws}</strong></li>
                <li><span data-i18n="Performance_WinRate">Taux de victoire</span> : <strong>${stats.winrate}%</strong></li>
              </ul>
            </div>

            <div class="bg-white p-6 rounded-md shadow">
              <h2 class="text-xl font-semibold text-purple-700 mb-4" data-i18n="Performance_ResultsDistribution">Répartition des résultats</h2>
              <canvas id="pieChart" class="w-full h-60"></canvas>
            </div>
          </div>

          <div class="mt-8 bg-white p-6 rounded-md shadow">
            <h2 class="text-xl font-semibold text-purple-700 mb-4" data-i18n="Performance_EloEvolution">Évolution des performances (Elo)</h2>
            <canvas id="eloChart" class="w-full h-72"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
    updateUI();
    // Pie chart des résultats
    new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: [t('Performance_Wins'), t('Performance_Losses'), t('Performance_Draws')],
            datasets: [{
                    data: [stats.wins, stats.losses, stats.draws],
                    backgroundColor: ['#68D391', '#FC8181', '#F6AD55']
                }]
        }
    });
    // Calcul de l'historique Elo avec ta fonction
    const eloHistory = elo(me.id, games);
    // Graphique ligne évolution Elo
    new Chart(document.getElementById('eloChart'), {
        type: 'line',
        data: {
            labels: eloHistory.map(e => new Date(e.date).toLocaleDateString()),
            datasets: [{
                    label: t('Performance_EloScore'),
                    data: eloHistory.map(e => e.elo),
                    borderColor: '#6B46C1',
                    backgroundColor: '#E9D8FD',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: t('Performance_EloScore')
                    }
                }
            }
        }
    });
}
