// State Management
let state = {
    cohorts: [],
    inventory: [],
    history: [],
    settings: {
        margin: 5 // Default 5%
    }
};

// Local Storage Helper
const STORAGE_KEY = 'cafeManager_state_v2';

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        state = JSON.parse(saved);
        // Ensure defaults if upgrading from older versions
        if(!state.history) state.history = [];
        if(!state.settings) state.settings = { margin: 5 };
        return true;
    }
    return false;
}

// Formatter for Colombian Pesos
const formatCOP = (value) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

// DOM Elements
const elements = {
    navBtns: document.querySelectorAll('.nav-btn'),
    views: document.querySelectorAll('.view'),
    currentDate: document.getElementById('currentDate'),
    
    // Dashboard
    dashBudgetStatus: document.getElementById('dash-budget-status'),
    dashTotalStudents: document.getElementById('dash-total-students'),
    dashTotalProfessors: document.getElementById('dash-total-professors'),
    
    // Settings
    settingMargin: document.getElementById('setting-margin'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnCloseWeekend: document.getElementById('btn-close-weekend'),
    
    // Campus Counts
    countClaustro: document.getElementById('count-claustro'),
    countSanagustin: document.getElementById('count-sanagustin'),
    countPiedra: document.getElementById('count-piedra'),
    countZaragocilla: document.getElementById('count-zaragocilla'),
    
    // Costs per person
    costPerStudent: document.getElementById('cost-per-student'),
    costPerProfessor: document.getElementById('cost-per-professor'),
    
    // Calculator
    calcBaseInventory: document.getElementById('calc-base-inventory'),
    calcProjectedCost: document.getElementById('calc-projected-cost'),
    calcBudgetBalance: document.getElementById('calc-budget-balance'),
    balanceHint: document.getElementById('balance-hint'),
    
    // Assistant
    assistantAlerts: document.getElementById('assistant-alerts'),
    assistantMonthCost: document.getElementById('assistant-month-cost'),
    
    // Modals
    modalOverlay: document.getElementById('modal-overlay'),
    cohortModal: document.getElementById('cohort-modal'),
    inventoryModal: document.getElementById('inventory-modal'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    
    // Tables
    cohortsTableBody: document.querySelector('#cohorts-table tbody'),
    inventoryTableBody: document.querySelector('#inventory-table tbody'),
    historyTableBody: document.querySelector('#history-table tbody'),
    cohortsEmpty: document.getElementById('cohorts-empty'),
    inventoryEmpty: document.getElementById('inventory-empty'),
    historyEmpty: document.getElementById('history-empty'),
    programSummaryTableBody: document.querySelector('#program-summary-table tbody'),
    
    // Buttons
    btnAddCohort: document.getElementById('btn-add-cohort'),
    btnAddItem: document.getElementById('btn-add-item'),
    btnLoadPdfData: document.getElementById('btn-load-pdf-data'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    closeModalBtns: document.querySelectorAll('.close-modal, .close-modal-btn'),
    
    // Simulator
    simStudents: document.getElementById('sim-students'),
    simDays: document.getElementById('sim-days'),
    simBreaks: document.getElementById('sim-breaks'),
    simulatorResults: document.getElementById('simulator-results'),
    
    // Forms
    cohortForm: document.getElementById('cohort-form'),
    inventoryForm: document.getElementById('inventory-form')
};

// Initialize Application
function init() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = new Date().toLocaleDateString('es-CO', options);
    
    const hasData = loadData();
    if(hasData && elements.btnLoadPdfData) {
        elements.btnLoadPdfData.style.display = 'none'; // Hide factory reset if has data
    }
    
    elements.settingMargin.value = state.settings.margin;
    
    setupEventListeners();
    updateUI();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.currentTarget.dataset.view;
            switchView(viewId);
            elements.navBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Modals
    elements.btnAddCohort.addEventListener('click', () => openModal(elements.cohortModal));
    elements.btnAddItem.addEventListener('click', () => openModal(elements.inventoryModal));
    elements.closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));

    // Forms
    elements.cohortForm.addEventListener('submit', handleCohortSubmit);
    elements.inventoryForm.addEventListener('submit', handleInventorySubmit);

    // Load PDF Data
    if (elements.btnLoadPdfData) elements.btnLoadPdfData.addEventListener('click', loadPdfData);
    
    // Features
    elements.btnSaveSettings.addEventListener('click', () => {
        state.settings.margin = parseFloat(elements.settingMargin.value) || 0;
        saveData();
        updateUI();
        showToast('Configuración guardada. Proyecciones recalculadas.');
    });
    
    elements.btnCloseWeekend.addEventListener('click', closeWeekend);
    elements.btnExportCsv.addEventListener('click', exportCSV);
    
    if(elements.simStudents) elements.simStudents.addEventListener('input', renderSimulator);
    if(elements.simDays) elements.simDays.addEventListener('input', renderSimulator);
    if(elements.simBreaks) elements.simBreaks.addEventListener('input', renderSimulator);
}

