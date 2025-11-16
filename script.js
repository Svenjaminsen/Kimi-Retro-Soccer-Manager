// Game State
const BUDGET = 40000000;
const API_KEY = '7266c4b0ce28a9f7a8fe69458805f0be';
const API_BASE = 'https://v3.football.api-sports.io';

let gameState = {
    currentScreen: 'signin',
    username: '',
    squad: [],
    availablePlayers: [],
    selectedPosition: 'GK',
    loading: false,
    apiStatus: '',
    apiWorking: null,
    matchResult: null
};

const positions = ['GK', 'DEF', 'MID', 'FWD'];
const positionLimits = { GK: 1, DEF: 1, MID: 2, FWD: 1 };

// Utility Functions
function alterName(name) {
    const vowels = { a: 'e', e: 'i', i: 'o', o: 'u', u: 'a', A: 'E', E: 'I', I: 'O', O: 'U', U: 'A' };
    return name.split('').map((char, i) => i % 3 === 0 && vowels[char] ? vowels[char] : char).join('');
}

function formatMoney(value) {
    return `$${(value / 1000000).toFixed(1)}M`;
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Player Statistics Calculation
function calculateOffenseDefense(playerData, position) {
    const { goals = 0, assists = 0, rating = 6.5, tackles = 0, interceptions = 0, passes = 0 } = playerData;
    
    let offense = 0;
    let defense = 0;

    if (position === 'GK') {
        defense = Math.round(rating * 12 + (tackles || 0) * 3);
        offense = Math.round(rating * 2 + passes * 0.01);
    } else if (position === 'DEF') {
        defense = Math.round((tackles * 4 + interceptions * 5 + rating * 6));
        offense = Math.round((goals * 10 + assists * 6 + rating * 3));
    } else if (position === 'MID') {
        offense = Math.round((goals * 10 + assists * 8 + rating * 7 + passes * 0.02));
        defense = Math.round((tackles * 3 + interceptions * 4 + rating * 4));
    } else { // FWD
        offense = Math.round((goals * 15 + assists * 7 + rating * 9));
        defense = Math.round((tackles * 2 + rating * 2));
    }

    return {
        offense: Math.max(40, Math.min(99, offense)),
        defense: Math.max(35, Math.min(99, defense))
    };
}

function calculateMarketValue(stats) {
    const { goals = 0, assists = 0, rating = 6.5 } = stats;
    const performanceScore = (goals * 800000 + assists * 400000 + rating * 400000);
    return Math.max(1000000, Math.min(10000000, Math.round(performanceScore)));
}

// Mock Player Generation
function generateMockPlayers() {
    const mockData = [
        // Goalkeepers
        { name: 'Merk ter Stigen', pos: 'GK', team: 'Borcelone', goals: 0, assists: 0, rating: 7.2, tackles: 0, inter: 0, passes: 350 },
        { name: 'Ellisin', pos: 'GK', team: 'Munchester Coty', goals: 0, assists: 1, rating: 7.4, tackles: 0, inter: 0, passes: 420 },
        { name: 'Cortuis', pos: 'GK', team: 'Riel Medrad', goals: 0, assists: 0, rating: 7.1, tackles: 0, inter: 0, passes: 380 },
        { name: 'Nauer', pos: 'GK', team: 'Boyern Munoch', goals: 0, assists: 0, rating: 7.3, tackles: 0, inter: 0, passes: 400 },
        
        // Defenders
        { name: 'Virgol von Doke', pos: 'DEF', team: 'Loverpool', goals: 2, assists: 3, rating: 7.5, tackles: 85, inter: 45, passes: 1200 },
        { name: 'Rudogor', pos: 'DEF', team: 'Riel Medrad', goals: 1, assists: 2, rating: 7.3, tackles: 78, inter: 42, passes: 980 },
        { name: 'Diis', pos: 'DEF', team: 'Munchester Coty', goals: 3, assists: 1, rating: 7.4, tackles: 92, inter: 48, passes: 1100 },
        { name: 'De Logt', pos: 'DEF', team: 'Boyern Munoch', goals: 2, assists: 4, rating: 7.6, tackles: 88, inter: 50, passes: 1050 },
        
        // Midfielders
        { name: 'Kivin di Bryne', pos: 'MID', team: 'Munchester Coty', goals: 12, assists: 15, rating: 8.2, tackles: 42, inter: 28, passes: 2200 },
        { name: 'Belloghom', pos: 'MID', team: 'Riel Medrad', goals: 14, assists: 12, rating: 8.1, tackles: 45, inter: 30, passes: 2100 },
        { name: 'Bruni', pos: 'MID', team: 'Munchester Unotid', goals: 8, assists: 14, rating: 7.8, tackles: 52, inter: 32, passes: 1900 },
        { name: 'Rodro', pos: 'MID', team: 'Munchester Coty', goals: 6, assists: 9, rating: 7.6, tackles: 58, inter: 35, passes: 2300 },
        { name: 'Modrok', pos: 'MID', team: 'Riel Medrad', goals: 5, assists: 11, rating: 7.7, tackles: 48, inter: 28, passes: 2000 },
        { name: 'Gevi', pos: 'MID', team: 'Borcelone', goals: 7, assists: 10, rating: 7.5, tackles: 44, inter: 26, passes: 1850 },
        { name: 'Pilippani', pos: 'MID', team: 'Loverpool', goals: 9, assists: 7, rating: 7.4, tackles: 40, inter: 24, passes: 1600 },
        { name: 'Seke', pos: 'MID', team: 'Ersenel', goals: 11, assists: 9, rating: 7.9, tackles: 35, inter: 22, passes: 1500 },
        
        // Forwards
        { name: 'Hurry Keni', pos: 'FWD', team: 'Boyern Munoch', goals: 28, assists: 8, rating: 8.3, tackles: 12, inter: 8, passes: 800 },
        { name: 'Mohemid Seleh', pos: 'FWD', team: 'Loverpool', goals: 24, assists: 12, rating: 8.1, tackles: 15, inter: 6, passes: 750 },
        { name: 'Erlong Hueland', pos: 'FWD', team: 'Munchester Coty', goals: 26, assists: 6, rating: 8.2, tackles: 10, inter: 5, passes: 700 },
        { name: 'Mbeppi', pos: 'FWD', team: 'Peris SG', goals: 30, assists: 10, rating: 8.5, tackles: 8, inter: 4, passes: 850 },
        { name: 'Vonecius', pos: 'FWD', team: 'Riel Medrad', goals: 22, assists: 9, rating: 8.0, tackles: 14, inter: 7, passes: 720 },
        { name: 'Luwondawske', pos: 'FWD', team: 'Borcelone', goals: 20, assists: 11, rating: 7.9, tackles: 16, inter: 9, passes: 780 },
        { name: 'Darwon', pos: 'FWD', team: 'Nowcistle', goals: 18, assists: 7, rating: 7.7, tackles: 18, inter: 10, passes: 650 },
    ];

    return mockData.map((p, i) => {
        const playerStats = {
            goals: p.goals,
            assists: p.assists,
            rating: p.rating,
            tackles: p.tackles,
            interceptions: p.inter,
            passes: p.passes
        };

        const { offense, defense } = calculateOffenseDefense(playerStats, p.pos);

        return {
            id: `mock-${i}`,
            name: p.name,
            position: p.pos,
            team: p.team,
            ...playerStats,
            marketValue: calculateMarketValue(playerStats),
            offense,
            defense,
            available: true,
            color: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'][i % 4]
        };
    });
}

// API Functions
async function testApiConnection() {
    try {
        const response = await fetch(`${API_BASE}/status`, {
            headers: { 'x-apisports-key': API_KEY }
        });
        const data = await response.json();
        
        if (data.response) {
            return {
                working: true,
                status: `API Connected! Requests: ${data.response.requests.current}/${data.response.requests.limit_day}`
            };
        }
        return { working: false, status: 'API Error - Using Mock Data' };
    } catch (error) {
        return { working: false, status: 'API Error - Using Mock Data' };
    }
}

async function fetchFromApiFootball() {
    const leagues = [
        { id: 39, name: 'Premier League' },
        { id: 140, name: 'La Liga' },
        { id: 78, name: 'Bundesliga' }
    ];
    const season = 2024;
    let allPlayers = [];

    for (const league of leagues) {
        try {
            updateApiStatus(`Fetching ${league.name}...`);
            
            const response = await fetch(
                `${API_BASE}/players?league=${league.id}&season=${season}&page=1`,
                { headers: { 'x-apisports-key': API_KEY } }
            );
            
            const data = await response.json();
            
            if (!data.response || data.response.length === 0) {
                console.log(`No data for ${league.name}`);
                continue;
            }

            const players = data.response.slice(0, 25).map((p, idx) => {
                const stats = p.statistics[0];
                if (!stats) return null;

                const position = stats.games.position === 'Goalkeeper' ? 'GK' : 
                               stats.games.position === 'Defender' ? 'DEF' :
                               stats.games.position === 'Midfielder' ? 'MID' : 'FWD';

                const playerStats = {
                    goals: stats.goals?.total || 0,
                    assists: stats.goals?.assists || 0,
                    rating: parseFloat(stats.games?.rating || '6.5'),
                    tackles: stats.tackles?.total || 0,
                    interceptions: stats.tackles?.interceptions || 0,
                    passes: stats.passes?.total || 0
                };

                const { offense, defense } = calculateOffenseDefense(playerStats, position);

                return {
                    id: `api-${league.id}-${p.player.id}`,
                    name: alterName(p.player.name),
                    position,
                    team: stats.team.name,
                    ...playerStats,
                    marketValue: calculateMarketValue(playerStats),
                    offense,
                    defense,
                    available: true,
                    color: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'][idx % 4]
                };
            }).filter(p => p !== null);

            allPlayers = [...allPlayers, ...players];
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error fetching ${league.name}:`, error);
        }
    }

    return allPlayers;
}

// Game Logic Functions
async function fetchPlayers(forceRefresh = false) {
    if (gameState.availablePlayers.length > 0 && !forceRefresh) return;

    gameState.loading = true;
    updateLoadingState();

    // Test API first
    const apiTest = await testApiConnection();
    gameState.apiWorking = apiTest.working;
    updateApiStatus(apiTest.status);

    let players = [];

    if (apiTest.working) {
        players = await fetchFromApiFootball();
    }

    if (players.length === 0) {
        players = generateMockPlayers();
        updateApiStatus('Using Mock Player Data');
    } else {
        updateApiStatus(`Loaded ${players.length} players from API!`);
    }

    gameState.availablePlayers = players;
    gameState.loading = false;
    updateLoadingState();
    renderPlayersList();
}

function addPlayer(player) {
    const posCount = gameState.squad.filter(p => p.position === player.position).length;
    if (posCount >= positionLimits[player.position]) {
        showAlert(`Max ${positionLimits[player.position]} ${player.position} allowed!`);
        return;
    }
    if (getSquadValue() + player.marketValue > BUDGET) {
        showAlert('Over budget!');
        return;
    }
    if (gameState.squad.length >= 5) {
        showAlert('Squad full!');
        return;
    }

    gameState.squad.push(player);
    gameState.availablePlayers = gameState.availablePlayers.map(p => 
        p.id === player.id ? { ...p, available: false } : p
    );
    
    updateSquadDisplay();
    renderPlayersList();
}

function removePlayer(playerId) {
    gameState.squad = gameState.squad.filter(p => p.id !== playerId);
    gameState.availablePlayers = gameState.availablePlayers.map(p => 
        p.id === playerId ? { ...p, available: true } : p
    );
    
    updateSquadDisplay();
    renderPlayersList();
}

function getSquadValue() {
    return gameState.squad.reduce((sum, p) => sum + p.marketValue, 0);
}

function calculateTeamStats(team) {
    return {
        offense: team.reduce((sum, p) => sum + p.offense, 0),
        defense: team.reduce((sum, p) => sum + p.defense, 0)
    };
}

function generateComputerTeam(difficulty = 'medium') {
    const available = gameState.availablePlayers.filter(p => p.available);
    const team = [];
    const multiplier = difficulty === 'easy' ? 0.75 : difficulty === 'medium' ? 1.0 : 1.25;

    ['GK', 'DEF', 'MID', 'MID', 'FWD'].forEach(pos => {
        const posPlayers = available.filter(p => p.position === pos && !team.find(t => t.id === p.id));
        if (posPlayers.length > 0) {
            const index = difficulty === 'easy' ? 
                Math.floor(Math.random() * Math.min(posPlayers.length, 10)) :
                difficulty === 'hard' ? 
                Math.floor(Math.random() * Math.min(posPlayers.length, 3)) :
                Math.floor(Math.random() * Math.min(posPlayers.length, 6));
            
            const player = posPlayers[index];
            team.push({
                ...player,
                offense: Math.round(player.offense * multiplier),
                defense: Math.round(player.defense * multiplier)
            });
        }
    });
    return team;
}

function simulateMatch(opponentTeam) {
    const myStats = calculateTeamStats(gameState.squad);
    const oppStats = calculateTeamStats(opponentTeam);

    const myAttack = myStats.offense / (oppStats.defense + 50);
    const oppAttack = oppStats.offense / (myStats.defense + 50);

    const myGoals = Math.max(0, Math.round(myAttack * 2 + Math.random() * 2.5));
    const oppGoals = Math.max(0, Math.round(oppAttack * 2 + Math.random() * 2.5));

    return { myGoals, oppGoals };
}

// UI Functions
function showAlert(message) {
    // Create a simple alert modal
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border-4 border-red-600 p-6 z-50 text-center';
    alertDiv.innerHTML = `
        <p class="text-red-400 mb-4 text-xs">${message}</p>
        <button onclick="this.parentElement.remove()" class="bg-red-600 text-white px-4 py-2 border-2 border-red-800 hover:bg-red-500 text-xs">OK</button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 3000);
}

function updateSquadDisplay() {
    const squadValue = getSquadValue();
    const remainingBudget = BUDGET - squadValue;
    
    document.getElementById('squad-count').textContent = gameState.squad.length;
    document.getElementById('squad-value-display').textContent = formatMoney(squadValue);
    document.getElementById('remaining-budget-display').textContent = formatMoney(remainingBudget);
    
    const squadList = document.getElementById('squad-list');
    if (gameState.squad.length === 0) {
        squadList.innerHTML = '<p class="text-center py-8 text-xs">NO PLAYERS<br/><br/>TAP TEAM ICON<br/>TO SELECT</p>';
    } else {
        squadList.innerHTML = gameState.squad.map(player => `
            <div class="bg-black border-2 border-green-400 p-3 mb-2">
                <div class="flex items-center gap-3 mb-2">
                    <svg width="48" height="48" viewBox="0 0 12 12" style="image-rendering: pixelated;">
                        <rect x="4" y="2" width="4" height="2" fill="#8B4513"/>
                        <rect x="3" y="4" width="6" height="3" fill="#FFD4A3"/>
                        <rect x="4" y="5" width="1" height="1" fill="#000"/>
                        <rect x="7" y="5" width="1" height="1" fill="#000"/>
                        <rect x="2" y="7" width="8" height="3" fill="${player.color}"/>
                        <rect x="1" y="8" width="2" height="2" fill="#FFD4A3"/>
                        <rect x="9" y="8" width="2" height="2" fill="#FFD4A3"/>
                        <rect x="3" y="10" width="2" height="2" fill="#1E3A8A"/>
                        <rect x="7" y="10" width="2" height="2" fill="#1E3A8A"/>
                    </svg>
                    <div class="flex-1">
                        <p class="text-yellow-400 mb-1 text-xs">${player.name}</p>
                        <p class="text-xs mb-1">${player.position} | ${player.team}</p>
                        <p class="text-xs mb-1">OFF:${player.offense} DEF:${player.defense}</p>
                        <p class="text-xs text-yellow-400">${formatMoney(player.marketValue)}</p>
                    </div>
                </div>
                <button
                    onclick="removePlayer('${player.id}')"
                    class="bg-red-600 text-white px-3 py-1 text-xs w-full border-2 border-red-800 hover:bg-red-500"
                >
                    REMOVE
                </button>
            </div>
        `).join('');
    }
}

function renderPlayersList() {
    const playersList = document.getElementById('players-list');
    const filteredPlayers = gameState.availablePlayers.filter(p => 
        p.position === gameState.selectedPosition && p.available
    ).slice(0, 30);

    if (filteredPlayers.length === 0) {
        playersList.innerHTML = '<p class="text-center py-8 text-xs">NO PLAYERS AVAILABLE</p>';
        return;
    }

    playersList.innerHTML = filteredPlayers.map(player => `
        <div class="bg-gray-900 border-2 border-green-400 p-3">
            <div class="flex items-center gap-3 mb-2">
                <svg width="48" height="48" viewBox="0 0 12 12" style="image-rendering: pixelated;">
                    <rect x="4" y="2" width="4" height="2" fill="#8B4513"/>
                    <rect x="3" y="4" width="6" height="3" fill="#FFD4A3"/>
                    <rect x="4" y="5" width="1" height="1" fill="#000"/>
                    <rect x="7" y="5" width="1" height="1" fill="#000"/>
                    <rect x="2" y="7" width="8" height="3" fill="${player.color}"/>
                    <rect x="1" y="8" width="2" height="2" fill="#FFD4A3"/>
                    <rect x="9" y="8" width="2" height="2" fill="#FFD4A3"/>
                    <rect x="3" y="10" width="2" height="2" fill="#1E3A8A"/>
                    <rect x="7" y="10" width="2" height="2" fill="#1E3A8A"/>
                </svg>
                <div class="flex-1">
                    <p class="text-yellow-400 mb-1 text-xs">${player.name}</p>
                    <p class="text-xs mb-1">${player.team}</p>
                    <p class="text-xs mb-1">G:${player.goals} A:${player.assists} R:${player.rating.toFixed(1)}</p>
                    <p class="text-xs mb-1">OFF:${player.offense} DEF:${player.defense}</p>
                    <p class="text-xs text-yellow-400">${formatMoney(player.marketValue)}</p>
                </div>
            </div>
            <button
                onclick="addPlayer(gameState.availablePlayers.find(p => p.id === '${player.id}'))"
                class="bg-green-400 text-black px-3 py-1 text-xs w-full border-2 border-green-600 hover:bg-green-300"
            >
                ADD TO SQUAD
            </button>
        </div>
    `).join('');
}

function updateLoadingState() {
    const loadingDiv = document.getElementById('loading-players');
    const refreshIcon = document.getElementById('refresh-icon');
    
    if (gameState.loading) {
        loadingDiv.classList.remove('hidden');
        refreshIcon.classList.add('fa-spin');
    } else {
        loadingDiv.classList.add('hidden');
        refreshIcon.classList.remove('fa-spin');
    }
}

function updateApiStatus(status) {
    const apiStatusDiv = document.getElementById('api-status');
    const apiStatusText = document.getElementById('api-status-text');
    
    gameState.apiStatus = status;
    apiStatusText.textContent = status;
    
    if (gameState.apiWorking === true) {
        apiStatusDiv.className = 'p-3 border-2 mb-4 border-green-400 bg-gray-900 text-center';
    } else if (gameState.apiWorking === false) {
        apiStatusDiv.className = 'p-3 border-2 mb-4 border-yellow-400 bg-gray-900 text-center';
    }
    
    apiStatusDiv.classList.remove('hidden');
}

function switchScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('[id$="-screen"]').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show selected screen
    if (screenName === 'signin') {
        document.getElementById('signin-screen').classList.remove('hidden');
    } else {
        document.getElementById('main-screen').classList.remove('hidden');
        document.getElementById(`${screenName}-screen`).classList.remove('hidden');
    }
    
    gameState.currentScreen = screenName;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-yellow-400');
        btn.classList.add('text-green-400');
    });
    
    const activeNavBtn = document.querySelector(`[data-screen="${screenName}"]`);
    if (activeNavBtn) {
        activeNavBtn.classList.remove('text-green-400');
        activeNavBtn.classList.add('text-yellow-400');
    }
    
    // Screen-specific logic
    if (screenName === 'select' && gameState.availablePlayers.length === 0) {
        fetchPlayers();
    }
    
    if (screenName === 'match') {
        updateMatchScreen();
    }
}

