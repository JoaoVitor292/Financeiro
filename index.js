const categories = ['casa', 'poupanca', 'emergencia', 'lazer', 'outros'];
const sliders = categories.map(category => document.getElementById(category));
const outputs = categories.map(category => document.getElementById(`${category}Value`));
const totalPercentageDisplay = document.getElementById('totalPercentage');
let totalReceived = 0;
let history = [];

function updateSliders(changedIndex) {
let total = 0;
sliders.forEach((slider, index) => {
total += parseInt(slider.value);
outputs[index].innerHTML = slider.value + '%';
outputs[index].classList.toggle('warning', parseInt(slider.value) === 100);
});

if (total > 100) {
const excess = total - 100;
sliders[changedIndex].value -= excess;
outputs[changedIndex].innerHTML = sliders[changedIndex].value + '%';
total = 100;
}

totalPercentageDisplay.innerHTML = `Total: ${total}%`;
totalPercentageDisplay.classList.toggle('error', total > 100);
totalPercentageDisplay.classList.toggle('warning', total === 100);
}

sliders.forEach((slider, index) => {
slider.oninput = () => updateSliders(index);
});

function calcular() {
totalReceived = parseFloat(document.getElementById('total').value);
if (isNaN(totalReceived) || totalReceived <= 0) {
alert('Por favor, insira um valor total válido.');
return;
}

let sum = 0;
const results = {};

categories.forEach(category => {
const percentage = parseInt(document.getElementById(category).value);
sum += percentage;
results[category] = (totalReceived * percentage / 100).toFixed(2);
});

if (sum !== 100) {
alert('A soma das porcentagens deve ser 100%.');
return;
}

displayResults(results);
saveToHistory(results);
}

function displayResults(results) {
const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = '<h2>Resultados</h2>';
for (const [category, value] of Object.entries(results)) {
const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
resultsDiv.innerHTML += `
    <div class="result-item">
        <h3 onclick="toggleResultContent(this)">
            ${categoryName}
            <i class="fas fa-chevron-down"></i>
        </h3>
        <div class="result-content collapsed">
            <p>Valor alocado: R$ ${value}</p>
            <div class="expense-input">
                <input type="number" id="${category}-spent" placeholder="Valor gasto">
                <button onclick="calculateBalance('${category}', ${value})">Calcular Saldo</button>
            </div>
            <p id="${category}-balance" class="balance"></p>
        </div>
    </div>
`;
}
}

function toggleResultContent(header) {
header.classList.toggle('collapsed');
const content = header.nextElementSibling;
content.classList.toggle('collapsed');
const arrow = header.querySelector('.fa-chevron-down');
arrow.style.transform = content.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
}

function calculateBalance(category, allocated) {
const spent = parseFloat(document.getElementById(`${category}-spent`).value);
if (isNaN(spent)) {
alert('Por favor, insira um valor gasto válido.');
return;
}

const balance = allocated - spent;
const balanceElement = document.getElementById(`${category}-balance`);
if (balance >= 0) {
balanceElement.innerHTML = `Saldo restante: R$ ${balance.toFixed(2)}`;
balanceElement.className = 'balance profit';
} else {
balanceElement.innerHTML = `Déficit: R$ ${Math.abs(balance).toFixed(2)}`;
balanceElement.className = 'balance loss';
}

// Atualizar o histórico com os novos dados de gasto
if (history.length > 0) {
history[0].balances[category] = { spent, balance };
localStorage.setItem('financialHistory', JSON.stringify(history));
updateHistoryDisplay();
}
}

function saveToHistory(results) {
const date = new Date().toLocaleString();
const historyItem = { date, results, balances: {} };
history.unshift(historyItem);
if (history.length > 5) {
history.pop();
}
localStorage.setItem('financialHistory', JSON.stringify(history));
updateHistoryDisplay();
}

function loadHistory() {
const savedHistory = localStorage.getItem('financialHistory');
if (savedHistory) {
history = JSON.parse(savedHistory);
updateHistoryDisplay();
}
}

