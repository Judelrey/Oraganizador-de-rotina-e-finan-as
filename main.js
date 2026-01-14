// ============================================
// MAIN.JS - GLOBAL FUNCTIONS
// ============================================

// Configuração Global
const AppConfig = {
    version: '2.0.0',
    storageKey: 'organizadorPessoal',
    maxStorageSize: 5 * 1024 * 1024, // 5MB
    theme: 'light'
};

// Classe utilitária para manipulação de dados
class DataManager {
    static saveData(key, data) {
        try {
            localStorage.setItem(`${AppConfig.storageKey}_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar dados (${key}):`, error);
            this.showNotification('Erro ao salvar dados', 'error');
            return false;
        }
    }

    static loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`${AppConfig.storageKey}_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Erro ao carregar dados (${key}):`, error);
            return defaultValue;
        }
    }

    static clearData(key) {
        localStorage.removeItem(`${AppConfig.storageKey}_${key}`);
    }

    static clearAllData() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(AppConfig.storageKey)) {
                localStorage.removeItem(key);
            }
        });
    }

    static getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // UTF-16
            }
        }
        return total;
    }

    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Sistema de Notificações
class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.app-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `app-notification notification-${type}`;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background-color: ${this.getColor(type)};
            color: white;
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            z-index: var(--z-tooltip);
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        // Adicionar estilos CSS para animação
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    margin-left: 1rem;
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }

        // Adicionar evento para fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });

        document.body.appendChild(notification);

        // Auto-remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);

        return notification;
    }

    static getIcon(type) {
        const icons = {
            'success': 'fas fa-check-circle',
            'error': 'fas fa-exclamation-circle',
            'warning': 'fas fa-exclamation-triangle',
            'info': 'fas fa-info-circle'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    static getColor(type) {
        const colors = {
            'success': '#2ecc71',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        return colors[type] || '#3498db';
    }
}

// Sistema de Tema
class ThemeManager {
    static init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.updateThemeButton(savedTheme);
        this.setupThemeToggle();
    }

    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        AppConfig.theme = theme;
    }

    static toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.updateThemeButton(newTheme);
        NotificationSystem.show(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
    }

    static updateThemeButton(theme) {
        const themeButtons = document.querySelectorAll('#theme-toggle, #finance-theme-toggle');
        themeButtons.forEach(button => {
            if (button) {
                const icon = button.querySelector('i');
                const text = button.querySelector('span');
                
                if (theme === 'dark') {
                    icon.className = 'fas fa-sun';
                    text.textContent = 'Tema Claro';
                } else {
                    icon.className = 'fas fa-moon';
                    text.textContent = 'Tema Escuro';
                }
            }
        });
    }

    static setupThemeToggle() {
        const themeButtons = document.querySelectorAll('#theme-toggle, #finance-theme-toggle');
        themeButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => this.toggleTheme());
            }
        });
    }
}

// Sistema de Abas
class TabSystem {
    static init() {
        // Configurar abas de navegação
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Configurar links que alternam abas
        document.querySelectorAll('[data-tab]').forEach(link => {
            if (link.classList.contains('nav-tab')) return;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    static switchTab(tabId) {
        // Encontrar o container de seções
        const container = document.querySelector('.content-sections');
        if (!container) return;

        // Atualizar navegação
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Atualizar conteúdo
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        // Atualizar título da página se existir
        const titleMap = {
            'financial-dashboard': 'Dashboard Financeiro',
            'financial-transactions': 'Transações',
            'financial-bills': 'Contas Fixas',
            'financial-goals': 'Metas',
            'financial-reports': 'Relatórios',
            'study-weekly': 'Grade Semanal',
            'study-notes': 'Anotações',
            'study-files': 'Arquivos',
            'study-calendar': 'Calendário'
        };

        const subtitleMap = {
            'financial-dashboard': 'Visão geral das suas finanças',
            'financial-transactions': 'Registre e acompanhe todas as suas movimentações',
            'financial-bills': 'Gerencie suas contas recorrentes e vencimentos',
            'financial-goals': 'Defina e acompanhe seus objetivos financeiros',
            'financial-reports': 'Análises detalhadas e insights sobre suas finanças',
            'study-weekly': 'Organize suas sessões de estudo por dia da semana',
            'study-notes': 'Guarde ideias e informações importantes',
            'study-files': 'Armazene materiais de estudo, PDFs e documentos',
            'study-calendar': 'Visualize todos seus compromissos em um calendário'
        };

        const titleElement = document.getElementById('finance-page-title') || 
                            document.getElementById('current-page-title');
        const subtitleElement = document.getElementById('finance-page-subtitle') || 
                               document.getElementById('current-page-subtitle');

        if (titleElement && titleMap[tabId]) {
            titleElement.textContent = titleMap[tabId];
        }
        if (subtitleElement && subtitleMap[tabId]) {
            subtitleElement.textContent = subtitleMap[tabId];
        }
    }
}

// Sistema de Modais
class ModalSystem {
    static init() {
        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeAll());
        });

        // Fechar ao clicar fora
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAll();
                }
            });
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    static closeAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
}