function updateMatchScreen() {
    const hasEnoughPlayers = gameState.squad.length >= 5;
    
    document.getElementById('match-setup').classList.toggle('hidden', !hasEnoughPlayers);
    document.getElementById('insufficient-players').classList.toggle('hidden', hasEnoughPlayers);
    document.getElementById('match-result').classList.add('hidden');
    
    if (hasEnoughPlayers) {
        const teamStats = calculateTeamStats(gameState.squad);
        document.getElementById('team-offense').textContent = teamStats.offense;
        document.getElementById('team-defense').textContent = teamStats.defense;
        
        // Generate opponent options
        const opponents = [
            { name: 'CPU Easy', difficulty: 'EASY', multiplier: 0.75 },
            { name: 'CPU Medium', difficulty: 'MEDIUM', multiplier: 1.0 },
            { name: 'CPU Hard', difficulty: 'HARD', multiplier: 1.25 }
        ];
        
        const opponentOptions = document.getElementById('opponent-options');
        opponentOptions.innerHTML = opponents.map((opponent, i) => {
            const team = generateComputerTeam(opponent.difficulty.toLowerCase());
            const stats = calculateTeamStats(team);
            
            return `
                <div class="bg-gray-900 border-2 border-green-400 p-4">
                    <p class="text-yellow-400 mb-2 text-xs">${opponent.name}</p>
                    <p class="text-xs mb-1">DIFFICULTY: ${opponent.difficulty}</p>
                    <p class="text-xs mb-3">
                        OFF: ${stats.offense} | DEF: ${stats.defense}
                    </p>
                    <button
                        onclick="startMatch('${opponent.name}', ${opponent.multiplier})"
                        class="bg-green-400 text-black px-4 py-2 border-2 border-green-600 w-full hover:bg-green-300 text-xs"
                    >
                        PLAY MATCH
                    </button>
                </div>
            `;
        }).join('');
    }
}

