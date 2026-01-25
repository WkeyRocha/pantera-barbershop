// maked by rafael rocha

const app = {
    // Ícones FOCADOS EM BARBEARIA (Versão Gratuita FontAwesome)
    availableIcons: [
        'fa-scissors',          // Corte / Tesoura
        'fa-user-tie',          // Barba / Visual Social
        'fa-pump-soap',         // Lavagem / Shampoo / Creme
        'fa-spray-can',         // Pigmentação / Laquê
        'fa-wind',              // Secador / Escova
        'fa-fire',              // Toalha Quente / Cera Quente
        'fa-brush',             // Pincel / Tintura
        'fa-bottle-droplet',    // Óleo de Barba / Minoxidil
        'fa-mask',              // Sobrancelha / Limpeza de Pele
        'fa-wand-magic-sparkles', // Tratamento Especial / Platinado
        'fa-bolt',              // Desenho / Risquinho
        'fa-crown',             // Dia do Noivo / VIP
        'fa-droplet',           // Hidratação
        'fa-star',              // Especial
        'fa-check'              // Básico
    ],

    // Serviços Padrão com ícones atualizados
    defaultServices: [
        { id: 1, name: 'Corte de Cabelo', price: 30, icon: 'fa-scissors' },
        { id: 2, name: 'Barba Terapia', price: 30, icon: 'fa-fire' }, // Toalha quente
        { id: 3, name: 'Cabelo + Barba', price: 55, icon: 'fa-user-tie' },
        { id: 4, name: 'Sobrancelha', price: 10, icon: 'fa-mask' },
        { id: 5, name: 'Pigmentação', price: 45, icon: 'fa-spray-can' }
    ],

    state: {
        services: [],
        bookings: [],
        config: {},
        currentSelection: {},
        theme: 'light',
        userBookingId: null,
        isAdminLoggedIn: false,
        editingServiceIndex: null
    },

    init: function() {
        this.initProtection();

        this.state.services = JSON.parse(localStorage.getItem('pantera_services')) || this.defaultServices;
        this.state.bookings = JSON.parse(localStorage.getItem('pantera_bookings')) || [];
        this.state.config = JSON.parse(localStorage.getItem('pantera_config')) || { whatsapp: '5511999999999' };
        
        this.state.userBookingId = localStorage.getItem('pantera_user_booking_id');
        this.state.isAdminLoggedIn = localStorage.getItem('pantera_admin_logged_in') === 'true';
        
        const savedTheme = localStorage.getItem('pantera_theme') || 'light';
        this.setTheme(savedTheme);

        this.renderServices();
        this.checkUserStatus();
        this.updateAdminButton();
    },

    // --- PROTEÇÃO REFORÇADA ---
    initProtection: function() {
        // Bloqueia botão direito
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Bloqueia atalhos de desenvolvedor
        document.onkeydown = function(e) {
            if(e.keyCode == 123) return false; // F12
            if(e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) return false; // I, J, C
            if(e.ctrlKey && e.keyCode == 85) return false; // U
        };
    },

    toggleTheme: function() {
        this.setTheme(this.state.theme === 'light' ? 'dark' : 'light');
    },
    setTheme: function(themeName) {
        this.state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('pantera_theme', themeName);
        document.getElementById('theme-icon').className = themeName === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    },

    showDialog: function(title, message, type, onConfirm) {
        const modal = document.getElementById('modal-dialog');
        document.getElementById('dialog-title').innerText = title;
        document.getElementById('dialog-msg').innerText = message;
        
        const icon = document.getElementById('dialog-icon');
        const btnConfirm = document.getElementById('btn-dialog-confirm');
        const btnCancel = document.getElementById('btn-dialog-cancel');

        if (type === 'danger') {
            icon.className = 'fa-solid fa-triangle-exclamation';
            icon.style.color = 'var(--danger)';
            btnConfirm.style.background = 'var(--danger)';
            btnConfirm.innerText = 'Confirmar Exclusão';
        } else if (type === 'info') {
            icon.className = 'fa-solid fa-circle-info';
            icon.style.color = 'var(--accent)';
            btnConfirm.style.background = 'var(--text-main)';
            btnConfirm.innerText = 'OK';
            btnCancel.style.display = 'none';
        } else {
            icon.className = 'fa-solid fa-circle-question';
            icon.style.color = 'var(--accent)';
            btnConfirm.style.background = 'var(--text-main)';
            btnConfirm.innerText = 'Sim, continuar';
            btnCancel.style.display = 'inline-block';
        }

        modal.classList.remove('hidden');

        btnConfirm.onclick = () => {
            modal.classList.add('hidden');
            if (onConfirm) onConfirm();
        };
        btnCancel.onclick = () => {
            modal.classList.add('hidden');
        };
    },

    checkUserStatus: function() {
        const statusCard = document.getElementById('user-status-card');
        const details = document.getElementById('user-booking-details');

        if (this.state.userBookingId) {
            const booking = this.state.bookings.find(b => b.id == this.state.userBookingId);
            
            if (booking) {
                statusCard.classList.remove('hidden');
                details.innerText = `${booking.service} - ${booking.date} às ${booking.time}`;
            } else {
                localStorage.removeItem('pantera_user_booking_id');
                this.state.userBookingId = null;
                statusCard.classList.add('hidden');
            }
        } else {
            statusCard.classList.add('hidden');
        }
    },

    promptCancelBooking: function() {
        this.showDialog(
            'Cancelar Agendamento', 
            'Tem certeza que deseja cancelar seu horário? Isso liberará a vaga para outros.',
            'danger',
            () => {
                this.state.bookings = this.state.bookings.filter(b => b.id != this.state.userBookingId);
                localStorage.setItem('pantera_bookings', JSON.stringify(this.state.bookings));
                
                localStorage.removeItem('pantera_user_booking_id');
                this.state.userBookingId = null;
                
                this.checkUserStatus();
                this.showDialog('Cancelado', 'Seu agendamento foi cancelado com sucesso.', 'info');
            }
        );
    },

    renderServices: function() {
        const grid = document.getElementById('services-grid');
        grid.innerHTML = '';
        this.state.services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.onclick = () => this.handleServiceClick(service);
            card.innerHTML = `
                <i class="fa-solid ${service.icon || 'fa-cut'} service-icon"></i>
                <span class="service-name">${service.name}</span>
                <span class="service-price">R$ ${service.price},00</span>
            `;
            grid.appendChild(card);
        });
    },

    handleServiceClick: function(service) {
        if (this.state.userBookingId) {
            this.showDialog('Atenção', 'Você já possui um horário marcado. Cancele o atual para agendar um novo.', 'info');
            return;
        }
        this.openBooking(service);
    },

    openBooking: function(service) {
        this.state.currentSelection.service = service;
        document.getElementById('modal-title').innerText = service.name;
        document.getElementById('step-date').classList.remove('hidden');
        document.getElementById('step-form').classList.add('hidden');
        document.getElementById('time-wrapper').classList.add('hidden');
        document.getElementById('modal-booking').classList.remove('hidden');
        this.renderCalendar();
    },

    closeModal: function(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    renderCalendar: function() {
        const wrapper = document.getElementById('calendar-wrapper');
        wrapper.innerHTML = '';
        const today = new Date();
        for(let i=0; i<14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const btn = document.createElement('div');
            btn.className = 'date-chip';
            btn.innerHTML = `<span style="font-size:0.75rem">${date.toLocaleDateString('pt-BR', {weekday:'short'})}</span>
                             <span style="font-weight:bold; font-size:1.1rem">${date.getDate()}</span>`;
            
            const fullDate = date.toLocaleDateString('pt-BR');
            btn.onclick = () => {
                document.querySelectorAll('.date-chip').forEach(e=>e.classList.remove('selected'));
                btn.classList.add('selected');
                this.state.currentSelection.date = fullDate;
                this.renderTimes();
            };
            wrapper.appendChild(btn);
        }
    },

    renderTimes: function() {
        document.getElementById('time-wrapper').classList.remove('hidden');
        const grid = document.getElementById('time-grid');
        grid.innerHTML = '';
        for(let h=9; h<=20; h++) {
            const time = `${h}:00`;
            const btn = document.createElement('div');
            btn.className = 'time-chip';
            btn.innerText = time;
            
            const busy = this.state.bookings.some(b => b.date === this.state.currentSelection.date && b.time === time);
            if(busy) btn.classList.add('disabled');
            else btn.onclick = () => {
                this.state.currentSelection.time = time;
                this.goToForm();
            };
            grid.appendChild(btn);
        }
    },

    goToForm: function() {
        document.getElementById('step-date').classList.add('hidden');
        document.getElementById('step-form').classList.remove('hidden');
        document.getElementById('summary-service').innerText = this.state.currentSelection.service.name;
        document.getElementById('summary-datetime').innerText = `${this.state.currentSelection.date} - ${this.state.currentSelection.time}`;
    },

    backToDate: function() {
        document.getElementById('step-form').classList.add('hidden');
        document.getElementById('step-date').classList.remove('hidden');
    },

    confirmBooking: function() {
        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        if(!name || !phone) return this.showDialog('Erro', 'Preencha todos os campos.', 'info');

        const bookingId = Date.now();
        const booking = {
            id: bookingId,
            service: this.state.currentSelection.service.name,
            date: this.state.currentSelection.date,
            time: this.state.currentSelection.time,
            clientName: name,
            clientPhone: phone
        };
        
        this.state.bookings.push(booking);
        localStorage.setItem('pantera_bookings', JSON.stringify(this.state.bookings));
        
        this.state.userBookingId = bookingId;
        localStorage.setItem('pantera_user_booking_id', bookingId);

        const link = `https://wa.me/${this.state.config.whatsapp}?text=Agendamento: ${booking.service} - ${booking.date} às ${booking.time}. Cliente: ${name}`;
        window.open(link, '_blank');
        
        location.reload();
    },

    handleAdminClick: function() {
        const modal = document.getElementById('modal-admin');
        modal.classList.remove('hidden');

        if(this.state.isAdminLoggedIn) {
            document.getElementById('admin-login-view').classList.add('hidden');
            document.getElementById('admin-panel-view').classList.remove('hidden');
            this.switchTab('bookings');
        } else {
            document.getElementById('admin-login-view').classList.remove('hidden');
            document.getElementById('admin-panel-view').classList.add('hidden');
        }
    },

    loginAdmin: function() {
        const u = document.getElementById('adm-user').value;
        const p = document.getElementById('adm-pass').value;

        if(u === 'panteraadm1' && p === 'pantera1') {
            this.state.isAdminLoggedIn = true;
            localStorage.setItem('pantera_admin_logged_in', 'true');
            
            document.getElementById('admin-login-view').classList.add('hidden');
            document.getElementById('admin-panel-view').classList.remove('hidden');
            this.updateAdminButton();
            this.switchTab('bookings');
        } else {
            this.showDialog('Erro', 'Credenciais inválidas.', 'info');
        }
    },

    logoutAdmin: function() {
        this.state.isAdminLoggedIn = false;
        localStorage.setItem('pantera_admin_logged_in', 'false');
        document.getElementById('adm-user').value = '';
        document.getElementById('adm-pass').value = '';
        this.closeModal('modal-admin');
        this.updateAdminButton();
    },

    updateAdminButton: function() {
        const btn = document.getElementById('btn-admin-trigger');
        btn.style.color = this.state.isAdminLoggedIn ? 'var(--accent)' : 'var(--text-muted)';
        btn.innerText = this.state.isAdminLoggedIn ? 'Painel' : 'Admin';
    },

    switchTab: function(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        const content = document.getElementById('admin-content');
        content.innerHTML = '';

        if(tab === 'bookings') this.renderAdminBookings(content);
        if(tab === 'services') this.renderAdminServices(content);
        if(tab === 'config') this.renderAdminConfig(content);
    },

    renderAdminBookings: function(container) {
        const sorted = this.state.bookings.sort((a,b) => b.id - a.id);
        if(sorted.length === 0) return container.innerHTML = '<p style="text-align:center; color:var(--text-muted)">Sem agendamentos.</p>';

        sorted.forEach(b => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div>
                    <strong style="display:block;">${b.date} - ${b.time}</strong>
                    <span>${b.service}</span>
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-top:5px;">${b.clientName} | ${b.clientPhone}</div>
                </div>
                <button class="btn-mini btn-del" onclick="app.adminDeleteBooking(${b.id})">Excluir</button>
            `;
            container.appendChild(item);
        });
    },

    adminDeleteBooking: function(id) {
        this.showDialog('Excluir Agendamento', 'Tem certeza? O cliente perderá a reserva.', 'danger', () => {
            this.state.bookings = this.state.bookings.filter(b => b.id !== id);
            localStorage.setItem('pantera_bookings', JSON.stringify(this.state.bookings));
            this.switchTab('bookings');
        });
    },

    renderAdminServices: function(container) {
        this.state.services.forEach((s, idx) => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
                <div style="margin-bottom:10px; font-weight:600;">${s.name}</div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="btn-icon-select" onclick="app.openIconSelector(${idx})">
                        <i class="fa-solid ${s.icon || 'fa-cut'}"></i>
                    </button>
                    <input type="text" value="${s.name}" id="edit-name-${idx}" class="input-field" style="margin:0;">
                    <input type="number" value="${s.price}" id="edit-price-${idx}" class="input-field" style="margin:0; width:80px;">
                </div>
                <div class="mini-actions">
                    <button class="btn-mini btn-save" onclick="app.saveService(${idx})">Salvar</button>
                    <button class="btn-mini btn-del" onclick="app.deleteService(${idx})">Excluir</button>
                </div>
            `;
            container.appendChild(item);
        });

        const addDiv = document.createElement('div');
        addDiv.style.marginTop = '20px';
        addDiv.innerHTML = `
            <p style="font-size:0.9rem; margin-bottom:5px;">Adicionar Novo Serviço:</p>
            <input type="text" id="new-name" class="input-field" placeholder="Nome">
            <input type="number" id="new-price" class="input-field" placeholder="Preço">
            <button class="btn-primary" onclick="app.addService()">Adicionar</button>
        `;
        container.appendChild(addDiv);
    },

    openIconSelector: function(serviceIdx) {
        this.state.editingServiceIndex = serviceIdx;
        const modal = document.getElementById('modal-icons');
        const grid = document.getElementById('icons-grid');
        grid.innerHTML = '';
        
        this.availableIcons.forEach(icon => {
            const div = document.createElement('div');
            div.className = 'icon-option';
            div.innerHTML = `<i class="fa-solid ${icon}"></i>`;
            div.onclick = () => app.selectIcon(icon);
            grid.appendChild(div);
        });

        modal.classList.remove('hidden');
    },

    selectIcon: function(icon) {
        const idx = this.state.editingServiceIndex;
        if(idx !== null && this.state.services[idx]) {
            this.state.services[idx].icon = icon;
            this.updateServicesStorage();
            this.closeModal('modal-icons');
            this.switchTab('services');
        }
    },

    saveService: function(idx) {
        const name = document.getElementById(`edit-name-${idx}`).value;
        const price = document.getElementById(`edit-price-${idx}`).value;
        this.state.services[idx].name = name;
        this.state.services[idx].price = price;
        this.updateServicesStorage();
        this.showDialog('Sucesso', 'Serviço atualizado.', 'info');
    },

    deleteService: function(idx) {
        this.showDialog('Excluir Serviço', 'Essa ação não pode ser desfeita.', 'danger', () => {
            this.state.services.splice(idx, 1);
            this.updateServicesStorage();
        });
    },

    addService: function() {
        const name = document.getElementById('new-name').value;
        const price = document.getElementById('new-price').value;
        if(name && price) {
            this.state.services.push({ id: Date.now(), name, price, icon: 'fa-scissors' });
            this.updateServicesStorage();
            this.switchTab('services');
        }
    },

    updateServicesStorage: function() {
        localStorage.setItem('pantera_services', JSON.stringify(this.state.services));
        this.renderServices();
    },

    renderAdminConfig: function(container) {
        container.innerHTML = `
            <p style="margin-bottom:10px;">Número WhatsApp (somente números, com DDD):</p>
            <input type="text" id="conf-phone" class="input-field" value="${this.state.config.whatsapp}">
            <button class="btn-primary" onclick="app.saveConfig()">Salvar Configuração</button>
        `;
    },

    saveConfig: function() {
        const phone = document.getElementById('conf-phone').value;
        this.state.config.whatsapp = phone;
        localStorage.setItem('pantera_config', JSON.stringify(this.state.config));
        this.showDialog('Sucesso', 'Configurações salvas.', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