function updateHistoryDisplay() {
const historyContent = document.getElementById('history-content');
historyContent.innerHTML = '';
history.forEach((item, index) => {
let totalProfit = 0;
let totalLoss = 0;
const categoryDetails = categories.map(category => {
    const allocated = parseFloat(item.results[category]);
    const spent = item.balances[category] ? parseFloat(item.balances[category].spent) : 0;
    const balance = allocated - spent;
    if (balance >= 0) {
        totalProfit += balance;
    } else {
        totalLoss += Math.abs(balance);
    }
    return `
        <div class="history-category">
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <p>Alocado: R$ ${allocated.toFixed(2)}</p>
            <p>Gasto: R$ ${spent.toFixed(2)}</p>
            <p class="${balance >= 0 ? 'profit' : 'loss'}">
                ${balance >= 0 ? 'Lucro' : 'Perda'}: R$ ${Math.abs(balance).toFixed(2)}
            </p>
        </div>
    `;
}).join('');

historyContent.innerHTML += `
    <div class="history-item">
        <h3 onclick="toggleHistoryContent(this)">
            ${item.date}
            <span class="history-icons">
                <i class="fas fa-chevron-down"></i>
                <i class="fas fa-trash" onclick="removeHistoryItem(event, ${index})"></i>
            </span>
        </h3>
        <div class="history-content collapsed">
            <p>Total Recebido: R$ ${parseFloat(Object.values(item.results).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)).toFixed(2)}</p>
            <p class="profit">Lucro Total: R$ ${totalProfit.toFixed(2)}</p>
            <p class="loss">Perda Total: R$ ${totalLoss.toFixed(2)}</p>
            <div class="history-details">
                ${categoryDetails}
            </div>
        </div>
    </div>
`;
});
}

function toggleHistoryContent(header) {
header.classList.toggle('collapsed');
const content = header.nextElementSibling;
content.classList.toggle('collapsed');
const arrow = header.querySelector('.fa-chevron-down');
arrow.style.transform = content.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';
}

function toggleHistory() {
const historyContent = document.getElementById('history-content');
historyContent.classList.toggle('hidden');
const historyEmoji = document.querySelector('.history-emoji');
historyEmoji.textContent = historyContent.classList.contains('hidden') ? '📅' : '📆';
}

let itemToDelete = null; // Variável global para armazenar o item a ser excluído

function removeHistoryItem(event, index) {
event.stopPropagation(); // Impede que o evento de clique se propague para o toggleHistoryContent
itemToDelete = index; // Armazena o índice do item a ser excluído
document.getElementById('confirmationModal').style.display = 'flex'; // Exibe o modal
}

// Função para confirmar a exclusão
document.getElementById('confirmDelete').addEventListener('click', function () {
if (itemToDelete !== null) {
history.splice(itemToDelete, 1);
localStorage.setItem('financialHistory', JSON.stringify(history));
updateHistoryDisplay();
document.getElementById('confirmationModal').style.display = 'none'; // Esconde o modal
itemToDelete = null; // Reseta a variável
}
});

// Função para cancelar a exclusão
document.getElementById('cancelDelete').addEventListener('click', function () {
document.getElementById('confirmationModal').style.display = 'none'; // Esconde o modal
itemToDelete = null; // Reseta a variável
});


// Inicialização
updateSliders(0);
loadHistory();



document.addEventListener('DOMContentLoaded', function () {

const isPasswordSet = localStorage.getItem('isPasswordSet');


if (!isPasswordSet) {
document.getElementById('appLoginModal').style.display = 'flex';
}
});

const correctPassword = atob("c2VuaGExMjM="); 

document.getElementById('appLoginButton').addEventListener('click', function () {
const enteredPassword = document.getElementById('appPasswordInput').value;

if (enteredPassword === correctPassword) {

document.getElementById('appLoginModal').style.display = 'none';
localStorage.setItem('isPasswordSet', 'true'); 
} else {

const errorMessage = document.getElementById('appErrorMessage');
errorMessage.style.display = 'block';
errorMessage.textContent = 'Senha incorreta. Tente novamente.';
}
});


