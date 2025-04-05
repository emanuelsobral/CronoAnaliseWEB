let activities = JSON.parse(localStorage.getItem('activities')) || [];
let tableData = JSON.parse(localStorage.getItem('tableData')) || [];
let currentActivity = null; //Gambiarra
let currentActivityIndex = -1; //Não é utilizado, mas tenho medo de tirar

let appConfig = JSON.parse(localStorage.getItem('appConfig')) || {
    analysisName: '',
    analyst: '',
    bank: '',
    segment: '',
    interviewee: ''
};

const requiredFields = ['analyst', 'bank', 'segment', 'interviewee'];
requiredFields.forEach(field => {
    document.getElementById(field).addEventListener('input', checkRequiredFields);
});

const fieldTranslations = {
    'analyst': 'Analista',
    'bank': 'Banco/Setor',
    'segment': 'Segmento',
    'interviewee': 'Entrevistado'
};

// Funções básicas de persistência
function saveActivities() {
    localStorage.setItem('activities', JSON.stringify(activities));
    loadActivities();
}

function saveTable() {
    localStorage.setItem('tableData', JSON.stringify(tableData));
    loadTable();
    updateMetrics();
}

function saveAppConfig() {
    localStorage.setItem('appConfig', JSON.stringify(appConfig));
    
    // Atualizar indicadores visuais
    const fields = document.querySelectorAll('.config-field');
    fields.forEach(field => {
        const input = field.querySelector('input');
        field.classList.toggle('filled', input.value.trim() !== '');
    });
}

    // Atualize o event listener do DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Carregar configurações
    document.getElementById('analysisName').value = appConfig.analysisName;
    document.getElementById('analyst').value = appConfig.analyst;
    document.getElementById('bank').value = appConfig.bank;
    document.getElementById('segment').value = appConfig.segment;
    document.getElementById('interviewee').value = appConfig.interviewee;

    // Adicionar listeners para salvar automaticamente
    const configFields = [
        'analysisName', 'analyst', 'bank', 'segment', 'interviewee'
    ];

    configFields.forEach(field => {
        document.getElementById(field).addEventListener('input', (e) => {
            appConfig[field] = e.target.value;
            saveAppConfig();
            updateExportButtonState()
            checkRequiredFields();
        });
    });
});

function updateFilledStatus() {
    document.querySelectorAll('.input-group .config-input, .input-container input').forEach(input => {
        const parent = input.closest('.input-group') ? input.closest('.config-label') : input.closest('.input-container');
        if (input.value.trim() !== '') {
            parent.classList.add('filled');
        } else {
            parent.classList.remove('filled');
        }
    });
}

// Adicione event listeners para todos os inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateFilledStatus);
});

// Execute na inicialização
document.addEventListener('DOMContentLoaded', updateFilledStatus);

function updateRequiredLabels() {
    document.querySelectorAll('.input-container').forEach(container => {
        const input = container.querySelector('input');
        const label = container.querySelector('label');
        
        if (input.value.trim() !== '') {
            label.classList.remove('required-label');
        } else {
            label.classList.add('required-label');
        }
    });
}

// Adicione event listeners
document.querySelectorAll('.input-container input').forEach(input => {
    input.addEventListener('input', updateRequiredLabels);
});

// Execute na inicialização
document.addEventListener('DOMContentLoaded', updateRequiredLabels);

function loadActivities() {
    const list = document.getElementById('activitiesList');
    list.innerHTML = activities.map((activity, index) => `
        <li>
            <span>${activity.name}</span>
            <button onclick="deleteActivity(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </li>
    `).join('');

    

    // Atualiza a lista na aba Análise
    const analysisList = document.getElementById('selectedActivities');
    analysisList.innerHTML = activities.map((activity, index) => `
        <li onclick="document.getElementById('activity${index}').click()">
            <input type="radio" name="activity" id="activity${index}" value="${activity.name}">
            <label for="activity${index}">${activity.name}</label>
            <button onclick="event.stopPropagation(); deleteActivity(${index})"><i class="fas fa-trash-alt"></i></button>
        </li>
    `).join('');

    document.getElementById('activitiesCount').textContent = activities.length;
    document.getElementById('activitiesCount2').textContent = activities.length;
    checkRequiredFields();
}