// Navigation
function switchView(viewId) {
    elements.views.forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
        if (view.id === `view-${viewId}`) {
            view.classList.add('active');
            view.classList.remove('hidden');
        }
    });
}

// Modal Logic
function openModal(modalEl) {
    elements.modalOverlay.classList.remove('hidden');
    modalEl.classList.remove('hidden');
}

function closeModal() {
    elements.modalOverlay.classList.add('hidden');
    elements.cohortModal.classList.add('hidden');
    elements.inventoryModal.classList.add('hidden');
    elements.cohortForm.reset();
    elements.inventoryForm.reset();
}

function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');
    setTimeout(() => { elements.toast.classList.add('hidden'); }, 3000);
}

// CRUD
function handleCohortSubmit(e) {
    e.preventDefault();
    const newCohort = {
        id: Date.now().toString(),
        program: document.getElementById('cohort-program').value,
        cohortName: document.getElementById('cohort-name').value,
        sede: document.getElementById('cohort-sede').value,
        schedule: document.getElementById('cohort-schedule').value,
        students: parseInt(document.getElementById('cohort-students').value),
        professors: parseInt(document.getElementById('cohort-professors').value),
        active: true
    };
    
    state.cohorts.push(newCohort);
    saveData();
    closeModal();
    updateUI();
    showToast('Cohorte agregada correctamente');
}

function handleInventorySubmit(e) {
    e.preventDefault();
    
    const wholesaleCost = parseFloat(document.getElementById('item-wholesale-cost').value);
    const wholesaleUnits = parseInt(document.getElementById('item-wholesale-units').value);
    const costPerUnit = wholesaleCost / wholesaleUnits;

    const calcMethod = document.getElementById('item-calc-method') ? document.getElementById('item-calc-method').value : 'individual';
    let projection = 1;
    let ratioUnits = null;
    let ratioPeople = null;

    if (calcMethod === 'ratio') {
        ratioUnits = parseFloat(document.getElementById('item-ratio-units').value);
        ratioPeople = parseInt(document.getElementById('item-ratio-people').value);
        projection = ratioUnits / ratioPeople;
    } else {
        projection = parseFloat(document.getElementById('item-projection').value);
    }

    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('item-name').value,
        type: document.getElementById('item-type').value,
        wholesaleCost: wholesaleCost,
        wholesaleUnits: wholesaleUnits,
        stock: parseInt(document.getElementById('item-stock').value),
        cost: costPerUnit,
        calcMethod: calcMethod,
        projection: projection,
        ratioUnits: ratioUnits,
        ratioPeople: ratioPeople
    };
    
    state.inventory.push(newItem);
    saveData();
    closeModal();
    updateUI();
    showToast('Producto agregado al inventario');
}

function deleteCohort(id) {
    if(confirm('¿Seguro que deseas eliminar este grupo?')) {
        state.cohorts = state.cohorts.filter(c => c.id !== id);
        saveData();
        updateUI();
        showToast('Grupo eliminado');
    }
}

function deleteInventoryItem(id) {
    if(confirm('¿Seguro que deseas eliminar este producto?')) {
        state.inventory = state.inventory.filter(i => i.id !== id);
        saveData();
        updateUI();
        showToast('Producto eliminado');
    }
}

function toggleCohortActive(id) {
    const cohort = state.cohorts.find(c => c.id === id);
    if(cohort) {
        cohort.active = !cohort.active;
        saveData();
        updateUI();
    }
}

window.deleteCohort = deleteCohort;
window.deleteInventoryItem = deleteInventoryItem;
window.toggleCohortActive = toggleCohortActive;

