// ============================================
// FINANCEIRO.JS - SISTEMA FINANCEIRO COMPLETO
// ============================================

// Módulo Financeiro Principal
const FinanceiroApp = {
    // Dados
    data: {
        transactions: [],
        bills: [],
        goals: [],
        categories: {
            income: ['Salário', 'Freelance', 'Investimentos', 'Outras Receitas'],
            expense: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outras Despesas'],
            investment: ['Ações', 'Fundos', 'Tesouro Direto', 'Criptomoedas', 'Outros Investimentos']
        },
        currentPeriod: 'month',
        filters: {
            type: 'all',
            dateFrom: null,
            dateTo: null,
            category: 'all'
        }
    },

    // Inicialização
    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.renderTransactions();
        this.renderBills();
        this.renderGoals();
        this.initCharts();
        console.log('Financeiro App inicializado');
    },

    // Carregar dados do localStorage
    loadData() {
        const savedData = DataManager.loadData('financeData', {});
        this.data = { ...this.data, ...savedData };

        // Inicializar arrays se não existirem
        if (!Array.isArray(this.data.transactions)) this.data.transactions = [];
        if (!Array.isArray(this.data.bills)) this.data.bills = [];
        if (!Array.isArray(this.data.goals)) this.data.goals = [];

        // Garantir que todas as transações tenham IDs
        this.data.transactions.forEach((t, i) => {
            if (!t.id) t.id = Utilities.generateId();
        });

        // Garantir que todas as contas tenham IDs
        this.data.bills.forEach((b, i) => {
            if (!b.id) b.id = Utilities.generateId();
        });

        // Garantir que todas as metas tenham IDs
        this.data.goals.forEach((g, i) => {
            if (!g.id) g.id = Utilities.generateId();
        });
    },

    // Salvar dados no localStorage
    saveData() {
        DataManager.saveData('financeData', {
            transactions: this.data.transactions,
            bills: this.data.bills,
            goals: this.data.goals
        });
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botões de adicionar transação
        document.getElementById('add-transaction-btn')?.addEventListener('click', () => this.showTransactionModal());
        document.getElementById('add-transaction-full')?.addEventListener('click', () => this.showTransactionModal());

        // Formulário de transação
        document.getElementById('transaction-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Filtros
        document.getElementById('apply-filters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filters')?.addEventListener('click', () => this.resetFilters());

        // Contas fixas
        document.getElementById('add-bill')?.addEventListener('click', () => this.showAddBillForm());
        document.getElementById('bill-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBill();
        });

        // Metas
        document.getElementById('add-goal')?.addEventListener('click', () => this.showAddGoalForm());
        document.getElementById('goal-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Relatórios
        document.getElementById('generate-report')?.addEventListener('click', () => this.generateReport());
        document.getElementById('export-report')?.addEventListener('click', () => this.exportReport());

        // Exportar dados financeiros
        document.getElementById('export-finance-data')?.addEventListener('click', () => this.exportFinanceData());

        // Backup financeiro
        document.getElementById('backup-finance')?.addEventListener('click', () => this.backupFinanceData());

        // Limpar dados financeiros
        document.getElementById('clear-finance-data')?.addEventListener('click', () => this.clearFinanceData());

        // Período
        document.getElementById('period-filter')?.addEventListener('change', (e) => {
            this.data.currentPeriod = e.target.value;
            this.renderDashboard();
        });
    },

    // ============ DASHBOARD ============
    renderDashboard() {
        this.updateStats();
        this.updateRecentTransactions();
        this.updateUpcomingBills();
        this.updateGoalsProgress();
    },

    updateStats() {
        const now = new Date();
        const periodData = this.getPeriodData(now, this.data.currentPeriod);

        let totalIncome = 0;
        let totalExpenses = 0;
        let totalInvestments = 0;

        periodData.transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else if (t.type === 'expense') totalExpenses += t.amount;
            else if (t.type === 'investment') totalInvestments += t.amount;
        });

        const balance = totalIncome - totalExpenses;

        // Atualizar estatísticas
        document.getElementById('current-balance').textContent = Utilities.formatCurrency(balance);
        document.getElementById('total-income').textContent = Utilities.formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = Utilities.formatCurrency(totalExpenses);
        document.getElementById('total-investments').textContent = Utilities.formatCurrency(totalInvestments);

        // Calcular mudanças (simulado para demonstração)
        const balanceChange = balance > 0 ? '+12.5%' : '-5.2%';
        const incomeChange = '+8.3%';
        const expensesChange = '-2.1%';
        const investmentsChange = '+15.7%';

        document.getElementById('balance-change').textContent = balanceChange;
        document.getElementById('income-change').textContent = incomeChange;
        document.getElementById('expenses-change').textContent = expensesChange;
        document.getElementById('investments-change').textContent = investmentsChange;

        // Atualizar classe das mudanças
        const balanceElem = document.getElementById('balance-change');
        const incomeElem = document.getElementById('income-change');
        const expensesElem = document.getElementById('expenses-change');
        const investmentsElem = document.getElementById('investments-change');

        balanceElem.className = balance >= 0 ? 'stat-change positive' : 'stat-change negative';
        incomeElem.className = 'stat-change positive';
        expensesElem.className = 'stat-change negative';
        investmentsElem.className = 'stat-change positive';
    },

    updateRecentTransactions() {
        const container = document.getElementById('dashboard-transactions');
        if (!container) return;

        const recentTransactions = this.data.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>Nenhuma transação recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(t => `
            <div class="list-item ${t.type}">
                <div>
                    <strong>${t.description}</strong>
                    <div class="text-sm text-muted">${Utilities.formatDate(t.date)}</div>
                </div>
                <div class="${t.type === 'income' ? 'positive' : 'negative'}">
                    ${t.type === 'income' ? '+' : '-'}${Utilities.formatCurrency(t.amount)}
                </div>
            </div>
        `).join('');
    },

    updateUpcomingBills() {
        const container = document.getElementById('upcoming-bills');
        if (!container) return;

        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        const upcomingBills = this.data.bills
            .filter(bill => {
                const dueDate = new Date(bill.dueDate);
                return dueDate >= now && dueDate <= nextWeek && !bill.paid;
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        if (upcomingBills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <p>Nenhuma conta próxima do vencimento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingBills.map(bill => `
            <div class="list-item">
                <div>
                    <strong>${bill.description}</strong>
                    <div class="text-sm text-muted">Vence em ${Utilities.formatDate(bill.dueDate)}</div>
                </div>
                <div class="negative">
                    ${Utilities.formatCurrency(bill.amount)}
                </div>
            </div>
        `).join('');
    },

    updateGoalsProgress() {
        const container = document.getElementById('goals-progress');
        if (!container) return;

        const activeGoals = this.data.goals.filter(g => !g.completed).slice(0, 3);

        if (activeGoals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>Nenhuma meta definida</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeGoals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            return `
                <div class="goal-progress-item">
                    <div class="flex justify-between mb-1">
                        <strong>${goal.title}</strong>
                        <span>${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="text-sm text-muted mt-1">
                        ${Utilities.formatCurrency(goal.current)} / ${Utilities.formatCurrency(goal.target)}
                    </div>
                </div>
            `;
        }).join('');
    },

    // ============ TRANSAÇÕES ============
    showTransactionModal(transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('transaction-modal-title');

        if (transaction) {
            title.textContent = 'Editar Transação';
            // Preencher formulário com dados da transação
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-description').value = transaction.description;
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-date').value = transaction.date.split('T')[0];
            document.getElementById('transaction-category-modal').value = transaction.category;
            document.getElementById('transaction-payment-method').value = transaction.paymentMethod || 'cash';
            document.getElementById('transaction-notes').value = transaction.notes || '';
            
            // Armazenar ID da transação para edição
            form.dataset.editingId = transaction.id;
        } else {
            title.textContent = 'Nova Transação';
            form.reset();
            delete form.dataset.editingId;
            document.getElementById('transaction-date').valueAsDate = new Date();
        }

        // Popular categorias
        this.populateCategories();

        ModalSystem.open('transaction-modal');
    },

    populateCategories() {
        const typeSelect = document.getElementById('transaction-type');
        const categorySelect = document.getElementById('transaction-category-modal');
        
        if (!typeSelect || !categorySelect) return;

        const updateCategories = () => {
            const type = typeSelect.value;
            const categories = this.data.categories[type] || [];
            
            categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.toLowerCase().replace(/\s+/g, '-');
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        };

        typeSelect.addEventListener('change', updateCategories);
        updateCategories();
    },

    saveTransaction() {
        const form = document.getElementById('transaction-form');
        const isEditing = form.dataset.editingId;

        const transaction = {
            id: isEditing || Utilities.generateId(),
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('transaction-description').value.trim(),
            amount: parseFloat(document.getElementById('transaction-amount').value),
            date: document.getElementById('transaction-date').value,
            category: document.getElementById('transaction-category-modal').value,
            paymentMethod: document.getElementById('transaction-payment-method').value,
            notes: document.getElementById('transaction-notes').value.trim(),
            createdAt: isEditing ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!transaction.description || !transaction.amount || !transaction.type || !transaction.category) {
            NotificationSystem.show('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (isEditing) {
            // Atualizar transação existente
            const index = this.data.transactions.findIndex(t => t.id === isEditing);
            if (index !== -1) {
                this.data.transactions[index] = { ...this.data.transactions[index], ...transaction };
            }
        } else {
            // Adicionar nova transação
            this.data.transactions.push(transaction);
        }

        this.saveData();
        this.renderDashboard();
        this.renderTransactions();
        ModalSystem.closeAll();

        NotificationSystem.show(
            `Transação ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`,
            'success'
        );
    },

    renderTransactions() {
        const tbody = document.getElementById('transactions-body');
        const totalElement = document.getElementById('transactions-total');
        const incomeTotalElement = document.getElementById('income-total');
        const expenseTotalElement = document.getElementById('expense-total');

        if (!tbody) return;

        // Aplicar filtros
        const filteredTransactions = this.filterTransactions();

        if (filteredTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="empty-state">
                            <i class="fas fa-exchange-alt"></i>
                            <p>Nenhuma transação encontrada</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Calcular totais
        let total = 0;
        let incomeTotal = 0;
        let expenseTotal = 0;

        filteredTransactions.forEach(t => {
            total += t.type === 'income' ? t.amount : -t.amount;
            if (t.type === 'income') incomeTotal += t.amount;
            if (t.type === 'expense') expenseTotal += t.amount;
        });

        // Atualizar totais
        if (totalElement) totalElement.textContent = Utilities.formatCurrency(total);
        if (incomeTotalElement) incomeTotalElement.textContent = Utilities.formatCurrency(incomeTotal);
        if (expenseTotalElement) expenseTotalElement.textContent = Utilities.formatCurrency(expenseTotal);

        // Renderizar transações
        tbody.innerHTML = filteredTransactions.map(t => {
            const categoryLabel = this.getCategoryLabel(t.category);
            const typeLabel = this.getTypeLabel(t.type);
            const typeClass = t.type === 'income' ? 'positive' : t.type === 'expense' ? 'negative' : 'info';

            return `
                <tr>
                    <td>${Utilities.formatDate(t.date)}</td>
                    <td>
                        <div class="font-medium">${t.description}</div>
                        ${t.notes ? `<div class="text-sm text-muted">${t.notes}</div>` : ''}
                    </td>
                    <td><span class="category-tag category-${t.category}">${categoryLabel}</span></td>
                    <td><span class="${typeClass}">${typeLabel}</span></td>
                    <td class="${typeClass} font-medium">
                        ${t.type === 'income' ? '+' : '-'}${Utilities.formatCurrency(t.amount)}
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <button class="btn-icon btn-sm" onclick="FinanceiroApp.editTransaction('${t.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-sm btn-danger" onclick="FinanceiroApp.deleteTransaction('${t.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    filterTransactions() {
        let filtered = [...this.data.transactions];

        // Filtrar por tipo
        if (this.data.filters.type !== 'all') {
            filtered = filtered.filter(t => t.type === this.data.filters.type);
        }

        // Filtrar por data
        if (this.data.filters.dateFrom) {
            const fromDate = new Date(this.data.filters.dateFrom);
            filtered = filtered.filter(t => new Date(t.date) >= fromDate);
        }

        if (this.data.filters.dateTo) {
            const toDate = new Date(this.data.filters.dateTo);
            filtered = filtered.filter(t => new Date(t.date) <= toDate);
        }

        // Filtrar por categoria
        if (this.data.filters.category !== 'all') {
            filtered = filtered.filter(t => t.category === this.data.filters.category);
        }

        // Ordenar por data (mais recente primeiro)
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    applyFilters() {
        this.data.filters = {
            type: document.getElementById('transaction-type-filter').value,
            dateFrom: document.getElementById('transaction-date-from').value || null,
            dateTo: document.getElementById('transaction-date-to').value || null,
            category: document.getElementById('transaction-category').value
        };

        this.renderTransactions();
        NotificationSystem.show('Filtros aplicados', 'success');
    },

    resetFilters() {
        document.getElementById('transaction-type-filter').value = 'all';
        document.getElementById('transaction-date-from').value = '';
        document.getElementById('transaction-date-to').value = '';
        document.getElementById('transaction-category').value = 'all';

        this.data.filters = {
            type: 'all',
            dateFrom: null,
            dateTo: null,
            category: 'all'
        };

        this.renderTransactions();
        NotificationSystem.show('Filtros resetados', 'info');
    },

    editTransaction(id) {
        const transaction = this.data.transactions.find(t => t.id === id);
        if (transaction) {
            this.showTransactionModal(transaction);
        }
    },

    deleteTransaction(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.data.transactions = this.data.transactions.filter(t => t.id !== id);
            this.saveData();
            this.renderDashboard();
            this.renderTransactions();
            NotificationSystem.show('Transação excluída com sucesso!', 'success');
        }
    },

    // ============ CONTAS FIXAS ============
    renderBills() {
        const currentMonthContainer = document.getElementById('current-month-bills');
        const upcomingContainer = document.getElementById('upcoming-bills-full');

        if (currentMonthContainer) {
            this.renderCurrentMonthBills(currentMonthContainer);
        }

        if (upcomingContainer) {
            this.renderUpcomingBills(upcomingContainer);
        }
    },

    renderCurrentMonthBills(container) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthBills = this.data.bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate.getMonth() === currentMonth && 
                   dueDate.getFullYear() === currentYear;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (currentMonthBills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <p>Nenhuma conta para este mês</p>
                </div>
            `;
            return;
        }

        container.innerHTML = currentMonthBills.map(bill => {
            const dueDate = new Date(bill.dueDate);
            const isOverdue = dueDate < now && !bill.paid;
            const statusClass = bill.paid ? 'paid' : isOverdue ? 'overdue' : 'pending';
            const statusText = bill.paid ? 'Paga' : isOverdue ? 'Atrasada' : 'Pendente';

            return `
                <div class="bill-card ${statusClass}">
                    <div class="bill-header">
                        <div class="bill-title">${bill.description}</div>
                        <div class="bill-amount">${Utilities.formatCurrency(bill.amount)}</div>
                    </div>
                    <div class="bill-details">
                        <div class="bill-due-date">
                            Vence em ${Utilities.formatDate(bill.dueDate, 'day-month')}
                        </div>
                        <div class="bill-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button class="btn btn-sm ${bill.paid ? 'btn-secondary' : 'btn-success'}" 
                                onclick="FinanceiroApp.toggleBillStatus('${bill.id}')">
                            ${bill.paid ? 'Marcar como Pendente' : 'Marcar como Paga'}
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="FinanceiroApp.deleteBill('${bill.id}')">
                            Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderUpcomingBills(container) {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);

        const upcomingBills = this.data.bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return dueDate > now && dueDate <= nextMonth && !bill.paid;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (upcomingBills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Nenhuma conta próxima do vencimento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingBills.map(bill => {
            const dueDate = new Date(bill.dueDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            return `
                <div class="bill-card">
                    <div class="bill-header">
                        <div class="bill-title">${bill.description}</div>
                        <div class="bill-amount">${Utilities.formatCurrency(bill.amount)}</div>
                    </div>
                    <div class="bill-details">
                        <div class="bill-due-date">
                            Vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? 's' : ''}
                        </div>
                        <div class="bill-status pending">Pendente</div>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button class="btn btn-sm btn-success" 
                                onclick="FinanceiroApp.toggleBillStatus('${bill.id}')">
                            Marcar como Paga
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    showAddBillForm() {
        const form = document.getElementById('bill-form');
        form.reset();
        document.getElementById('bill-due-date').valueAsDate = new Date();
        delete form.dataset.editingId;
    },

    saveBill() {
        const form = document.getElementById('bill-form');
        const isEditing = form.dataset.editingId;

        const bill = {
            id: isEditing || Utilities.generateId(),
            description: document.getElementById('bill-description').value.trim(),
            amount: parseFloat(document.getElementById('bill-amount').value),
            dueDate: document.getElementById('bill-due-date').value,
            category: document.getElementById('bill-category').value,
            recurrence: document.getElementById('bill-recurrence').value,
            paid: false,
            createdAt: new Date().toISOString()
        };

        if (!bill.description || !bill.amount || !bill.dueDate) {
            NotificationSystem.show('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (isEditing) {
            const index = this.data.bills.findIndex(b => b.id === isEditing);
            if (index !== -1) {
                this.data.bills[index] = { ...this.data.bills[index], ...bill };
            }
        } else {
            this.data.bills.push(bill);
        }

        this.saveData();
        this.renderDashboard();
        this.renderBills();
        form.reset();

        NotificationSystem.show(
            `Conta ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`,
            'success'
        );
    },

    toggleBillStatus(id) {
        const bill = this.data.bills.find(b => b.id === id);
        if (bill) {
            bill.paid = !bill.paid;
            this.saveData();
            this.renderDashboard();
            this.renderBills();
            NotificationSystem.show(
                `Conta marcada como ${bill.paid ? 'paga' : 'pendente'}`,
                'success'
            );
        }
    },

    deleteBill(id) {
        if (confirm('Tem certeza que deseja excluir esta conta?')) {
            this.data.bills = this.data.bills.filter(b => b.id !== id);
            this.saveData();
            this.renderDashboard();
            this.renderBills();
            NotificationSystem.show('Conta excluída com sucesso!', 'success');
        }
    },

    // ============ METAS ============
    renderGoals() {
        const container = document.getElementById('goals-grid');
        if (!container) return;

        const activeGoals = this.data.goals.filter(g => !g.completed);

        if (activeGoals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>Nenhuma meta ativa</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeGoals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            const daysRemaining = goal.deadline ? 
                Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-title">${goal.title}</div>
                        <div class="goal-priority ${goal.priority}">
                            ${this.getPriorityLabel(goal.priority)}
                        </div>
                    </div>
                    
                    <div class="goal-progress mt-3">
                        <div class="progress-info">
                            <span class="progress-amount">
                                ${Utilities.formatCurrency(goal.current)} / ${Utilities.formatCurrency(goal.target)}
                            </span>
                            <span class="progress-percentage">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="goal-footer">
                        <div class="goal-category">
                            ${this.getCategoryLabel(goal.category)}
                        </div>
                        <div class="goal-deadline">
                            ${daysRemaining !== null ? `
                                <i class="far fa-calendar"></i>
                                <span>${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}</span>
                            ` : 'Sem prazo'}
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mt-3">
                        <button class="btn btn-sm btn-primary" 
                                onclick="FinanceiroApp.updateGoalProgress('${goal.id}')">
                            Atualizar Progresso
                        </button>
                        <button class="btn btn-sm btn-success" 
                                onclick="FinanceiroApp.completeGoal('${goal.id}')">
                            Concluir
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="FinanceiroApp.deleteGoal('${goal.id}')">
                            Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    showAddGoalForm() {
        const form = document.getElementById('goal-form');
        form.reset();
        delete form.dataset.editingId;
    },

    saveGoal() {
        const form = document.getElementById('goal-form');
        const isEditing = form.dataset.editingId;

        const goal = {
            id: isEditing || Utilities.generateId(),
            title: document.getElementById('goal-title').value.trim(),
            target: parseFloat(document.getElementById('goal-target').value),
            current: parseFloat(document.getElementById('goal-current').value) || 0,
            deadline: document.getElementById('goal-deadline').value || null,
            category: document.getElementById('goal-category').value,
            priority: document.getElementById('goal-priority').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!goal.title || !goal.target) {
            NotificationSystem.show('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (goal.current > goal.target) {
            goal.current = goal.target;
        }

        if (isEditing) {
            const index = this.data.goals.findIndex(g => g.id === isEditing);
            if (index !== -1) {
                this.data.goals[index] = { ...this.data.goals[index], ...goal };
            }
        } else {
            this.data.goals.push(goal);
        }

        this.saveData();
        this.renderDashboard();
        this.renderGoals();
        form.reset();

        NotificationSystem.show(
            `Meta ${isEditing ? 'atualizada' : 'criada'} com sucesso!`,
            'success'
        );
    },

    updateGoalProgress(id) {
        const goal = this.data.goals.find(g => g.id === id);
        if (!goal) return;

        const newCurrent = prompt(
            `Atualizar progresso para "${goal.title}":\nValor atual: ${Utilities.formatCurrency(goal.current)}\nValor alvo: ${Utilities.formatCurrency(goal.target)}`,
            goal.current
        );

        if (newCurrent !== null) {
            const amount = parseFloat(newCurrent);
            if (!isNaN(amount)) {
                goal.current = Math.min(Math.max(0, amount), goal.target);
                goal.updatedAt = new Date().toISOString();
                this.saveData();
                this.renderDashboard();
                this.renderGoals();
                NotificationSystem.show('Progresso atualizado!', 'success');
            }
        }
    },

    completeGoal(id) {
        if (confirm('Tem certeza que deseja marcar esta meta como concluída?')) {
            const goal = this.data.goals.find(g => g.id === id);
            if (goal) {
                goal.completed = true;
                goal.completedAt = new Date().toISOString();
                this.saveData();
                this.renderDashboard();
                this.renderGoals();
                NotificationSystem.show('Meta concluída! Parabéns! 🎉', 'success');
            }
        }
    },

    deleteGoal(id) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            this.data.goals = this.data.goals.filter(g => g.id !== id);
            this.saveData();
            this.renderDashboard();
            this.renderGoals();
            NotificationSystem.show('Meta excluída!', 'success');
        }
    },

    // ============ RELATÓRIOS ============
    generateReport() {
        const reportType = document.getElementById('report-type').value;
        const period = document.getElementById('report-period').value;
        const format = document.getElementById('report-format').value;

        const now = new Date();
        const periodData = this.getPeriodData(now, period);

        let reportData = {};
        let insights = [];

        switch (reportType) {
            case 'expense-analysis':
                reportData = this.analyzeExpenses(periodData.transactions);
                insights = this.generateExpenseInsights(reportData);
                break;
            case 'income-analysis':
                reportData = this.analyzeIncome(periodData.transactions);
                insights = this.generateIncomeInsights(reportData);
                break;
            case 'monthly-summary':
                reportData = this.generateMonthlySummary(periodData.transactions);
                insights = this.generateMonthlyInsights(reportData);
                break;
            case 'category-breakdown':
                reportData = this.analyzeCategories(periodData.transactions);
                insights = this.generateCategoryInsights(reportData);
                break;
        }

        this.renderReport(reportData, insights, format);
        NotificationSystem.show('Relatório gerado com sucesso!', 'success');
    },

    analyzeExpenses(transactions) {
        const expenses = transactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((sum, t) => sum + t.amount, 0);

        const byCategory = {};
        expenses.forEach(t => {
            const category = t.category || 'other';
            if (!byCategory[category]) {
                byCategory[category] = { amount: 0, count: 0 };
            }
            byCategory[category].amount += t.amount;
            byCategory[category].count++;
        });

        return {
            total,
            byCategory,
            average: expenses.length > 0 ? total / expenses.length : 0,
            count: expenses.length
        };
    },

    generateExpenseInsights(data) {
        const insights = [];
        
        if (data.total === 0) {
            insights.push({
                title: 'Sem Despesas',
                message: 'Nenhuma despesa registrada neste período.'
            });
            return insights;
        }

        // Encontrar categoria com maior gasto
        let maxCategory = null;
        let maxAmount = 0;
        
        Object.entries(data.byCategory).forEach(([category, info]) => {
            if (info.amount > maxAmount) {
                maxAmount = info.amount;
                maxCategory = category;
            }
        });

        if (maxCategory) {
            const percentage = (maxAmount / data.total) * 100;
            insights.push({
                title: 'Maior Gasto',
                message: `${this.getCategoryLabel(maxCategory)} representa ${percentage.toFixed(1)}% do total de despesas.`
            });
        }

        // Insight sobre média diária
        const dailyAverage = data.total / 30; // Aproximação
        insights.push({
            title: 'Média Diária',
            message: `Você gastou em média ${Utilities.formatCurrency(dailyAverage)} por dia.`
        });

        return insights;
    },

    renderReport(data, insights, format) {
        const chartCanvas = document.getElementById('reportChart');
        const tableBody = document.getElementById('report-data-body');
        const insightsContainer = document.getElementById('report-insights');

        // Limpar conteúdo anterior
        if (tableBody) tableBody.innerHTML = '';
        if (insightsContainer) insightsContainer.innerHTML = '';

        // Renderizar insights
        if (insightsContainer && insights.length > 0) {
            insightsContainer.innerHTML = insights.map(insight => `
                <div class="insight-item">
                    <div class="insight-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="insight-content">
                        <h5>${insight.title}</h5>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('');
        }

        // Renderizar tabela
        if (tableBody && data.byCategory) {
            const categories = Object.entries(data.byCategory)
                .sort(([, a], [, b]) => b.amount - a.amount);

            tableBody.innerHTML = categories.map(([category, info]) => {
                const percentage = data.total > 0 ? (info.amount / data.total) * 100 : 0;
                const trend = percentage > 20 ? '↑ Alta' : percentage > 5 ? '→ Média' : '↓ Baixa';
                
                return `
                    <tr>
                        <td>${this.getCategoryLabel(category)}</td>
                        <td>${Utilities.formatCurrency(info.amount)}</td>
                        <td>${percentage.toFixed(1)}%</td>
                        <td>${trend}</td>
                    </tr>
                `;
            }).join('');
        }

        // Renderizar gráfico se necessário
        if (chartCanvas && (format === 'chart' || format === 'both') && data.byCategory) {
            this.renderChart(data);
        }
    },

    renderChart(data) {
        const ctx = document.getElementById('reportChart').getContext('2d');
        
        const categories = Object.keys(data.byCategory);
        const amounts = categories.map(cat => data.byCategory[cat].amount);
        const colors = this.getCategoryColors(categories);

        // Destruir gráfico anterior se existir
        if (window.reportChart) {
            window.reportChart.destroy();
        }

        window.reportChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories.map(cat => this.getCategoryLabel(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderColor: 'var(--bg-primary)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'var(--text-primary)',
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${Utilities.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    exportReport() {
        const table = document.getElementById('report-data-table');
        if (!table) return;

        let csv = [];
        const rows = table.querySelectorAll('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                row.push(cols[j].innerText);
            }
            
            csv.push(row.join(','));
        }

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.setAttribute('href', url);
        a.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
        a.click();

        NotificationSystem.show('Relatório exportado como CSV!', 'success');
    },

    // ============ FUNÇÕES UTILITÁRIAS ============
    getPeriodData(date, period) {
        const now = new Date(date);
        let startDate, endDate;

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last-month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        const transactions = this.data.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        return { startDate, endDate, transactions };
    },

    getCategoryLabel(category) {
        const labels = {
            'housing': 'Moradia',
            'utilities': 'Utilidades',
            'transport': 'Transporte',
            'food': 'Alimentação',
            'health': 'Saúde',
            'education': 'Educação',
            'entertainment': 'Entretenimento',
            'other': 'Outro',
            'salário': 'Salário',
            'freelance': 'Freelance',
            'investimentos': 'Investimentos',
            'outras-receitas': 'Outras Receitas',
            'alimentação': 'Alimentação',
            'moradia': 'Moradia',
            'transporte': 'Transporte',
            'saúde': 'Saúde',
            'educação': 'Educação',
            'lazer': 'Lazer',
            'outras-despesas': 'Outras Despesas',
            'ações': 'Ações',
            'fundos': 'Fundos',
            'tesouro-direto': 'Tesouro Direto',
            'criptomoedas': 'Criptomoedas',
            'outros-investimentos': 'Outros Investimentos'
        };
        return labels[category] || category;
    },

    getTypeLabel(type) {
        const labels = {
            'income': 'Receita',
            'expense': 'Despesa',
            'investment': 'Investimento'
        };
        return labels[type] || type;
    },

    getPriorityLabel(priority) {
        const labels = {
            'high': 'Alta',
            'medium': 'Média',
            'low': 'Baixa'
        };
        return labels[priority] || priority;
    },

    getCategoryColors(categories) {
        const colorMap = {
            'housing': '#9b59b6',
            'utilities': '#3498db',
            'transport': '#f1c40f',
            'food': '#2ecc71',
            'health': '#e74c3c',
            'education': '#34495e',
            'entertainment': '#e67e22',
            'other': '#95a5a6',
            'salário': '#27ae60',
            'freelance': '#2980b9',
            'investimentos': '#8e44ad',
            'outras-receitas': '#16a085'
        };

        return categories.map(cat => colorMap[cat] || `#${Math.floor(Math.random()*16777215).toString(16)}`);
    },

    initCharts() {
        // Inicializar gráfico de despesas se existir
        const expenseChartCanvas = document.getElementById('expenseChart');
        if (expenseChartCanvas) {
            this.initExpenseChart();
        }
    },

    initExpenseChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const now = new Date();
        const periodData = this.getPeriodData(now, 'month');
        const expenseData = this.analyzeExpenses(periodData.transactions);

        const categories = Object.keys(expenseData.byCategory);
        const amounts = categories.map(cat => expenseData.byCategory[cat].amount);
        const colors = this.getCategoryColors(categories);

        // Atualizar legenda
        const legendContainer = document.getElementById('expense-legend');
        if (legendContainer) {
            legendContainer.innerHTML = categories.map((cat, i) => `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${colors[i]}"></span>
                    <span>${this.getCategoryLabel(cat)}</span>
                </div>
            `).join('');
        }

        // Criar gráfico
        if (window.expenseChart) {
            window.expenseChart.destroy();
        }

        window.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.getCategoryLabel(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: colors,
                    borderColor: 'var(--bg-primary)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${Utilities.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // ============ EXPORTAÇÃO E BACKUP ============
    exportFinanceData() {
        const exportData = {
            transactions: this.data.transactions,
            bills: this.data.bills,
            goals: this.data.goals,
            exportDate: new Date().toISOString(),
            version: AppConfig.version
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `dados_financeiros_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        NotificationSystem.show('Dados financeiros exportados com sucesso!', 'success');
    },

    backupFinanceData() {
        this.saveData();
        NotificationSystem.show('Backup financeiro criado com sucesso!', 'success');
    },

    clearFinanceData() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados financeiros? Esta ação não pode ser desfeita.')) {
            DataManager.clearData('financeData');
            this.data.transactions = [];
            this.data.bills = [];
            this.data.goals = [];
            this.renderDashboard();
            this.renderTransactions();
            this.renderBills();
            this.renderGoals();
            NotificationSystem.show('Todos os dados financeiros foram limpos', 'success');
        }
    }
};

// Inicializar quando o DOM estiver carregado
if (document.querySelector('.financeiro-app')) {
    document.addEventListener('DOMContentLoaded', () => {
        FinanceiroApp.init();
    });
}

// Exportar para uso global
window.FinanceiroApp = FinanceiroApp;