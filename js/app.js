// Hospital Management System JavaScript
class HospitalManagementSystem {
    constructor() {
        this.patients = JSON.parse(localStorage.getItem('patients')) || [];
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        this.labTests = JSON.parse(localStorage.getItem('labTests')) || [];
        this.testTypes = JSON.parse(localStorage.getItem('testTypes')) || this.getDefaultTestTypes();
        this.appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        this.services = JSON.parse(localStorage.getItem('services')) || this.getDefaultServices();
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupModals();
        this.loadDashboardStats();
        this.loadPatientData();
        this.loadInventoryData();
        this.loadLabData();
        this.loadAppointmentData();
        this.loadServicesData();
        this.generatePatientId();
        this.setCurrentDate();
    }

    // Navigation
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.dataset.section;
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Update active section
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetSection).classList.add('active');
            });
        });
    }

    // Forms Setup
    setupForms() {
        // Patient form
        const patientForm = document.getElementById('patient-form');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => this.handlePatientSubmit(e));
        }

        // Item form
        const itemForm = document.getElementById('item-form');
        if (itemForm) {
            itemForm.addEventListener('submit', (e) => this.handleItemSubmit(e));
        }

        // Service form
        const serviceForm = document.getElementById('service-form');
        if (serviceForm) {
            serviceForm.addEventListener('submit', (e) => this.handleServiceSubmit(e));
        }

        // Search functionality
        this.setupSearchFilters();
    }

    setupSearchFilters() {
        // Patient search
        const patientSearch = document.getElementById('patient-search');
        if (patientSearch) {
            patientSearch.addEventListener('input', (e) => this.filterPatients(e.target.value));
        }

        // Inventory search
        const inventorySearch = document.getElementById('inventory-search');
        if (inventorySearch) {
            inventorySearch.addEventListener('input', (e) => this.filterInventory(e.target.value));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterInventoryByCategory(e.target.value));
        }
    }

    // Modals
    setupModals() {
        // Add item button
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.openItemModal());
        }

        // Add service button
        const addServiceBtn = document.getElementById('add-service-btn');
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', () => this.openServiceModal());
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Cancel buttons
        const cancelButtons = document.querySelectorAll('#cancel-item, #cancel-service');
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    // Patient Management
    generatePatientId() {
        const patientIdField = document.getElementById('patient-id');
        if (patientIdField) {
            const nextId = 'PAT' + String(this.patients.length + 1).padStart(4, '0');
            patientIdField.value = nextId;
        }
    }

    setCurrentDate() {
        const dateField = document.getElementById('registration-date');
        if (dateField) {
            dateField.value = new Date().toISOString().split('T')[0];
        }
    }

    handlePatientSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patient = Object.fromEntries(formData.entries());
        
        patient.id = this.patients.length + 1;
        patient.registrationDate = new Date().toISOString();
        
        this.patients.push(patient);
        this.saveData('patients', this.patients);
        this.loadPatientData();
        this.loadDashboardStats();
        this.generatePatientId();
        
        e.target.reset();
        this.setCurrentDate();
        this.showNotification('Patient registered successfully!', 'success');
    }

    loadPatientData() {
        const tbody = document.getElementById('patients-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.patients.forEach(patient => {
            const age = this.calculateAge(patient.dateOfBirth);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.patientId}</td>
                <td>${patient.firstName} ${patient.lastName}</td>
                <td>${age}</td>
                <td>${patient.gender}</td>
                <td>${patient.phone}</td>
                <td>${new Date(patient.registrationDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="hms.editPatient(${patient.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="hms.deletePatient(${patient.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    filterPatients(searchTerm) {
        const rows = document.querySelectorAll('#patients-tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    // Inventory Management
    openItemModal(item = null) {
        const modal = document.getElementById('item-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('item-form');
        
        if (item) {
            title.textContent = 'Edit Item';
            this.populateItemForm(item);
        } else {
            title.textContent = 'Add New Item';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateItemForm(item) {
        document.getElementById('item-code').value = item.itemCode;
        document.getElementById('item-name').value = item.itemName;
        document.getElementById('item-category').value = item.category;
        document.getElementById('current-stock').value = item.currentStock;
        document.getElementById('min-stock').value = item.minStock;
        document.getElementById('unit-price').value = item.unitPrice;
        document.getElementById('supplier').value = item.supplier;
        document.getElementById('description').value = item.description || '';
    }

    handleItemSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const item = Object.fromEntries(formData.entries());
        
        item.id = this.inventory.length + 1;
        item.lastUpdated = new Date().toISOString();
        item.currentStock = parseInt(item.currentStock);
        item.minStock = parseInt(item.minStock);
        item.unitPrice = parseFloat(item.unitPrice);
        
        this.inventory.push(item);
        this.saveData('inventory', this.inventory);
        this.loadInventoryData();
        this.loadDashboardStats();
        
        this.closeModal(document.getElementById('item-modal'));
        this.showNotification('Item added successfully!', 'success');
    }

    loadInventoryData() {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.inventory.forEach(item => {
            const row = document.createElement('tr');
            const isLowStock = item.currentStock <= item.minStock;
            
            row.innerHTML = `
                <td>${item.itemCode}</td>
                <td>${item.itemName}</td>
                <td>${item.category}</td>
                <td class="${isLowStock ? 'low-stock' : ''}">${item.currentStock}</td>
                <td>${item.minStock}</td>
                <td>$${item.unitPrice}</td>
                <td>${item.supplier}</td>
                <td>${new Date(item.lastUpdated).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="hms.editItem(${item.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="hms.deleteItem(${item.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        this.updateInventoryStats();
    }

    updateInventoryStats() {
        const totalItems = document.getElementById('total-items');
        const lowStockCount = document.getElementById('low-stock-count');
        const outOfStock = document.getElementById('out-of-stock');
        
        if (totalItems) totalItems.textContent = this.inventory.length;
        
        const lowStock = this.inventory.filter(item => item.currentStock <= item.minStock);
        if (lowStockCount) lowStockCount.textContent = lowStock.length;
        
        const outOfStockItems = this.inventory.filter(item => item.currentStock === 0);
        if (outOfStock) outOfStock.textContent = outOfStockItems.length;
    }

    filterInventory(searchTerm) {
        const rows = document.querySelectorAll('#inventory-tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    filterInventoryByCategory(category) {
        const rows = document.querySelectorAll('#inventory-tbody tr');
        rows.forEach(row => {
            if (!category) {
                row.style.display = '';
            } else {
                const categoryCell = row.cells[2].textContent;
                row.style.display = categoryCell === category ? '' : 'none';
            }
        });
    }

    // Services Management
    getDefaultServices() {
        return [
            {
                id: 1,
                serviceCode: 'CONS001',
                serviceName: 'General Consultation',
                category: 'consultation',
                price: 50,
                duration: 30,
                department: 'general',
                status: 'active',
                description: 'General medical consultation'
            },
            {
                id: 2,
                serviceCode: 'LAB001',
                serviceName: 'Complete Blood Count',
                category: 'diagnostic',
                price: 25,
                duration: 15,
                department: 'laboratory',
                status: 'active',
                description: 'Full blood panel testing'
            },
            {
                id: 3,
                serviceCode: 'XRAY001',
                serviceName: 'Chest X-Ray',
                category: 'diagnostic',
                price: 75,
                duration: 20,
                department: 'radiology',
                status: 'active',
                description: 'Chest radiography examination'
            }
        ];
    }

    openServiceModal(service = null) {
        const modal = document.getElementById('service-modal');
        const title = document.getElementById('service-modal-title');
        const form = document.getElementById('service-form');
        
        if (service) {
            title.textContent = 'Edit Service';
            this.populateServiceForm(service);
        } else {
            title.textContent = 'Add New Service';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateServiceForm(service) {
        document.getElementById('service-code').value = service.serviceCode;
        document.getElementById('service-name').value = service.serviceName;
        document.getElementById('service-category').value = service.category;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-duration').value = service.duration;
        document.getElementById('service-department').value = service.department;
        document.getElementById('service-description').value = service.description || '';
    }

    handleServiceSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const service = Object.fromEntries(formData.entries());
        
        service.id = this.services.length + 1;
        service.price = parseFloat(service.price);
        service.duration = parseInt(service.duration);
        service.status = 'active';
        
        this.services.push(service);
        this.saveData('services', this.services);
        this.loadServicesData();
        
        this.closeModal(document.getElementById('service-modal'));
        this.showNotification('Service added successfully!', 'success');
    }

    loadServicesData() {
        const tbody = document.getElementById('services-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.serviceCode}</td>
                <td>${service.serviceName}</td>
                <td>${service.category}</td>
                <td>$${service.price}</td>
                <td>${service.duration}</td>
                <td>${service.department}</td>
                <td><span class="status-badge status-${service.status}">${service.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="hms.editService(${service.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="hms.deleteService(${service.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Lab Management
    getDefaultTestTypes() {
        return [
            {
                id: 1,
                testCode: 'CBC001',
                testName: 'Complete Blood Count',
                category: 'Hematology',
                price: 25,
                normalRange: 'WBC: 4,000-11,000, RBC: 4.5-5.5M'
            },
            {
                id: 2,
                testCode: 'GLU001',
                testName: 'Blood Glucose',
                category: 'Chemistry',
                price: 15,
                normalRange: '70-100 mg/dL (fasting)'
            },
            {
                id: 3,
                testCode: 'LIP001',
                testName: 'Lipid Panel',
                category: 'Chemistry',
                price: 35,
                normalRange: 'Total Cholesterol < 200 mg/dL'
            }
        ];
    }

    loadLabData() {
        const tbody = document.getElementById('lab-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.labTests.forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${test.testId}</td>
                <td>${test.patientName}</td>
                <td>${test.testType}</td>
                <td>${new Date(test.dateOrdered).toLocaleDateString()}</td>
                <td><span class="status-badge status-${test.status}">${test.status}</span></td>
                <td>$${test.price}</td>
                <td>${test.doctor}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="hms.updateTestStatus('${test.testId}')">Update</button>
                    <button class="btn btn-success btn-sm" onclick="hms.viewResults('${test.testId}')">Results</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        this.updateLabStats();
    }

    updateLabStats() {
        const pendingTests = this.labTests.filter(test => test.status === 'pending').length;
        const completedToday = this.labTests.filter(test => 
            test.status === 'completed' && 
            new Date(test.dateCompleted).toDateString() === new Date().toDateString()
        ).length;
        const totalRevenue = this.labTests
            .filter(test => test.status === 'completed')
            .reduce((sum, test) => sum + test.price, 0);
        
        const pendingElement = document.getElementById('pending-lab-tests');
        const completedElement = document.getElementById('completed-today');
        const revenueElement = document.getElementById('lab-revenue');
        
        if (pendingElement) pendingElement.textContent = pendingTests;
        if (completedElement) completedElement.textContent = completedToday;
        if (revenueElement) revenueElement.textContent = `$${totalRevenue}`;
    }

    // Appointment Management
    loadAppointmentData() {
        const tbody = document.getElementById('appointments-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.appointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.appointmentId}</td>
                <td>${appointment.patientName}</td>
                <td>${appointment.doctor}</td>
                <td>${new Date(appointment.date).toLocaleDateString()}</td>
                <td>${appointment.time}</td>
                <td>${appointment.type}</td>
                <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="hms.editAppointment('${appointment.appointmentId}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="hms.cancelAppointment('${appointment.appointmentId}')">Cancel</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        this.updateAppointmentStats();
    }

    updateAppointmentStats() {
        const today = new Date().toDateString();
        const todayAppointments = this.appointments.filter(apt => 
            new Date(apt.date).toDateString() === today
        ).length;
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= weekStart && aptDate <= weekEnd;
        }).length;
        
        const cancelledToday = this.appointments.filter(apt => 
            apt.status === 'cancelled' && 
            new Date(apt.date).toDateString() === today
        ).length;
        
        const todayElement = document.getElementById('today-appointment-count');
        const weekElement = document.getElementById('week-appointments');
        const cancelledElement = document.getElementById('cancelled-today');
        
        if (todayElement) todayElement.textContent = todayAppointments;
        if (weekElement) weekElement.textContent = weekAppointments;
        if (cancelledElement) cancelledElement.textContent = cancelledToday;
    }

    // Dashboard
    loadDashboardStats() {
        const totalPatientsElement = document.getElementById('total-patients');
        const todayAppointmentsElement = document.getElementById('today-appointments');
        const pendingTestsElement = document.getElementById('pending-tests');
        const lowStockElement = document.getElementById('low-stock');
        
        if (totalPatientsElement) {
            totalPatientsElement.textContent = this.patients.length;
        }
        
        if (todayAppointmentsElement) {
            const today = new Date().toDateString();
            const todayAppointments = this.appointments.filter(apt => 
                new Date(apt.date).toDateString() === today
            ).length;
            todayAppointmentsElement.textContent = todayAppointments;
        }
        
        if (pendingTestsElement) {
            const pendingTests = this.labTests.filter(test => test.status === 'pending').length;
            pendingTestsElement.textContent = pendingTests;
        }
        
        if (lowStockElement) {
            const lowStock = this.inventory.filter(item => item.currentStock <= item.minStock).length;
            lowStockElement.textContent = lowStock;
        }
    }

    // Utility Methods
    closeModal(modal) {
        modal.style.display = 'none';
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // CRUD Operations (placeholders for full implementation)
    editPatient(id) {
        this.showNotification('Edit patient functionality to be implemented', 'info');
    }

    deletePatient(id) {
        if (confirm('Are you sure you want to delete this patient?')) {
            this.patients = this.patients.filter(patient => patient.id !== id);
            this.saveData('patients', this.patients);
            this.loadPatientData();
            this.loadDashboardStats();
            this.showNotification('Patient deleted successfully', 'success');
        }
    }

    editItem(id) {
        const item = this.inventory.find(item => item.id === id);
        if (item) {
            this.openItemModal(item);
        }
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.inventory = this.inventory.filter(item => item.id !== id);
            this.saveData('inventory', this.inventory);
            this.loadInventoryData();
            this.showNotification('Item deleted successfully', 'success');
        }
    }

    editService(id) {
        const service = this.services.find(service => service.id === id);
        if (service) {
            this.openServiceModal(service);
        }
    }

    deleteService(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            this.services = this.services.filter(service => service.id !== id);
            this.saveData('services', this.services);
            this.loadServicesData();
            this.showNotification('Service deleted successfully', 'success');
        }
    }

    updateTestStatus(testId) {
        this.showNotification('Update test status functionality to be implemented', 'info');
    }

    viewResults(testId) {
        this.showNotification('View test results functionality to be implemented', 'info');
    }

    editAppointment(appointmentId) {
        this.showNotification('Edit appointment functionality to be implemented', 'info');
    }

    cancelAppointment(appointmentId) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            const appointment = this.appointments.find(apt => apt.appointmentId === appointmentId);
            if (appointment) {
                appointment.status = 'cancelled';
                this.saveData('appointments', this.appointments);
                this.loadAppointmentData();
                this.showNotification('Appointment cancelled successfully', 'success');
            }
        }
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hms = new HospitalManagementSystem();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HospitalManagementSystem;
}