// Type badge helper
function getTypeBadge(type) {
    if(type === 'coffee') return '<span class="badge badge-coffee">Café (Est.)</span>';
    if(type === 'water') return '<span class="badge badge-water">Agua (Prof.)</span>';
    return '<span class="badge badge-other">General</span>';
}

// Math Helpers
function calculateBreaks() {
    let studentBreaks = 0;
    let professorBreaks = 0;
    
    state.cohorts.filter(c => c.active).forEach(c => {
        let breaksForCohort = 0;
        if (c.schedule === 'Viernes y Sábado') breaksForCohort = 3;
        else if (c.schedule === 'Solo Viernes') breaksForCohort = 1;
        else if (c.schedule === 'Solo Sábado') breaksForCohort = 2;
        else if (c.schedule === 'Miércoles a Viernes') breaksForCohort = 6;
        
        studentBreaks += (c.students * breaksForCohort);
        professorBreaks += (c.professors * breaksForCohort);
    });
    
    return { studentBreaks, professorBreaks };
}

function getItemRequirements() {
    const breaks = calculateBreaks();
    const marginMultiplier = 1 + (state.settings.margin / 100);
    
    return state.inventory.map(item => {
        let baseBreaks = 0;
        if(item.type === 'coffee') baseBreaks = breaks.studentBreaks;
        else if (item.type === 'water') baseBreaks = breaks.professorBreaks;
        else baseBreaks = breaks.studentBreaks + breaks.professorBreaks;
        
        const pureRequired = baseBreaks * item.projection;
        const totalRequired = Math.ceil(pureRequired * marginMultiplier);
        
        return {
            ...item,
            pureRequired,
            totalRequired,
            projectedCost: totalRequired * item.cost
        };
    });
}

// Advanced Features
function closeWeekend() {
    const activeCohorts = state.cohorts.filter(c => c.active);
    if(activeCohorts.length === 0) {
        alert('No hay cohortes activas para cerrar el fin de semana.');
        return;
    }
    
    if(!confirm('¿Estás seguro de cerrar el fin de semana? Esto descontará los insumos proyectados (incluyendo margen de holgura) de tu stock físico real.')) return;
    
    const requirements = getItemRequirements();
    let totalSpent = 0;
    
    // Deduct stock
    requirements.forEach(req => {
        const item = state.inventory.find(i => i.id === req.id);
        if(item) {
            item.stock = Math.max(0, item.stock - req.totalRequired);
            totalSpent += req.projectedCost;
        }
    });
    
    // Create history record
    const numStudents = activeCohorts.reduce((sum, c) => sum + c.students, 0);
    const numProfessors = activeCohorts.reduce((sum, c) => sum + c.professors, 0);
    
    state.history.push({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('es-CO'),
        students: numStudents,
        professors: numProfessors,
        cost: totalSpent,
        margin: state.settings.margin
    });
    
    // Deactivate all cohorts for next weekend
    state.cohorts.forEach(c => c.active = false);
    
    saveData();
    updateUI();
    showToast('Fin de semana cerrado. Stock descontado y guardado en el historial.');
    switchView('history');
}

