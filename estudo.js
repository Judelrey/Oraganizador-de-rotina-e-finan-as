// ============================================
// ESTUDO.JS - SISTEMA DE ESTUDOS COMPLETO
// ============================================

// Módulo de Estudos Principal
const EstudoApp = {
    // Dados
    data: {
        weeklySchedule: {},
        notes: [],
        files: [],
        events: [],
        currentWeekStart: new Date(),
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        categories: {
            subjects: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Inglês', 'Programação', 'Outros']
        }
    },

    // Inicialização
    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderWeeklySchedule();
        this.renderNotes();
        this.renderFiles();
        this.renderCalendar();
        this.renderEventsList();
        console.log('Estudo App inicializado');
    },

    // Carregar dados do localStorage
    loadData() {
        const savedData = DataManager.loadData('studyData', {});
        this.data = { ...this.data, ...savedData };

        // Inicializar arrays se não existirem
        if (!Array.isArray(this.data.notes)) this.data.notes = [];
        if (!Array.isArray(this.data.files)) this.data.files = [];
        if (!Array.isArray(this.data.events)) this.data.events = [];

        // Inicializar weeklySchedule se necessário
        for (let i = 0; i < 7; i++) {
            if (!this.data.weeklySchedule[i]) {
                this.data.weeklySchedule[i] = [];
            }
        }

        // Garantir que todos os itens tenham IDs
        this.data.weeklySchedule = this.ensureIds(this.data.weeklySchedule);
        this.data.notes = this.ensureIds(this.data.notes);
        this.data.files = this.ensureIds(this.data.files);
        this.data.events = this.ensureIds(this.data.events);
    },

    ensureIds(items) {
        if (Array.isArray(items)) {
            return items.map(item => ({
                id: item.id || Utilities.generateId(),
                ...item
            }));
        } else if (typeof items === 'object') {
            const result = {};
            Object.keys(items).forEach(key => {
                result[key] = this.ensureIds(items[key]);
            });
            return result;
        }
        return items;
    },

    // Salvar dados no localStorage
    saveData() {
        DataManager.saveData('studyData', {
            weeklySchedule: this.data.weeklySchedule,
            notes: this.data.notes,
            files: this.data.files,
            events: this.data.events
        });
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botão de adicionar sessão
        document.getElementById('add-study-block')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.addStudySession();
        });

        // Botão de adicionar anotação
        document.getElementById('add-note')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.addNote();
        });

        // Botão de adicionar evento
        document.getElementById('add-calendar-event')?.addEventListener('click', () => {
            this.showAddEventModal();
        });

        // Formulário de evento
        document.getElementById('new-event-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent();
        });

        // Upload de arquivos
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = 'var(--bg-tertiary)';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.backgroundColor = '';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.backgroundColor = '';
                this.handleFileUpload(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
                e.target.value = '';
            });
        }

        // Navegação temporal
        document.getElementById('prev-period')?.addEventListener('click', () => this.prevWeek());
        document.getElementById('next-period')?.addEventListener('click', () => this.nextWeek());
        document.getElementById('today-btn')?.addEventListener('click', () => this.goToToday());

        // Navegação do calendário
        document.getElementById('prev-month')?.addEventListener('click', () => this.prevMonth());
        document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());

        // Exportar dados de estudo
        document.getElementById('export-study')?.addEventListener('click', () => this.exportStudyData());
        
        // Backup de estudo
        document.getElementById('backup-study')?.addEventListener('click', () => this.backupStudyData());
        
        // Limpar dados de estudo
        document.getElementById('clear-study-data')?.addEventListener('click', () => this.clearStudyData());
    },

    // ============ GRADE SEMANAL ============
    renderWeeklySchedule() {
        const weekGrid = document.querySelector('.week-grid');
        if (!weekGrid) return;

        weekGrid.innerHTML = '';

        // Calcular datas da semana
        const weekStart = new Date(this.data.currentWeekStart);
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'week-day';
            
            // Adicionar número do dia
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = `${currentDate.getDate()} ${daysOfWeek[i].substring(0, 3)}`;
            dayElement.appendChild(dayNumber);
            
            // Adicionar sessões de estudo do dia
            const daySessions = this.data.weeklySchedule[i] || [];
            daySessions.forEach(session => {
                const sessionElement = document.createElement('div');
                sessionElement.className = `study-session ${session.priority}-priority`;
                sessionElement.setAttribute('data-id', session.id);
                
                sessionElement.innerHTML = `
                    <div class="session-subject">${session.subject}</div>
                    <div class="session-time">
                        <i class="far fa-clock"></i>
                        ${session.time} • ${session.duration}h
                    </div>
                `;
                
                sessionElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showSessionDetails(session);
                });
                
                dayElement.appendChild(sessionElement);
            });
            
            // Adicionar botão para adicionar sessão
            if (daySessions.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'text-center mt-2';
                emptyMessage.innerHTML = `
                    <div style="color: var(--text-tertiary); font-size: 0.875rem;">
                        <i class="far fa-calendar-plus"></i>
                        <div>Sem sessões</div>
                    </div>
                `;
                dayElement.appendChild(emptyMessage);
            }
            
            weekGrid.appendChild(dayElement);
        }
        
        // Atualizar período atual
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const options = { day: 'numeric', month: 'short' };
        const startStr = weekStart.toLocaleDateString('pt-BR', options);
        const endStr = weekEnd.toLocaleDateString('pt-BR', options);
        
        const periodElement = document.getElementById('current-period');
        if (periodElement) {
            periodElement.textContent = `${startStr} - ${endStr}`;
        }
    },

    addStudySession() {
        const subject = document.getElementById('study-subject').value.trim();
        const day = parseInt(document.getElementById('study-day').value);
        const time = document.getElementById('study-time').value;
        const duration = parseFloat(document.getElementById('study-duration').value);
        const priority = document.getElementById('study-priority').value;
        
        if (!subject || !time) {
            NotificationSystem.show('Preencha a matéria e o horário', 'warning');
            return;
        }
        
        const newSession = {
            id: Utilities.generateId(),
            subject,
            time,
            duration,
            priority,
            color: this.getPriorityColor(priority)
        };
        
        if (!this.data.weeklySchedule[day]) {
            this.data.weeklySchedule[day] = [];
        }
        
        this.data.weeklySchedule[day].push(newSession);
        this.saveData();
        this.renderWeeklySchedule();
        
        // Limpar formulário
        document.getElementById('study-subject').value = '';
        document.getElementById('study-time').value = '';
        
        NotificationSystem.show('Sessão adicionada com sucesso!', 'success');
    },

    getPriorityColor(priority) {
        const colors = {
            'high': '#ff6b6b',
            'medium': '#4a6bff',
            'low': '#3498db'
        };
        return colors[priority] || '#4a6bff';
    },

    showSessionDetails(session) {
        const modal = document.getElementById('event-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = `
            <div class="session-details">
                <h4>${session.subject}</h4>
                <div class="detail-row">
                    <i class="far fa-clock"></i>
                    <span>Horário: ${session.time}</span>
                </div>
                <div class="detail-row">
                    <i class="far fa-hourglass"></i>
                    <span>Duração: ${session.duration} horas</span>
                </div>
                <div class="detail-row">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Prioridade: ${this.getPriorityLabel(session.priority)}</span>
                </div>
                <div class="mt-3">
                    <button class="btn btn-danger" onclick="EstudoApp.removeStudySession('${session.id}')">
                        <i class="fas fa-trash"></i> Remover Sessão
                    </button>
                </div>
            </div>
        `;
        
        ModalSystem.open('event-modal');
    },

    removeStudySession(sessionId) {
        for (let day in this.data.weeklySchedule) {
            this.data.weeklySchedule[day] = this.data.weeklySchedule[day].filter(
                session => session.id !== sessionId
            );
        }
        
        this.saveData();
        this.renderWeeklySchedule();
        ModalSystem.closeAll();
        NotificationSystem.show('Sessão removida', 'success');
    },

    getPriorityLabel(priority) {
        const labels = {
            'high': 'Alta',
            'medium': 'Média',
            'low': 'Baixa'
        };
        return labels[priority] || 'Média';
    },

    prevWeek() {
        this.data.currentWeekStart.setDate(this.data.currentWeekStart.getDate() - 7);
        this.renderWeeklySchedule();
    },

    nextWeek() {
        this.data.currentWeekStart.setDate(this.data.currentWeekStart.getDate() + 7);
        this.renderWeeklySchedule();
    },

    goToToday() {
        this.data.currentWeekStart = new Date();
        this.data.currentWeekStart.setDate(this.data.currentWeekStart.getDate() - this.data.currentWeekStart.getDay());
        this.renderWeeklySchedule();
        NotificationSystem.show('Voltou para a semana atual', 'info');
    },

    // ============ ANOTAÇÕES ============
    renderNotes() {
        const notesGrid = document.querySelector('.notes-grid');
        if (!notesGrid) return;
        
        notesGrid.innerHTML = '';
        
        if (this.data.notes.length === 0) {
            notesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 3rem;">
                    <i class="far fa-sticky-note" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-secondary);">Nenhuma anotação</h4>
                    <p style="color: var(--text-tertiary);">Comece adicionando sua primeira anotação</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        const sortedNotes = [...this.data.notes].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-card';
            
            const date = new Date(note.date);
            const formattedDate = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            noteElement.innerHTML = `
                <div class="note-date">
                    <i class="far fa-calendar"></i> ${formattedDate}
                </div>
                <div class="note-content">${note.content}</div>
                ${note.tags && note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="mt-2">
                    <button class="btn btn-sm btn-secondary" onclick="EstudoApp.deleteNote('${note.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            notesGrid.appendChild(noteElement);
        });
    },

    addNote() {
        const content = document.getElementById('new-note').value.trim();
        const tagsInput = document.getElementById('note-tags').value.trim();
        
        if (!content) {
            NotificationSystem.show('Digite o conteúdo da anotação', 'warning');
            return;
        }
        
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        const newNote = {
            id: Utilities.generateId(),
            content,
            date: new Date().toISOString(),
            tags
        };
        
        this.data.notes.push(newNote);
        this.saveData();
        this.renderNotes();
        
        // Limpar formulário
        document.getElementById('new-note').value = '';
        document.getElementById('note-tags').value = '';
        
        NotificationSystem.show('Anotação salva com sucesso!', 'success');
    },

    deleteNote(noteId) {
        if (confirm('Tem certeza que deseja excluir esta anotação?')) {
            this.data.notes = this.data.notes.filter(note => note.id !== noteId);
            this.saveData();
            this.renderNotes();
            NotificationSystem.show('Anotação excluída', 'success');
        }
    },

    // ============ ARQUIVOS ============
    renderFiles() {
        const filesGrid = document.querySelector('.files-grid');
        if (!filesGrid) return;
        
        filesGrid.innerHTML = '';
        
        if (this.data.files.length === 0) {
            filesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
                    <i class="far fa-folder-open" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-secondary);">Nenhum arquivo</h4>
                    <p style="color: var(--text-tertiary);">Arraste arquivos para cá ou clique para selecionar</p>
                </div>
            `;
            return;
        }
        
        this.data.files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-card';
            
            const icon = this.getFileIcon(file.type);
            
            fileElement.innerHTML = `
                <div class="file-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="file-info">
                    <h5>${file.name}</h5>
                    <div class="file-size">${file.size}</div>
                </div>
                <div style="margin-left: auto;">
                    <button class="btn btn-sm btn-secondary" onclick="EstudoApp.deleteFile('${file.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            filesGrid.appendChild(fileElement);
        });
    },

    getFileIcon(fileType) {
        const icons = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'mp3': 'fas fa-file-audio',
            'mp4': 'fas fa-file-video',
            'txt': 'fas fa-file-alt',
            'zip': 'fas fa-file-archive'
        };
        
        return icons[fileType] || 'fas fa-file';
    },

    handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            const fileType = file.name.split('.').pop().toLowerCase();
            const fileSize = this.formatFileSize(file.size);
            
            const newFile = {
                id: Utilities.generateId(),
                name: file.name,
                type: fileType,
                size: fileSize,
                uploadedAt: new Date().toISOString()
            };
            
            this.data.files.push(newFile);
        });
        
        this.saveData();
        this.renderFiles();
        NotificationSystem.show(`${files.length} arquivo(s) adicionado(s)`, 'success');
    },

    formatFileSize(bytes) {
        return Utilities.formatBytes(bytes);
    },

    deleteFile(fileId) {
        if (confirm('Tem certeza que deseja excluir este arquivo?')) {
            this.data.files = this.data.files.filter(file => file.id !== fileId);
            this.saveData();
            this.renderFiles();
            NotificationSystem.show('Arquivo excluído', 'success');
        }
    },

    // ============ CALENDÁRIO ============
    renderCalendar() {
        const calendarDays = document.querySelector('.calendar-days');
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        
        // Atualizar título do mês
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        
        const monthElement = document.getElementById('current-month');
        if (monthElement) {
            monthElement.textContent = `${monthNames[this.data.currentMonth]} ${this.data.currentYear}`;
        }
        
        // Calcular primeiro e último dia do mês
        const firstDay = new Date(this.data.currentYear, this.data.currentMonth, 1);
        const lastDay = new Date(this.data.currentYear, this.data.currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const today = new Date();
        
        // Adicionar dias do mês anterior
        for (let i = 0; i < startingDay; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            calendarDays.appendChild(dayElement);
        }
        
        // Adicionar dias do mês atual
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const currentDate = new Date(this.data.currentYear, this.data.currentMonth, day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Verificar se é hoje
            if (day === today.getDate() && 
                this.data.currentMonth === today.getMonth() && 
                this.data.currentYear === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Número do dia
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            // Eventos do dia
            const dayEvents = this.data.events.filter(event => {
                const eventDate = new Date(event.date).toISOString().split('T')[0];
                return eventDate === dateString;
            });
            
            if (dayEvents.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'calendar-events';
                
                dayEvents.slice(0, 2).forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = `calendar-event ${event.type}`;
                    eventElement.textContent = event.title;
                    eventElement.title = event.title;
                    eventElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showEventDetails(event);
                    });
                    eventsContainer.appendChild(eventElement);
                });
                
                if (dayEvents.length > 2) {
                    const moreElement = document.createElement('div');
                    moreElement.className = 'calendar-event other';
                    moreElement.textContent = `+${dayEvents.length - 2} mais`;
                    moreElement.title = `${dayEvents.length - 2} eventos adicionais`;
                    moreElement.addEventListener('click', () => {
                        this.showDayEvents(dateString, dayEvents);
                    });
                    eventsContainer.appendChild(moreElement);
                }
                
                dayElement.appendChild(eventsContainer);
            }
            
            // Clique para adicionar evento
            dayElement.addEventListener('click', () => {
                this.showAddEventModal(dateString);
            });
            
            calendarDays.appendChild(dayElement);
        }
        
        // Renderizar lista de eventos do mês
        this.renderEventsList();
    },

    renderEventsList() {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        // Filtrar eventos do mês atual
        const currentMonthEvents = this.data.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() === this.data.currentMonth && 
                   eventDate.getFullYear() === this.data.currentYear;
        });
        
        if (currentMonthEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="text-center" style="padding: 2rem;">
                    <i class="far fa-calendar" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-tertiary);">Nenhum evento agendado para este mês</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por data
        currentMonthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        currentMonthEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const day = eventDate.getDate();
            const month = eventDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
            
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item';
            
            eventElement.innerHTML = `
                <div class="event-date">
                    <div class="event-day">${day}</div>
                    <div class="event-month">${month}</div>
                </div>
                <div class="event-details">
                    <h5>${event.title}</h5>
                    <div class="event-time">${this.getEventTypeLabel(event.type)}</div>
                </div>
                <div style="margin-left: auto;">
                    <button class="btn btn-sm btn-secondary" onclick="EstudoApp.deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            eventElement.addEventListener('click', () => {
                this.showEventDetails(event);
            });
            
            eventsList.appendChild(eventElement);
        });
    },

    getEventTypeLabel(type) {
        const labels = {
            'study': 'Sessão de Estudo',
            'exam': 'Prova/Avaliação',
            'assignment': 'Trabalho/Entrega',
            'meeting': 'Reunião',
            'other': 'Outro'
        };
        return labels[type] || 'Evento';
    },

    prevMonth() {
        this.data.currentMonth--;
        if (this.data.currentMonth < 0) {
            this.data.currentMonth = 11;
            this.data.currentYear--;
        }
        this.renderCalendar();
    },

    nextMonth() {
        this.data.currentMonth++;
        if (this.data.currentMonth > 11) {
            this.data.currentMonth = 0;
            this.data.currentYear++;
        }
        this.renderCalendar();
    },

    showEventDetails(event) {
        const modal = document.getElementById('event-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        modalBody.innerHTML = `
            <div class="event-details-modal">
                <h4>${event.title}</h4>
                <div class="detail-row">
                    <i class="far fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                ${event.time ? `
                    <div class="detail-row">
                        <i class="far fa-clock"></i>
                        <span>Horário: ${event.time}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <i class="fas fa-tag"></i>
                    <span>Tipo: ${this.getEventTypeLabel(event.type)}</span>
                </div>
                ${event.description ? `
                    <div class="mt-2">
                        <h5>Descrição:</h5>
                        <p>${event.description}</p>
                    </div>
                ` : ''}
                <div class="mt-3">
                    <button class="btn btn-danger" onclick="EstudoApp.deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> Remover Evento
                    </button>
                </div>
            </div>
        `;
        
        ModalSystem.open('event-modal');
    },

    showAddEventModal(prefilledDate = null) {
        const modal = document.getElementById('add-event-modal');
        const form = document.getElementById('new-event-form');
        
        if (prefilledDate) {
            document.getElementById('event-date').value = prefilledDate;
        } else {
            document.getElementById('event-date').valueAsDate = new Date();
        }
        
        // Resetar formulário
        form.reset();
        if (prefilledDate) {
            document.getElementById('event-date').value = prefilledDate;
        }
        
        ModalSystem.open('add-event-modal');
    },

    addEvent() {
        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value;
        const type = document.getElementById('event-type').value;
        const time = document.getElementById('event-time').value;
        const description = document.getElementById('event-description').value.trim();
        
        if (!title || !date) {
            NotificationSystem.show('Preencha o título e a data', 'warning');
            return;
        }
        
        const newEvent = {
            id: Utilities.generateId(),
            title,
            date: new Date(date).toISOString(),
            type,
            time: time || null,
            description: description || null,
            color: this.getEventTypeColor(type)
        };
        
        this.data.events.push(newEvent);
        this.saveData();
        this.renderCalendar();
        ModalSystem.closeAll();
        
        NotificationSystem.show('Evento adicionado com sucesso!', 'success');
    },

    getEventTypeColor(type) {
        const colors = {
            'study': '#4a6bff',
            'exam': '#ff6b6b',
            'assignment': '#ffa500',
            'meeting': '#2ecc71',
            'other': '#9b59b6'
        };
        return colors[type] || '#4a6bff';
    },

    deleteEvent(eventId) {
        if (confirm('Tem certeza que deseja excluir este evento?')) {
            this.data.events = this.data.events.filter(event => event.id !== eventId);
            this.saveData();
            this.renderCalendar();
            ModalSystem.closeAll();
            NotificationSystem.show('Evento excluído', 'success');
        }
    },

    showDayEvents(dateString, events) {
        const modal = document.getElementById('event-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        let eventsHTML = events.map(event => `
            <div class="event-item mb-2" style="background: ${event.color}10; border-left: 4px solid ${event.color};">
                <div style="padding: 0.75rem;">
                    <h5 style="margin: 0 0 0.25rem;">${event.title}</h5>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${this.getEventTypeLabel(event.type)}
                        ${event.time ? ` • ${event.time}` : ''}
                    </div>
                    <button class="btn btn-sm btn-secondary mt-1" onclick="EstudoApp.deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        modalBody.innerHTML = `
            <h4>${formattedDate}</h4>
            <div class="mt-2">
                ${events.length === 0 ? 
                    '<p style="color: var(--text-tertiary); text-align: center; padding: 2rem;">Nenhum evento para este dia</p>' : 
                    eventsHTML
                }
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="EstudoApp.showAddEventModal('${dateString}')">
                    <i class="fas fa-plus"></i> Adicionar Evento
                </button>
            </div>
        `;
        
        ModalSystem.open('event-modal');
    },

    // ============ EXPORTAÇÃO E BACKUP ============
    exportStudyData() {
        const exportData = {
            weeklySchedule: this.data.weeklySchedule,
            notes: this.data.notes,
            files: this.data.files,
            events: this.data.events,
            exportDate: new Date().toISOString(),
            version: AppConfig.version
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `dados_estudos_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        NotificationSystem.show('Dados de estudo exportados com sucesso!', 'success');
    },

    backupStudyData() {
        this.saveData();
        NotificationSystem.show('Backup de estudos criado com sucesso!', 'success');
    },

    clearStudyData() {
        if (confirm('Tem certeza que deseja limpar TODOS os dados de estudos? Esta ação não pode ser desfeita.')) {
            DataManager.clearData('studyData');
            this.data.weeklySchedule = {};
            this.data.notes = [];
            this.data.files = [];
            this.data.events = [];
            
            // Re-inicializar weeklySchedule
            for (let i = 0; i < 7; i++) {
                this.data.weeklySchedule[i] = [];
            }
            
            this.renderWeeklySchedule();
            this.renderNotes();
            this.renderFiles();
            this.renderCalendar();
            NotificationSystem.show('Todos os dados de estudos foram limpos', 'success');
        }
    }
};

// Inicializar quando o DOM estiver carregado
if (document.querySelector('.estudo-app')) {
    document.addEventListener('DOMContentLoaded', () => {
        EstudoApp.init();
    });
}

// Exportar para uso global
window.EstudoApp = EstudoApp;