// Funções de Utilidade
class Utilities {
    static formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
        if (isNaN(value)) value = 0;
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    static formatDate(date, format = 'default') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return date;

        const options = {
            'short': { day: '2-digit', month: '2-digit', year: 'numeric' },
            'long': { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
            'month-year': { month: 'long', year: 'numeric' },
            'day-month': { day: '2-digit', month: 'short' },
            'time': { hour: '2-digit', minute: '2-digit' }
        };

        const formatOptions = options[format] || options['short'];
        return dateObj.toLocaleDateString('pt-BR', formatOptions);
    }

    static formatDateTime(date) {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return date;
        
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Inicialização da Aplicação
class AppInitializer {
    static init() {
        // Inicializar sistemas
        ThemeManager.init();
        TabSystem.init();
        ModalSystem.init();

        // Configurar data atual
        this.updateCurrentDate();

        // Configurar event listeners globais
        this.setupGlobalEvents();

        // Verificar armazenamento
        this.checkStorage();

        console.log('Aplicação inicializada com sucesso!');
    }

    static updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    static setupGlobalEvents() {
        // Botão para abrir ambas as ferramentas
        const openBothBtn = document.getElementById('open-both-tools');
        if (openBothBtn) {
            openBothBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.open('planilhaFinanceira.html', '_blank');
                window.open('cronograma.html', '_blank');
                NotificationSystem.show('Ambas as ferramentas abertas em novas abas', 'info');
            });
        }

        // Botão de refresh do dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateCurrentDate();
                NotificationSystem.show('Dashboard atualizado', 'info');
            });
        }

        // Botão de limpar todos os dados
        const clearAllBtn = document.getElementById('clear-all-data');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
                    DataManager.clearAllData();
                    NotificationSystem.show('Todos os dados foram limpos', 'success');
                    location.reload();
                }
            });
        }

        // Botão de exportar todos os dados
        const exportAllBtn = document.getElementById('export-all-data');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportAllData();
            });
        }

        // Botão de backup
        const backupBtn = document.getElementById('backup-all');
        if (backupBtn) {
            backupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createBackup();
            });
        }
    }

    static checkStorage() {
        const usage = DataManager.getStorageUsage();
        const maxSize = AppConfig.maxStorageSize;
        const percentage = (usage / maxSize) * 100;
        
        const progressBar = document.getElementById('storage-progress');
        const storageText = document.getElementById('storage-text');
        
        if (progressBar && storageText) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            storageText.textContent = `${DataManager.formatBytes(usage)} / ${DataManager.formatBytes(maxSize)}`;
            
            if (percentage > 80) {
                progressBar.style.backgroundColor = 'var(--danger-color)';
                NotificationSystem.show('Armazenamento quase cheio! Considere fazer backup e limpar dados antigos.', 'warning', 10000);
            } else if (percentage > 60) {
                progressBar.style.backgroundColor = 'var(--warning-color)';
            }
        }
    }

    static exportAllData() {
        const allData = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(AppConfig.storageKey)) {
                try {
                    allData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    allData[key] = localStorage.getItem(key);
                }
            }
        });

        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `organizador_pessoal_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        NotificationSystem.show('Todos os dados exportados com sucesso!', 'success');
    }

    static createBackup() {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: AppConfig.version,
            data: {}
        };

        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(AppConfig.storageKey)) {
                try {
                    backupData.data[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    backupData.data[key] = localStorage.getItem(key);
                }
            }
        });

        DataManager.saveData('backup', backupData);
        NotificationSystem.show('Backup criado com sucesso!', 'success');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    AppInitializer.init();
});

// Exportar para uso global
window.DataManager = DataManager;
window.NotificationSystem = NotificationSystem;
window.ThemeManager = ThemeManager;
window.TabSystem = TabSystem;
window.ModalSystem = ModalSystem;
window.Utilities = Utilities;