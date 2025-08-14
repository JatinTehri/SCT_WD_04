 document.addEventListener('DOMContentLoaded', function() {
            const taskInput = document.getElementById('taskInput');
            const taskDateTime = document.getElementById('taskDateTime');
            const addTaskBtn = document.getElementById('addTaskBtn');
            const taskList = document.getElementById('taskList');
            const filterSelect = document.getElementById('filterSelect');
            const clearCompletedBtn = document.getElementById('clearCompletedBtn');
            const taskCount = document.getElementById('taskCount');
            
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let editMode = false;
            let currentEditId = null;
            
            // Initialize the app
            function init() {
                renderTasks();
                addEventListeners();
                createParticles();
                
                // Set min date/time to current
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                taskDateTime.min = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            
            // Add event listeners
            function addEventListeners() {
                addTaskBtn.addEventListener('click', addOrUpdateTask);
                taskInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') addOrUpdateTask();
                });
                filterSelect.addEventListener('change', renderTasks);
                clearCompletedBtn.addEventListener('click', clearCompletedTasks);
            }
            
            // Add or update task
            function addOrUpdateTask() {
                const taskText = taskInput.value.trim();
                const taskDate = taskDateTime.value;
                
                if (!taskText) {
                    alert('Please enter a task');
                    return;
                }
                
                if (editMode) {
                    // Update existing task
                    const taskIndex = tasks.findIndex(task => task.id === currentEditId);
                    if (taskIndex !== -1) {
                        tasks[taskIndex].text = taskText;
                        tasks[taskIndex].dateTime = taskDate;
                        saveTasks();
                        resetForm();
                    }
                } else {
                    // Add new task
                    const newTask = {
                        id: Date.now(),
                        text: taskText,
                        dateTime: taskDate,
                        completed: false,
                        createdAt: new Date().toISOString()
                    };
                    
                    tasks.push(newTask);
                    saveTasks();
                    resetForm();
                }
                
                renderTasks();
            }
            
            // Render tasks based on filter
            function renderTasks() {
                const filter = filterSelect.value;
                let filteredTasks = tasks;
                
                if (filter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (filter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }
                
                updateTaskCount();
                
                if (filteredTasks.length === 0) {
                    taskList.innerHTML = `
                        <li class="no-tasks">
                            <i class="far ${filter === 'completed' ? 'fa-check-circle' : 'fa-list-alt'}"></i>
                            <p>No ${filter === 'all' ? '' : filter} tasks found</p>
                        </li>
                    `;
                    return;
                }
                
                taskList.innerHTML = '';
                
                // Sort tasks: incomplete first, then by creation date
                filteredTasks.sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                
                filteredTasks.forEach(task => {
                    const taskItem = document.createElement('li');
                    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                    
                    const formattedDate = task.dateTime ? formatDateTime(task.dateTime) : 'No deadline';
                    const createdDate = formatDate(task.createdAt);
                    
                    taskItem.innerHTML = `
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                        <div class="task-content">
                            <div class="task-title ${task.completed ? 'completed' : ''}">${task.text}</div>
                            <div class="task-details">
                                <span><i class="far fa-clock"></i> ${formattedDate}</span>
                                <span><i class="far fa-calendar-alt"></i> Added: ${createdDate}</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="btn-edit" data-id="${task.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-delete" data-id="${task.id}">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                    `;
                    
                    taskList.appendChild(taskItem);
                });
                
                // Add event listeners to checkboxes, edit and delete buttons
                document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', toggleTaskCompletion);
                });
                
                document.querySelectorAll('.btn-edit').forEach(btn => {
                    btn.addEventListener('click', editTask);
                });
                
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', deleteTask);
                });
            }
            
            // Update task counter
            function updateTaskCount() {
                const total = tasks.length;
                const completed = tasks.filter(task => task.completed).length;
                const active = total - completed;
                
                let countText = '';
                if (filterSelect.value === 'all') {
                    countText = `${total} tasks (${active} active, ${completed} completed)`;
                } else if (filterSelect.value === 'active') {
                    countText = `${active} active tasks`;
                } else {
                    countText = `${completed} completed tasks`;
                }
                
                taskCount.textContent = countText;
            }
            
            // Toggle task completion status
            function toggleTaskCompletion(e) {
                const taskId = parseInt(e.target.dataset.id);
                const taskIndex = tasks.findIndex(task => task.id === taskId);
                
                if (taskIndex !== -1) {
                    tasks[taskIndex].completed = e.target.checked;
                    saveTasks();
                    renderTasks();
                }
            }
            
            // Edit task
            function editTask(e) {
                const taskId = parseInt(e.target.dataset.id);
                const task = tasks.find(task => task.id === taskId);
                
                if (task) {
                    taskInput.value = task.text;
                    taskDateTime.value = task.dateTime || '';
                    addTaskBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
                    addTaskBtn.className = 'btn-edit';
                    editMode = true;
                    currentEditId = taskId;
                    taskInput.focus();
                }
            }
            
            // Delete task
            function deleteTask(e) {
                if (confirm('Are you sure you want to delete this task?')) {
                    const taskId = parseInt(e.target.dataset.id);
                    tasks = tasks.filter(task => task.id !== taskId);
                    saveTasks();
                    renderTasks();
                    
                    // If we were editing this task, reset the form
                    if (editMode && currentEditId === taskId) {
                        resetForm();
                    }
                }
            }
            
            // Clear completed tasks
            function clearCompletedTasks() {
                if (confirm('Are you sure you want to clear all completed tasks?')) {
                    tasks = tasks.filter(task => !task.completed);
                    saveTasks();
                    renderTasks();
                }
            }
            
            // Reset the form
            function resetForm() {
                taskInput.value = '';
                taskDateTime.value = '';
                addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
                addTaskBtn.className = 'btn-add';
                editMode = false;
                currentEditId = null;
            }
            
            // Save tasks to localStorage
            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            // Format date/time for display
            function formatDateTime(dateTimeString) {
                if (!dateTimeString) return 'No deadline';
                
                const date = new Date(dateTimeString);
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Format date for display
            function formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            // Create floating particles background
            function createParticles() {
                const particlesContainer = document.getElementById('particles');
                const particleCount = Math.floor(window.innerWidth / 10);
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.classList.add('particle');
                    
                    // Random size between 1px and 3px
                    const size = Math.random() * 2 + 1;
                    particle.style.width = `${size}px`;
                    particle.style.height = `${size}px`;
                    
                    // Random position
                    particle.style.left = `${Math.random() * 100}%`;
                    particle.style.top = `${Math.random() * 100}%`;
                    
                    // Random animation
                    const duration = Math.random() * 20 + 10;
                    const delay = Math.random() * 5;
                    particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite alternate`;
                    
                    particlesContainer.appendChild(particle);
                }
                
                // Add animation for particles
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes float {
                        0% {
                            transform: translate(0, 0);
                            opacity: 0.3;
                        }
                        50% {
                            opacity: 0.7;
                        }
                        100% {
                            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px);
                            opacity: 0.3;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Initialize the app
            init();
        });