function startMatch(opponentName, multiplier) {
    const opponentTeam = generateComputerTeam(opponentName.toLowerCase().includes('easy') ? 'easy' : 
                         opponentName.toLowerCase().includes('hard') ? 'hard' : 'medium');
    
    const result = simulateMatch(opponentTeam);
    
    gameState.matchResult = {
        opponent: opponentName,
        myGoals: result.myGoals,
        oppGoals: result.oppGoals,
        result: result.myGoals > result.oppGoals ? 'WIN' : result.myGoals < result.oppGoals ? 'LOSS' : 'DRAW'
    };
    
    // Show match result
    document.getElementById('match-setup').classList.add('hidden');
    document.getElementById('match-result').classList.remove('hidden');
    
    document.getElementById('my-goals').textContent = result.myGoals;
    document.getElementById('opp-goals').textContent = result.oppGoals;
    document.getElementById('opponent-name').textContent = opponentName;
    
    const resultText = document.getElementById('match-result-text');
    resultText.textContent = gameState.matchResult.result + '!';
    resultText.className = `text-xl mb-2 ${
        gameState.matchResult.result === 'WIN' ? 'text-green-400' : 
        gameState.matchResult.result === 'LOSS' ? 'text-red-400' : 'text-yellow-400'
    }`;
    
    // Add flash effect
    document.getElementById('match-result').classList.add('match-flash');
    setTimeout(() => {
        document.getElementById('match-result').classList.remove('match-flash');
    }, 500);
}