function handleActivityInput(e) {
    if(e.key === 'Enter') {
        const newActivity = e.target.value.trim().toLowerCase();
        
        if (!newActivity) return;
        
        // Verificar duplicidade
        if (activities.some(a => a.name.toLowerCase() === newActivity)) {
            alert('Atividade já existe!');
            e.target.value = '';
            return;
        }
        
        activities.push({name: newActivity});
        e.target.value = '';
        saveActivities();
        loadActivities();
    }
}



// Funções de atividades
function deleteActivity(index) {
    activities.splice(index, 1);
    saveActivities();
    loadTable();
}

function clearActivities() {
    activities = [];
    saveActivities();
}

// Funções da tabela
function startActivity() {
    const missingFields = requiredFields.filter(field => !document.getElementById(field).value.trim());
    if (missingFields.length > 0) {
        const translatedFields = missingFields.map(field => fieldTranslations[field]);
        alert(`Preencha todos os campos obrigatórios: ${translatedFields.join(', ')}`);
        return;
    }

    // Nao serve pra nada mas se tirar quebra
    if (currentActivityIndex !== -1) {
        alert('Finalize a atividade atual antes de iniciar uma nova!');
        return;
    }

    const activity = document.querySelector('input[name="activity"]:checked');
    if (!activity) {
        alert('Selecione uma atividade!');
        return;
    }
    
    const now = new Date();
    
    const newEntry = {
        bank: document.getElementById('bank').value,
        segment: document.getElementById('segment').value,
        interviewee: document.getElementById('interviewee').value,
        activityName: activity.value,
        date: now.toLocaleDateString('pt-BR'),
        startTime: now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit' // Adicionado segundos
        }),
        startTimestamp: now.getTime(),
        endTime: null,
        endTimestamp: null,
        duration: 0,
        durationDisplay: '<span id="liveDuration">00:00:00</span>',
        analyst: document.getElementById('analyst').value,
        activity: activity.value,
        rework: 0,
        observation: ''
    };

    tableData.push(newEntry);
    saveTable();
    updateExportButtonState();
    checkRequiredFields();
    currentActivityIndex = tableData.length - 1;
    loadTable();
    startLiveTimer(newEntry.startTimestamp);
}

function finishActivity() {
    const lastEntry = tableData[tableData.length - 1];
    if (!lastEntry || lastEntry.endTime) return;
    
    const endTime = new Date();
    const startTime = new Date(lastEntry.startTimestamp);
    const durationMs = endTime - startTime;
    
    // Converter milissegundos para horas, minutos e segundos
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    lastEntry.endTime = endTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit' // Adicionado segundos
    });
    lastEntry.endTimestamp = endTime.getTime();
    lastEntry.duration = durationMs;
    lastEntry.durationDisplay = 
        `${String(hours).padStart(2, '0')}:` +
        `${String(minutes).padStart(2, '0')}:` +
        `${String(seconds).padStart(2, '0')}`;
    
    // Verificação de retrabalho mantida
    const previousActivities = tableData.filter(entry => 
        entry.activity === lastEntry.activity && entry !== lastEntry
    );
    lastEntry.rework = previousActivities.length > 0 ? 1 : 0;
    
    saveTable();
    updateExportButtonState();
    currentActivityIndex = -1;
    checkRequiredFields();
    stopLiveTimer();
}

let liveTimerInterval = null;

function startLiveTimer(startTimestamp) {
    function update() {
        const now = new Date().getTime();
        const elapsed = now - startTimestamp;

        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        const display = 
            `${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(seconds).padStart(2, '0')}`;

        const span = document.getElementById('liveDuration');
        if (span) {
            span.textContent = display;
        }
    }

    update(); // Mostra imediatamente
    liveTimerInterval = setInterval(update, 1000);
}

