// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionTypeInput = document.getElementById('transaction-type');
const transactionDateInput = document.getElementById('transaction-date');
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionCategoryInput = document.getElementById('transaction-category');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionList = document.getElementById('transaction-list');
const totalIncomeElement = document.getElementById('total-income');
const totalExpensesElement = document.getElementById('total-expenses');
const balanceElement = document.getElementById('balance');
const filterCategorySelect = document.getElementById('filter-category');
const expenseChart = document.getElementById('expense-chart');
const currencySymbolSelect = document.getElementById('currency-symbol');

let transactions = [];
let chart = null;
let currencySymbol = '$';

function init() {
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today;
    
    loadTransactions();
    
    loadCurrencySymbol();
    
    updateCategoryOptions();
    
    updateFilterOptions();
    
    transactionForm.addEventListener('submit', handleFormSubmit);
    transactionTypeInput.addEventListener('change', updateCategoryOptions);
    filterCategorySelect.addEventListener('change', renderTransactionList);
    currencySymbolSelect.addEventListener('change', handleCurrencyChange);
    
    renderTransactionList();
    updateSummary();
    renderChart();
}

function loadTransactions() {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadCurrencySymbol() {
    const savedCurrencySymbol = localStorage.getItem('currencySymbol');
    if (savedCurrencySymbol) {
        currencySymbol = savedCurrencySymbol;
        currencySymbolSelect.value = currencySymbol;
    }
}

function saveCurrencySymbol() {
    localStorage.setItem('currencySymbol', currencySymbol);
}

function handleCurrencyChange() {
    currencySymbol = currencySymbolSelect.value;
    saveCurrencySymbol();
    updateSummary();
    renderTransactionList();
}

function updateCategoryOptions() {
    const transactionType = transactionTypeInput.value;
    const incomeCategories = document.querySelector('.income-categories');
    const expenseCategories = document.querySelector('.expense-categories');
    
    if (transactionType === 'income') {
        incomeCategories.style.display = 'block';
        expenseCategories.style.display = 'none';
        transactionCategoryInput.value = 'Salary';
    } else {
        incomeCategories.style.display = 'none';
        expenseCategories.style.display = 'block';
        transactionCategoryInput.value = 'Food';
    }
}

function updateFilterOptions() {
    while (filterCategorySelect.options.length > 1) {
        filterCategorySelect.remove(1);
    }
    
    const categories = [...new Set(transactions.map(transaction => transaction.category))];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategorySelect.appendChild(option);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!transactionForm.checkValidity()) {
        return;
    }
    
    const type = transactionTypeInput.value;
    const date = transactionDateInput.value;
    const description = transactionDescriptionInput.value;
    const category = transactionCategoryInput.value;
    const amount = parseFloat(transactionAmountInput.value);
    
    const newTransaction = {
        id: Date.now(),
        type,
        date,
        description,
        category,
        amount,
    };
    
    transactions.push(newTransaction);
    
    saveTransactions();
    
    renderTransactionList();
    updateSummary();
    updateFilterOptions();
    renderChart();
    
    transactionForm.reset();
    
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today;
    
    updateCategoryOptions();
}

function renderTransactionList() {
    transactionList.innerHTML = '';
    
    const filterCategory = filterCategorySelect.value;
    
    let filteredTransactions = transactions;
    if (filterCategory !== 'all') {
        filteredTransactions = transactions.filter(transaction => transaction.category === filterCategory);
    }
    
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredTransactions.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = filterCategory === 'all' 
            ? 'No transactions yet. Add a transaction to get started!' 
            : `No transactions found in the "${filterCategory}" category.`;
        transactionList.appendChild(emptyMessage);
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.dataset.id = transaction.id;
        
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const formattedAmount = transaction.amount.toFixed(2);
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-description">${transaction.description}</div>
                <span class="transaction-category ${transaction.type}-category">${transaction.category}</span>
            </div>
            <div class="transaction-amount ${transaction.type}-amount">
                ${transaction.type === 'income' ? '+' : '-'}${currencySymbol}${formattedAmount}
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        const editBtn = transactionItem.querySelector('.edit-btn');
        const deleteBtn = transactionItem.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => editTransaction(transaction.id));
        deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
        
        transactionList.appendChild(transactionItem);
    });
}

function editTransaction(id) {
    // Find transaction
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    transactionTypeInput.value = transaction.type;
    transactionDateInput.value = transaction.date;
    transactionDescriptionInput.value = transaction.description;
    updateCategoryOptions();
    transactionCategoryInput.value = transaction.category;
    transactionAmountInput.value = transaction.amount;
    
    deleteTransaction(id, false);
    
    transactionForm.scrollIntoView({ behavior: 'smooth' });
}

function deleteTransaction(id, updateUI = true) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    
    saveTransactions();
    
    if (updateUI) {
        renderTransactionList();
        updateSummary();
        updateFilterOptions();
        renderChart();
    }
}

function updateSummary() {
    const totalIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0);
    
    const totalExpenses = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    totalIncomeElement.textContent = `${currencySymbol}${totalIncome.toFixed(2)}`;
    totalExpensesElement.textContent = `${currencySymbol}${totalExpenses.toFixed(2)}`;
    balanceElement.textContent = `${currencySymbol}${balance.toFixed(2)}`;
    
    if (balance > 0) {
        balanceElement.style.color = 'var(--income-color)';
    } else if (balance < 0) {
        balanceElement.style.color = 'var(--expense-color)';
    } else {
        balanceElement.style.color = 'var(--primary-color)';
    }
}

function renderChart() {
    if (chart) {
        chart.destroy();
    }
    
    const expensesByCategory = {};
    transactions
        .filter(transaction => transaction.type === 'expense')
        .forEach(transaction => {
            if (expensesByCategory[transaction.category]) {
                expensesByCategory[transaction.category] += transaction.amount;
            } else {
                expensesByCategory[transaction.category] = transaction.amount;
            }
        });
    
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    
    const colors = categories.map((_, index) => {
        const hue = (index * 30) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    });
    
    if (categories.length > 0) {
        chart = new Chart(expenseChart, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${currencySymbol}${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        const ctx = expenseChart.getContext('2d');
        ctx.clearRect(0, 0, expenseChart.width, expenseChart.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#777';
        ctx.fillText('No expense data available', expenseChart.width / 2, expenseChart.height / 2);
    }
}

document.addEventListener('DOMContentLoaded', init); 