function exportCSV() {
    const requirements = getItemRequirements();
    if(requirements.length === 0) {
        alert('No hay inventario para exportar.');
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Producto,Tipo,Stock Fisico,Requerido Puro,Requerido Con Margen ("+state.settings.margin+"%),Faltante,Costo Proyectado\n";
    
    requirements.forEach(req => {
        const missing = Math.max(0, req.totalRequired - req.stock);
        const row = [
            `"${req.name}"`,
            req.type,
            req.stock,
            req.pureRequired.toFixed(1),
            req.totalRequired,
            missing,
            req.projectedCost
        ].join(",");
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lista_Mercado_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Core Update Logic
function updateUI() {
    renderCohorts();
    renderInventory();
    renderHistory();
    renderSimulator();
    const financialData = calculateFinancials();
    renderProgramSummary(financialData);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderCohorts() {
    elements.cohortsTableBody.innerHTML = '';
    
    if (state.cohorts.length === 0) {
        elements.cohortsEmpty.style.display = 'flex';
        document.querySelector('#cohorts-table').style.display = 'none';
        return;
    }
    
    elements.cohortsEmpty.style.display = 'none';
    document.querySelector('#cohorts-table').style.display = 'table';
    
    state.cohorts.forEach(cohort => {
        const tr = document.createElement('tr');
        if(!cohort.active) tr.style.opacity = '0.6';
        
        tr.innerHTML = `
            <td><strong>${cohort.program}</strong></td>
            <td>${cohort.cohortName || '-'}</td>
            <td><span style="background: #EEF2FF; color: var(--primary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">${cohort.sede}</span><br><small style="color:var(--text-muted)">${cohort.schedule}</small></td>
            <td>E: <strong>${cohort.students}</strong> <br> P: <strong>${cohort.professors}</strong></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${cohort.active ? 'checked' : ''} onchange="toggleCohortActive('${cohort.id}')">
                    <span class="slider"></span>
                </label>
            </td>
            <td>
                <button onclick="deleteCohort('${cohort.id}')" class="btn-danger"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
            </td>
        `;
        elements.cohortsTableBody.appendChild(tr);
    });
}

function renderInventory() {
    elements.inventoryTableBody.innerHTML = '';
    
    if (state.inventory.length === 0) {
        elements.inventoryEmpty.style.display = 'flex';
        document.querySelector('#inventory-table').style.display = 'none';
        return;
    }
    
    elements.inventoryEmpty.style.display = 'none';
    document.querySelector('#inventory-table').style.display = 'table';
    
    const requirements = getItemRequirements();
    
    requirements.forEach(req => {
        const tr = document.createElement('tr');
        const deficitColor = req.stock < req.totalRequired ? 'color:#DC2626; font-weight:bold;' : 'color:#10B981;';
        
        let rendimientoText = '';
        if (req.calcMethod === 'ratio') {
            rendimientoText = `<small style="display:block; color:var(--primary); font-weight:600; font-size:0.75rem; margin-top:0.25rem;">Rendimiento: ${req.ratioUnits} und. por ${req.ratioPeople} pers.</small>`;
        }
        
        tr.innerHTML = `
            <td><strong>${req.name}</strong><br>${getTypeBadge(req.type)}${rendimientoText}</td>
            <td>${formatCOP(req.wholesaleCost)} <small>(x${req.wholesaleUnits})</small></td>
            <td style="font-size:1.1rem; font-weight:700;">${req.stock} <small>und</small></td>
            <td><strong style="font-size:1.1rem;">${req.totalRequired.toFixed(1)}</strong> <small>und</small></td>
            <td style="${deficitColor}">${formatCOP(req.projectedCost)}</td>
            <td>
                <button onclick="deleteInventoryItem('${req.id}')" class="btn-danger"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
            </td>
        `;
        elements.inventoryTableBody.appendChild(tr);
    });
}

function renderHistory() {
    if (!elements.historyTableBody) return;
    elements.historyTableBody.innerHTML = '';
    
    if (state.history.length === 0) {
        elements.historyEmpty.style.display = 'flex';
        document.querySelector('#history-table').style.display = 'none';
        return;
    }
    
    elements.historyEmpty.style.display = 'none';
    document.querySelector('#history-table').style.display = 'table';
    
    // Reverse to show latest first
    const reversedHistory = [...state.history].reverse();
    
    reversedHistory.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${record.date}</strong></td>
            <td>${record.students}</td>
            <td>${record.professors}</td>
            <td style="color:#DC2626; font-weight:600;">${formatCOP(record.cost)}</td>
            <td><span class="badge badge-other">+${record.margin}%</span></td>
        `;
        elements.historyTableBody.appendChild(tr);
    });
}

function calculateFinancials() {
    const activeCohorts = state.cohorts.filter(c => c.active);
    
    const numStudents = activeCohorts.reduce((sum, c) => sum + c.students, 0);
    const numProfessors = activeCohorts.reduce((sum, c) => sum + c.professors, 0);
    
    elements.dashTotalStudents.textContent = numStudents;
    elements.dashTotalProfessors.textContent = numProfessors;
    
    // Campus Distribution
    const counts = { 'Claustro / Centro': 0, 'San Agustín': 0, 'Piedra de Bolívar': 0, 'Zaragocilla': 0 };
    activeCohorts.forEach(c => {
        if (counts[c.sede] !== undefined) counts[c.sede] += c.students;
    });
    
    elements.countClaustro.textContent = counts['Claustro / Centro'];
    elements.countSanagustin.textContent = counts['San Agustín'];
    elements.countPiedra.textContent = counts['Piedra de Bolívar'];
    elements.countZaragocilla.textContent = counts['Zaragocilla'];

    // Math
    const requirements = getItemRequirements();
    
    let totalCoffeeCost = 0;
    let totalWaterCost = 0;
    let totalOtherCost = 0;
    
    let baseInventoryCost = 0;
    
    requirements.forEach(req => {
        // Evaluate the cost of the actual physical stock the user has
        baseInventoryCost += (req.stock * req.cost);
        
        if(req.type === 'coffee') totalCoffeeCost += req.projectedCost;
        else if (req.type === 'water') totalWaterCost += req.projectedCost;
        else totalOtherCost += req.projectedCost;
    });
    
    const projectedNeedsCost = totalCoffeeCost + totalWaterCost + totalOtherCost;
    const budgetBalance = baseInventoryCost - projectedNeedsCost;
    
    // Monthly Projection
    if(elements.assistantMonthCost) {
        elements.assistantMonthCost.textContent = formatCOP(projectedNeedsCost * 4);
    }
    
    // Smart Assistant Alerts
    if(elements.assistantAlerts) {
        let alertHTML = '';
        requirements.forEach(req => {
            if (req.stock < req.totalRequired) {
                const missingUnits = req.totalRequired - req.stock;
                const boxesToBuy = Math.ceil(missingUnits / req.wholesaleUnits);
                const costToBuy = boxesToBuy * req.wholesaleCost;
                alertHTML += `
                    <div style="margin-bottom:0.75rem; padding-bottom:0.75rem; border-bottom:1px solid #E2E8F0;">
                        <strong style="color:#DC2626; display:block; margin-bottom:0.25rem;">⚠️ Déficit de ${req.name}</strong>
                        <span style="color:var(--text-muted); display:block; margin-bottom:0.25rem; font-size:0.85rem;">Faltan ${missingUnits} unidades para la proyección.</span>
                        <strong style="color:var(--text-main);">Sugerencia:</strong> Comprar ${boxesToBuy} caja(s)/paca(s) al por mayor.
                        <br><span style="color:#10B981; font-weight:600;">Costo Inversión: ${formatCOP(costToBuy)}</span>
                    </div>
                `;
            }
        });

        if (alertHTML === '') {
            alertHTML = `
                <div style="text-align:center; padding-top:1rem;">
                    <p style="color:#10B981; font-weight:600; font-size:1.1rem; margin-bottom:0.5rem;">Inventario Suficiente</p>
                    <p style="color:var(--text-muted); font-size:0.85rem;">Tu stock actual cubre perfectamente las necesidades del fin de semana programado.</p>
                </div>
            `;
        }
        elements.assistantAlerts.innerHTML = alertHTML;
    }
    
    // Unit Costs metrics
    const costPerStudent = numStudents > 0 ? (totalCoffeeCost / numStudents) : 0;
    const costPerProfessor = numProfessors > 0 ? (totalWaterCost / numProfessors) : 0;
    
    elements.costPerStudent.textContent = formatCOP(costPerStudent);
    elements.costPerProfessor.textContent = formatCOP(costPerProfessor);

    // Update calculator DOM
    elements.calcBaseInventory.textContent = formatCOP(baseInventoryCost);
    elements.calcProjectedCost.textContent = formatCOP(projectedNeedsCost);
    
    const balanceEl = elements.calcBudgetBalance;
    balanceEl.textContent = formatCOP(budgetBalance);
    
    if (budgetBalance < 0) {
        balanceEl.style.color = '#DC2626'; // Deficit
        elements.balanceHint.textContent = "ALERTA: El valor del stock actual NO CUBRE la demanda proyectada para este fin de semana.";
        elements.dashBudgetStatus.textContent = formatCOP(budgetBalance);
        elements.dashBudgetStatus.style.color = '#DC2626';
    } else {
        balanceEl.style.color = '#10B981'; // Surplus
        elements.balanceHint.textContent = "El inventario físico es suficiente para la demanda de este fin de semana.";
        elements.dashBudgetStatus.textContent = "+" + formatCOP(budgetBalance);
        elements.dashBudgetStatus.style.color = '#10B981';
    }
    
    return { costPerStudent, costPerProfessor, otherCostPerPerson: (numStudents + numProfessors) > 0 ? (totalOtherCost / (numStudents + numProfessors)) : 0 };
}

function renderProgramSummary(financialData) {
    if (!elements.programSummaryTableBody) return;
    elements.programSummaryTableBody.innerHTML = '';
    
    const activeCohorts = state.cohorts.filter(c => c.active);
    
    if (activeCohorts.length === 0) {
        elements.programSummaryTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No hay cohortes activas este fin de semana</td></tr>';
        return;
    }
    
    const summary = {};
    activeCohorts.forEach(c => {
        const key = c.program + "|||" + (c.cohortName || "Sin Cohorte");
        if (!summary[key]) {
            summary[key] = { program: c.program, cohort: c.cohortName || "Sin Cohorte", students: 0, professors: 0 };
        }
        summary[key].students += c.students;
        summary[key].professors += c.professors;
    });
    
    Object.values(summary).forEach(row => {
        const projectedCost = (row.students * financialData.costPerStudent) + 
                              (row.professors * financialData.costPerProfessor) + 
                              ((row.students + row.professors) * financialData.otherCostPerPerson);
                              
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.program}</strong></td>
            <td>${row.cohort}</td>
            <td><strong>${row.students}</strong></td>
            <td><strong>${row.professors}</strong></td>
            <td style="color:#DC2626;font-weight:600;">${formatCOP(projectedCost)}</td>
        `;
        elements.programSummaryTableBody.appendChild(tr);
    });
}

function renderSimulator() {
    if (!elements.simulatorResults) return;
    
    const students = parseInt(elements.simStudents.value) || 0;
    const days = parseInt(elements.simDays.value) || 1;
    const breaksPerDay = parseInt(elements.simBreaks.value) || 0;
    const breaks = days * breaksPerDay;
    
    elements.simulatorResults.innerHTML = '';
    
    const itemsToSimulate = state.inventory.filter(item => item.type !== 'water');
    
    if (itemsToSimulate.length === 0) {
        elements.simulatorResults.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay productos aplicables para estudiantes en el inventario.</p>';
        return;
    }
    
    itemsToSimulate.forEach(item => {
        const unitCost = item.cost;
        const requiredPerPersonPerBreak = item.projection; 
        const costPerPersonPerBreak = requiredPerPersonPerBreak * unitCost;
        
        const projectedUnits = students * breaks * requiredPerPersonPerBreak;
        const projectedCost = projectedUnits * unitCost;
        
        let ruleText = '';
        if (item.calcMethod === 'ratio') {
            ruleText = `Regla Base: Rinde ${item.ratioUnits} unds. por cada ${item.ratioPeople} personas.`;
        } else {
            ruleText = `Regla Base: Consumo exacto de ${item.projection} und. por persona.`;
        }
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '1.25rem';
        card.style.borderLeft = '4px solid #F59E0B';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="margin-bottom:0.25rem; color:var(--text-main); font-size:1.1rem;">${item.name}</h3>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1rem;">${ruleText}</p>
                </div>
                <div style="text-align:right;">
                    <span class="badge badge-other">Costo Mayorista: ${formatCOP(item.wholesaleCost)} / ${item.wholesaleUnits} und</span>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; background:#F8FAFC; padding:1rem; border-radius:var(--radius-md);">
                <div>
                    <h4 style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;"><i data-lucide="user" style="width:14px;height:14px;"></i> Análisis Unitario (1 Pers. x 1 Break)</h4>
                    <p style="font-size:0.95rem; color:var(--text-main);">Gasto Físico: <strong style="color:var(--primary);">${requiredPerPersonPerBreak.toFixed(4)}</strong> <small>unidades</small></p>
                    <p style="font-size:0.95rem; color:var(--text-main);">Costo Unitario: <strong style="color:#10B981;">${formatCOP(costPerPersonPerBreak)}</strong> <small>COP</small></p>
                </div>
                <div style="border-left:2px solid #E2E8F0; padding-left:1rem;">
                    <h4 style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;"><i data-lucide="calculator" style="width:14px;height:14px;"></i> Proyección (${students} pers. x ${days} días x ${breaksPerDay} breaks)</h4>
                    <p style="font-size:0.95rem; color:var(--text-main);">Total a gastar: <strong style="color:#F59E0B;">${projectedUnits.toFixed(2)}</strong> <small>unidades</small></p>
                    <p style="font-size:0.95rem; color:var(--text-main);">Costo Proyectado: <strong style="color:#DC2626;">${formatCOP(projectedCost)}</strong> <small>COP</small></p>
                </div>
            </div>
        `;
        elements.simulatorResults.appendChild(card);
    });
}

// Load Exact PDF Data with Calendar & Wholesale Support
function loadPdfData() {
    state.cohorts = [
        // La Merced -> Claustro / Centro
        { id: '1', program: 'Especialización Gestión de la Calidad y Auditoría en Salud', cohortName: 'COHORTE 52 SEM. I', sede: 'Claustro / Centro', schedule: 'Viernes y Sábado', students: 17, professors: 1, active: true },
        { id: '2', program: 'Maestría en Sistemas Integrados de Gestión', cohortName: 'COHORTE I SEM. I', sede: 'Claustro / Centro', schedule: 'Viernes y Sábado', students: 20, professors: 1, active: true },
        { id: '3', program: 'Doctorado en Estudios del Desarrollo', cohortName: 'COHORTE I', sede: 'Claustro / Centro', schedule: 'Miércoles a Viernes', students: 15, professors: 1, active: true },
        { id: '4', program: 'Especialización en Gestión Gerencial', cohortName: 'COHORTE 33 SEM. II', sede: 'Claustro / Centro', schedule: 'Viernes y Sábado', students: 11, professors: 1, active: true },
        { id: '5', program: 'Especialización Gestión de la Calidad y Auditoría en Salud', cohortName: 'COHORTE 51 SEM. II', sede: 'Claustro / Centro', schedule: 'Viernes y Sábado', students: 24, professors: 1, active: true },
        
        // San Agustín
        { id: '6', program: 'Especialización en Gestión Gerencial', cohortName: 'COHORTE 49 SEM. II', sede: 'San Agustín', schedule: 'Viernes y Sábado', students: 16, professors: 1, active: true },
        
        // Piedra de Bolívar
        { id: '7', program: 'Especialización en Gerencia en Salud', cohortName: 'COHORTE 49 SEM. I', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 13, professors: 1, active: true },
        { id: '8', program: 'Especialización en Finanzas', cohortName: 'COHORTE 52 SEM. II', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 17, professors: 1, active: true },
        { id: '9', program: 'Especialización en Gerencia en Salud', cohortName: 'COHORTE 48 SEM. II', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 19, professors: 1, active: true },
        { id: '10', program: 'Especialización en Revisoría Fiscal y Auditoría Internacional', cohortName: 'COHORTE 13 SEM. I', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 9, professors: 1, active: true },
        { id: '11', program: 'Especialización en Finanzas', cohortName: 'COHORTE 53 SEM. I', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 19, professors: 1, active: true },
        { id: '12', program: 'Especialización en Revisoría Fiscal y Auditoría Internacional', cohortName: 'COHORTE 12 SEM. II', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 15, professors: 1, active: true },
        { id: '13', program: 'Especialización en Finanzas', cohortName: 'COHORTE 20', sede: 'Piedra de Bolívar', schedule: 'Viernes y Sábado', students: 12, professors: 1, active: true }
    ];
    
    // Wholesale inventory
    state.inventory = [
        { id: '101', name: 'Café Grano Tostado (Bolsas 500g)', type: 'coffee', wholesaleCost: 45000, wholesaleUnits: 150, stock: 10, cost: 300, calcMethod: 'ratio', ratioUnits: 2, ratioPeople: 90, projection: (2/90) },
        { id: '102', name: 'Azúcar (Sobres)', type: 'coffee', wholesaleCost: 20000, wholesaleUnits: 500, stock: 1000, cost: 40, calcMethod: 'ratio', ratioUnits: 1, ratioPeople: 10, projection: (1/10) },
        { id: '103', name: 'Palitos Revolvedores', type: 'coffee', wholesaleCost: 5000, wholesaleUnits: 500, stock: 200, cost: 10, calcMethod: 'ratio', ratioUnits: 120, ratioPeople: 98, projection: (120/98) },
        { id: '104', name: 'Paca Agua Cristal', type: 'water', wholesaleCost: 36000, wholesaleUnits: 24, stock: 200, cost: 1500, calcMethod: 'individual', projection: 1 }
    ];
    
    state.history = []; // Reset history on factory reset
    
    saveData();
    updateUI();
    showToast('Base de datos PDF y lógica mayorista cargadas con éxito');
    if(elements.btnLoadPdfData) elements.btnLoadPdfData.style.display = 'none';
}

// Boot up
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