function stopLiveTimer() {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
}

function deleteLastRow() {
    tableData.pop();
    saveTable();
    updateExportButtonState();
}

function clearTable() {
    tableData = [];
    saveTable();
    updateExportButtonState();
}

function updateExportButtonState() {
    const exportBtn = document.getElementById('exportBtn');
    const analysisName = document.getElementById('analysisName').value.trim();
    exportBtn.disabled = tableData.length === 0 || !analysisName;
}

function checkRequiredFields() {
    const requiredFields = ['analyst', 'bank', 'segment', 'interviewee'];
    const isValid = requiredFields.every(field => 
        document.getElementById(field).value.trim() !== ''
    );
    
    const activitySelected = document.querySelector('input[name="activity"]:checked') !== null;
    
    document.getElementById('startBtn').disabled = !isValid || !activitySelected;
}

document.addEventListener('click', (e) => {
    if (e.target.name === 'activity') {
        checkRequiredFields();
    }
});

// Exportação para Excel
function exportToExcel() {

    const analysisName = document.getElementById('analysisName').value.trim();
    if (!analysisName) {
        showAnalysisNameError();
        return;
    }


    const loadingOverlay = document.getElementById('loadingOverlay');
    const exportBtn = document.getElementById('exportBtn');
    
    // Mostrar animação
    loadingOverlay.style.display = 'flex';
    exportBtn.disabled = true;
    
    const wsData = XLSX.utils.aoa_to_sheet([
        ['Banco/Setor', 'Segmento', 'Entrevistado', 'Atividade', 'Data', 'Início', 'Fim', 'Tempo Total', 'Analista', 'Retrabalho', 'Observação'],
        ...tableData.map(entry => [
            entry.bank,
            entry.segment,
            entry.interviewee,
            entry.activity,
            entry.date,
            entry.startTime,
            entry.endTime || 'Em andamento',
            entry.durationDisplay,
            entry.analyst,
            entry.rework ? '1' : '0',
            entry.observation
        ])
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Dados');

    const metrics = calculateMetrics();
    const wsMetrics = XLSX.utils.aoa_to_sheet([
        ['Métrica', 'Valor'],
        ['Total de Atividades', metrics.totalActivities],
        ['Tempo Total', metrics.totalTime],
        ['Tempo Médio por Atividade', metrics.averageTime],
        ['Atividade Mais Longa', `${metrics.longestActivity.name || '-'} (${metrics.longestActivity.duration || '-'})`],
        ['Total de Retrabalhos', metrics.totalRework],
        ...metrics.reworkActivities.map(a => [a.activity, a.count])
    ]);
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas');

    // Ajustar largura das colunas
    wsData['!cols'] = [
        { wch: 18 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 15 }, { wch: 10 },
        { wch: 25 }
    ];
    wsMetrics['!cols'] = [
        { wch: 25 }, { wch: 20 }
    ];

    // Nome Do excel, provavelmente tinha um jeito melhor de fazer isso, mas não sei
    const analysiName = document.getElementById('analysisName').value;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const analyst = document.getElementById('analyst').value || 'Analista';
    const bank = document.getElementById('bank').value || 'Banco';
    const segment = document.getElementById('segment').value || 'Segmento';
    const fileName = `${analysiName}_${bank}_${segment}_${formattedDate}_${analyst}.xlsx`;

    XLSX.writeFile(wb, fileName);

    try {
        // Animação de sucesso
        document.querySelector('.spinner-check').style.opacity = '1';
        document.querySelector('.checkmark').style.animation = 'check-animation 0.6s ease-out forwards';
    } catch (error) {
        console.error('Erro na exportação:', error);
        alert('Erro ao exportar arquivo!');
    }

    // Esconder animação após 1.2s
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
        exportBtn.disabled = false;
        document.querySelector('.spinner-check').style.opacity = '0';
        document.querySelector('.checkmark').style.animation = '';
    }, 1200);
}