function updateLeaderboard() {
    const myStats = calculateTeamStats(gameState.squad);
    const myValue = getSquadValue();
    
    const leaderboardData = [
        { name: gameState.username, value: myValue, offense: myStats.offense, defense: myStats.defense, isPlayer: true },
        { name: 'CPU BOSS', value: 35200000, offense: 285, defense: 295 },
        { name: 'AI MONEGIR', value: 32800000, offense: 268, defense: 280 },
        { name: 'COMPUTIR', value: 29500000, offense: 245, defense: 260 },
        { name: 'PIXIL BOT', value: 26300000, offense: 230, defense: 242 }
    ];
    
    // Sort by value (descending)
    leaderboardData.sort((a, b) => b.value - a.value);
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = leaderboardData.map((entry, index) => `
        <div class="bg-black border-2 ${entry.isPlayer ? 'border-yellow-400' : 'border-green-400'} p-3">
            <p class="${entry.isPlayer ? 'text-yellow-400' : 'text-green-400'} mb-1 text-xs">${index + 1}. ${entry.name}</p>
            <p class="text-xs mb-1">Value: ${formatMoney(entry.value)}</p>
            <p class="text-xs">OFF:${entry.offense} DEF:${entry.defense}</p>
        </div>
    `).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Sign in screen
    const usernameInput = document.getElementById('username-input');
    const startGameBtn = document.getElementById('start-game-btn');
    
    usernameInput.addEventListener('input', function() {
        startGameBtn.disabled = !this.value.trim();
    });
    
    startGameBtn.addEventListener('click', function() {
        if (usernameInput.value.trim()) {
            gameState.username = usernameInput.value.trim();
            document.getElementById('manager-name').textContent = gameState.username;
            switchScreen('home');
        }
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screen = this.getAttribute('data-screen');
            switchScreen(screen);
        });
    });
    
    // Position tabs
    document.querySelectorAll('.position-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const position = this.getAttribute('data-position');
            gameState.selectedPosition = position;
            
            // Update tab styles
            document.querySelectorAll('.position-tab').forEach(t => {
                t.className = 'position-tab px-4 py-2 border-2 bg-gray-900 border-green-400';
            });
            this.className = 'position-tab px-4 py-2 border-2 bg-green-400 text-black border-green-600';
            
            renderPlayersList();
        });
    });
    
    // Refresh players button
    document.getElementById('refresh-players-btn').addEventListener('click', function() {
        if (!gameState.loading) {
            fetchPlayers(true);
        }
    });
    
    // Match screen buttons
    document.getElementById('select-players-btn').addEventListener('click', function() {
        switchScreen('select');
    });
    
    document.getElementById('play-again-btn').addEventListener('click', function() {
        gameState.matchResult = null;
        updateMatchScreen();
    });
    
    // Initialize game
    updateSquadDisplay();
});