let categories = {};
        let darkMode = false;

        function loadFromLocalStorage() {
            const storedCategories = localStorage.getItem('todoCategories');
            if (storedCategories) {
                categories = JSON.parse(storedCategories);
                renderCategories();
            }
            darkMode = localStorage.getItem('darkMode') === 'true';
            updateDarkMode();
        }

        function saveToLocalStorage() {
            localStorage.setItem('todoCategories', JSON.stringify(categories));
            localStorage.setItem('darkMode', darkMode);
        }

        function toggleDarkMode() {
            darkMode = !darkMode;
            updateDarkMode();
            saveToLocalStorage();
        }

        function updateDarkMode() {
            document.body.classList.toggle('dark-mode', darkMode);
            document.querySelector('.dark-mode-toggle i').className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }

        function addCategory() {
            const categoryName = document.getElementById('categoryInput').value;
            if (categoryName && !(categoryName in categories)) {
                categories[categoryName] = [];
                renderCategories();
                saveToLocalStorage();
            }
            document.getElementById('categoryInput').value = '';
        }

        function deleteCategory(categoryName) {
            if (confirm(`Are you sure you want to delete the category "${categoryName}" and all its tasks?`)) {
                const categoryDiv = document.querySelector(`[data-category="${categoryName}"]`);
                categoryDiv.classList.add('fade-out');
                categoryDiv.addEventListener('animationend', () => {
                    delete categories[categoryName];
                    renderCategories();
                    saveToLocalStorage();
                });
            }
        }

        function renameCategory(oldName) {
            const newName = prompt(`Enter new name for category "${oldName}":`, oldName);
            if (newName && newName !== oldName && !(newName in categories)) {
                categories[newName] = categories[oldName];
                delete categories[oldName];
                renderCategories();
                saveToLocalStorage();
            }
        }

        function addTask(categoryName) {
            const taskInput = document.getElementById(`taskInput_${categoryName}`);
            const taskName = taskInput.value;
            const priority = document.getElementById(`priority_${categoryName}`).value;
            const dueDate = document.getElementById(`dueDate_${categoryName}`).value;
            if (taskName) {
                categories[categoryName].push({name: taskName, priority: priority, dueDate: dueDate});
                renderCategories();
                saveToLocalStorage();
            }
            taskInput.value = '';
        }

        function editTask(categoryName, index) {
            const task = categories[categoryName][index];
            const newName = prompt('Edit task name:', task.name);
            if (newName !== null) {
                task.name = newName;
                task.priority = prompt('Edit priority (high/medium/low):', task.priority);
                task.dueDate = prompt('Edit due date (YYYY-MM-DD):', task.dueDate);
                renderCategories();
                saveToLocalStorage();
            }
        }

        function deleteTask(categoryName, index) {
            const taskDiv = document.querySelector(`[data-category="${categoryName}"] .task:nth-child(${index + 1})`);
            taskDiv.classList.add('fade-out');
            taskDiv.addEventListener('animationend', () => {
                categories[categoryName].splice(index, 1);
                renderCategories();
                saveToLocalStorage();
            });
        }

        function sortTasks(categoryName, sortBy) {
            categories[categoryName].sort((a, b) => {
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                } else if (sortBy === 'priority') {
                    const priorityOrder = {'high': 0, 'medium': 1, 'low': 2};
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                } else if (sortBy === 'dueDate') {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
            });
            renderCategories();
            saveToLocalStorage();
        }

        function renderCategories() {
            const categoriesDiv = document.getElementById('categories');
            categoriesDiv.innerHTML = '';

            for (const categoryName in categories) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category';
                categoryDiv.setAttribute('data-category', categoryName);
                categoryDiv.innerHTML = `
                    <div class="category-header">
                        <span class="category-title">${categoryName}</span>
                        <div class="category-actions">
                            <button onclick="renameCategory('${categoryName}')"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteCategory('${categoryName}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="add-task">
                        <input type="text" id="taskInput_${categoryName}" placeholder="New Task">
                        <select id="priority_${categoryName}">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <input type="date" id="dueDate_${categoryName}">
                        <button onclick="addTask('${categoryName}')"><i class="fas fa-plus"></i> Add Task</button>
                    </div>
                    <div class="sort-options">
                        <button onclick="sortTasks('${categoryName}', 'name')"><i class="fas fa-sort-alpha-down"></i> Name</button>
                        <button onclick="sortTasks('${categoryName}', 'priority')"><i class="fas fa-exclamation"></i> Priority</button>
                        <button onclick="sortTasks('${categoryName}', 'dueDate')"><i class="far fa-calendar-alt"></i> Due Date</button>
                    </div>
                    <div id="tasks_${categoryName}"></div>
                `;
                categoriesDiv.appendChild(categoryDiv);

                const tasksDiv = categoryDiv.querySelector(`#tasks_${categoryName}`);
                categories[categoryName].forEach((task, index) => {
                    const taskDiv = document.createElement('div');
                    taskDiv.className = `task ${task.priority}-priority`;
                    taskDiv.draggable = true;
                    taskDiv.innerHTML = `
                        <div class="task-info">
                            ${task.name} (Priority: ${task.priority}, Due: ${task.dueDate})
                        </div>
                        <div class="task-actions">
                            <button onclick="editTask('${categoryName}', ${index})"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteTask('${categoryName}', ${index})"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    taskDiv.addEventListener('dragstart', drag);
                    tasksDiv.appendChild(taskDiv);
                });

                tasksDiv.addEventListener('dragover', allowDrop);
                tasksDiv.addEventListener('drop', (event) => drop(event, categoryName));
            }
        }

        function drag(event) {
            const taskInfo = {
                task: event.target.querySelector('.task-info').innerText,
                sourceCategory: event.target.closest('.category').querySelector('.category-title').innerText,
                sourceIndex: Array.from(event.target.parentElement.children).indexOf(event.target)
            };
            event.dataTransfer.setData('text/plain', JSON.stringify(taskInfo));
        }

        function allowDrop(event) {
            event.preventDefault();
        }

        function drop(event, targetCategory) {
            event.preventDefault();
            const taskInfo = JSON.parse(event.dataTransfer.getData('text'));
            if (taskInfo.sourceCategory !== targetCategory) {
                const task = categories[taskInfo.sourceCategory][taskInfo.sourceIndex];
                categories[taskInfo.sourceCategory].splice(taskInfo.sourceIndex, 1);
                categories[targetCategory].push(task);
                renderCategories();
                saveToLocalStorage();
            }
        }

        // Load data from local storage on page load
        loadFromLocalStorage();