document.getElementById('exportBtn').addEventListener('click', () => {
    document.querySelector('.spinner-circle').style.animation = 'spin 0.8s linear infinite';
});


function updateMetrics() {
    const metrics = calculateMetrics();
    
    document.getElementById('totalActivities').textContent = metrics.totalActivities;
    document.getElementById('averageTime').textContent = metrics.averageTime;
    document.getElementById('longestActivity').innerHTML = metrics.longestActivity.name ?
        `${metrics.longestActivity.name}<br><small>${metrics.longestActivity.duration}</small>` : '-';
    document.getElementById('totalTime').textContent = metrics.totalTime;
    document.getElementById('totalRework').textContent = metrics.totalRework;
    
    const reworkList = document.getElementById('reworkActivities');
    reworkList.innerHTML = metrics.reworkActivities
        .map(a => `<li>${a.activity}<span>${a.count}x</span></li>`)
        .join('');
}

function calculateMetrics() {
    if (tableData.length === 0) return {
        totalActivities: 0,
        averageTime: '00:00:00',
        longestActivity: {},
        totalTime: '00:00:00',
        totalRework: 0,
        reworkActivities: []
    };

    const totalMs = tableData.reduce((sum, entry) => sum + entry.duration, 0);
    
    // Cálculo preciso com segundos
    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalSeconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    // Cálculo da média
    const avgMs = totalMs / tableData.length;
    const avgHours = Math.floor(avgMs / (1000 * 60 * 60));
    const avgMinutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    const avgSeconds = Math.floor((avgMs % (1000 * 60)) / 1000);

    return {
        totalActivities: tableData.length,
        averageTime: `${String(avgHours).padStart(2, '0')}:` +
                    `${String(avgMinutes).padStart(2, '0')}:` +
                    `${String(avgSeconds).padStart(2, '0')}`,
        longestActivity: {
            name: tableData.reduce((a, b) => a.duration > b.duration ? a : b).activity,
            duration: tableData.reduce((a, b) => a.duration > b.duration ? a : b).durationDisplay
        },
        totalTime: `${String(totalHours).padStart(2, '0')}:` +
                  `${String(totalMinutes).padStart(2, '0')}:` +
                  `${String(totalSeconds).padStart(2, '0')}`,
        totalRework: tableData.reduce((sum, entry) => sum + entry.rework, 0),
        reworkActivities: tableData
            .filter(entry => entry.rework > 0)
            .reduce((acc, entry) => {
                const existing = acc.find(a => a.activity === entry.activity);
                existing ? existing.count++ : acc.push({ activity: entry.activity, count: 1 });
                return acc;
            }, [])
    };
}

// Controle de abas
function showTab(index) {
    document.querySelectorAll('.tab-content').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    if (index === 2) updateMetrics();
}

// Carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
    loadTable();
    updateMetrics();
    updateExportButtonState();
    
    document.getElementById('newActivity').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newActivity = e.target.value.trim().toLowerCase();
            
            // Verificar duplicidade
            if (activities.some(activity => activity.name.toLowerCase() === newActivity)) {
                alert('Atividade já existe!');
                e.target.value = '';
                return;
            }
            
            activities.push({ name: newActivity });
            e.target.value = '';
            saveActivities();
        }
    });
});


function loadTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = tableData.map(entry => `
        <tr>
            <td>${entry.bank}</td>
            <td>${entry.segment}</td>
            <td>${entry.interviewee}</td>
            <td>${entry.activity}</td>
            <td>${entry.date}</td>
            <td>${entry.startTime}</td>
            <td>${entry.endTime || 'Em andamento'}</td>
            <td>${entry.durationDisplay}</td>
            <td>${entry.analyst}</td>
            <td>${entry.rework ? 'Sim' : 'Não'}</td>
            <td><input type="text" value="${entry.observation}" onchange="updateObservation(${tableData.indexOf(entry)}, this.value)"></td>
        </tr>
    `).join('');
}

function updateObservation(index, value) {
    tableData[index].observation = value;
    saveTable();
}
