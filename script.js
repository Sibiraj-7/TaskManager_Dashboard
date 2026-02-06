document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("year").textContent = new Date().getFullYear();
    const filterButtons = document.querySelectorAll(".filter-btn");
    const tasksGrid = document.querySelector(".tasks-grid");
    const taskCards = document.querySelectorAll(".tasks-grid .task-card");

    taskCards.forEach(card => {
        card.dataset.priority = getPriority(card);
    });

    filterButtons.forEach(button => {
        button.addEventListener("click",() => {
            setActiveFilter(button);
            const filterText = button.textContent.trim();
            const baseFilter = filterText.split(' ')[0].toLowerCase();
            filterTasks(baseFilter);
        });
    });

    function wireProgress(slider, text) {
        if (!slider || !text) return;
        const updateProgress = () => (text.textContent = `${slider.value}%`);
        slider.addEventListener("input", updateProgress);
        updateProgress();
    }

    const progressSlider = document.querySelector(".task-form .progress-slider");
    const progressText = document.querySelector(".task-form .progress-text");
    wireProgress(progressSlider, progressText);

    const editProgressSlider = document.getElementById("editProgress");
    const editProgressText = document.getElementById("editProgressText");
    wireProgress(editProgressSlider, editProgressText);

    const taskForm = document.querySelector(".task-form");
    if(!taskForm || !tasksGrid) return;

    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [] ;
    savedTasks.forEach(task => {
        const card = createTask(task.data , task.id);
        tasksGrid.appendChild(card);
    });
    updateFilterCounts();
    updatePlaceholder();

    taskForm.addEventListener("submit",e =>{
        e.preventDefault();

        const taskData = taskFormData(taskForm);
        const taskId = Date.now().toString();
        const taskCard = createTask(taskData, taskId);
        tasksGrid.appendChild(taskCard);
        storeTask(taskData, taskId);
        applyActiveFilter(taskCard);
        updateFilterCounts();
        updatePlaceholder();
        showNotification("Task created successfully!!");
        taskForm.reset();
        if (progressSlider) progressSlider.value = 0;
        if (progressText) progressText.textContent = "0%";
    });

    function getPriority(card) {
        if(card.querySelector(".badge-high")) return "high";
        if(card.querySelector(".badge-medium")) return "medium";
        if(card.querySelector(".badge-low")) return "low";
        return "all";
    }

    function setActiveFilter(activeBtn){
        filterButtons.forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    function filterTasks(filter){
        document.querySelectorAll(".tasks-grid .task-card").forEach(card => {
            card.style.display = filter === "all" || card.dataset.priority === filter ? "" : "none";
        });
    }

    function updateFilterCounts(){
        const allCards = document.querySelectorAll(".tasks-grid .task-card");
        const counts = {
            all: allCards.length,
            high: 0,
            medium: 0,
            low: 0
        };

        allCards.forEach(card => {
            const priority = card.dataset.priority || getPriority(card);
            if(priority === "high") counts.high++;
            else if(priority === "medium") counts.medium++;
            else if(priority === "low") counts.low++;
        });

        filterButtons.forEach(button => {
            const buttonText = button.textContent.trim();
            const baseText = buttonText.split(' ')[0];
            function filterCount(baseText,type){
                if(baseText.toLowerCase()==type){
                    button.textContent = `${baseText} (${counts[type]})`;
                }
            }
            filterCount(baseText,'all');
            filterCount(baseText,'high');
            filterCount(baseText,'medium');
            filterCount(baseText,'low');
        });
    }

    function updatePlaceholder() {
        const placeholder = document.getElementById("taskPlaceholder");
        if (!placeholder || !tasksGrid) return;
        const cardCount = tasksGrid.querySelectorAll(".task-card").length;
        placeholder.style.display = cardCount === 0 ? "flex" : "none";
    }

    function taskFormData(form){
        const taskName = form.querySelector("#taskName").value.trim();
        const userName = form.querySelector("#userName").value.trim();
        const email = form.querySelector("input[type='email']").value.trim();
        const date = form.querySelector("input[type='date']").value;
        const time = form.querySelector("input[type='time']").value;
        const estimatedHours = form.querySelector("input[type='number']").value;
        const projectUrl = form.querySelector("input[type='url']").value;
        const priority = form.querySelector("select").value;
        const description = form.querySelector("textarea").value.trim();
        const status = form.querySelector("input[name='status']:checked")?.value || "Pending";
        const progress = Number.parseInt(form.querySelector(".progress-slider")?.value ?? "0", 10) || 0;
        const taskType = [];
        const checked = form.querySelectorAll("input[name='taskType']:checked");

        for (let i = 0; i < checked.length; i++) {
            taskType.push(checked[i].value);
        }
        
        return {
            taskName,
            userName,
            email,
            date,
            time,
            estimatedHours,
            projectUrl,
            priority,
            description,
            status,
            progress,
            taskType
        };
    }

    function storeTask(data,key){
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.push({data, id:key});
        localStorage.setItem("tasks",JSON.stringify(tasks));
    }

    function createTask(data, key){
        const priorityKey = data.priority.toLowerCase().replace(" priority","");
        const statusKey = data.status.toLowerCase().replace("in ", "");

        const formattedDate = new Date(data.date).toLocaleDateString("en-US",{
            month:"short",
            day:"numeric",
            year:"numeric"
        });

        const displayName = data.userName;
        const card = document.createElement("div");
        card.className = "task-card";
        card.dataset.priority = priorityKey;
        card.dataset.id = key;

        card.innerHTML = `
            <div class="card-actions">
                <button class="edit-btn" title="Edit">🖍</button>
                <button class="delete-btn" title="Delete">🗑️</button>
            </div>

            <h3 class = "task-title">${data.taskName}</h3>
            <p class = "task-description">${data.description || "No description Provided."}</p>
            
            <div class = "task-meta">
                <div class ="meta-item">🗓️ Due: ${formattedDate} ${data.time ? `${data.time}`: ""}</div>
                <div class ="meta-item">👤 ${displayName}</div>
            </div>

            <div class ="task-footer">
                <span class="badge badge-${priorityKey}">
                    ● ${data.priority.split(" ")[0].toUpperCase()}
                </span>
                <span class="badge badge-${statusKey}">
                    <span class="dot-${statusKey}">●</span> ${data.status}
                </span>
            </div>
        `;

        return card;
    }

    function applyActiveFilter(card){
        const activeBtn = document.querySelector(".filter-btn.active");
        if(!activeBtn) return;

        const filterText = activeBtn.textContent.trim();
        const filter = filterText.split(' ')[0].toLowerCase();
        if(filter !== "all" && card.dataset.priority !== filter){
            card.style.display = "none";
        }
    }
    
    let taskDelete = null;
    function deleteTask(button) {
        const card = button.closest(".task-card");
        if (!card) return;
        taskDelete = card;

        const key = card.dataset.id;
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const tasktodel = tasks.find(task => task.id === key);
        const taskname = tasktodel.data.taskName;
        
        document.getElementById("deleteMessage").textContent = `Are you sure you want to delete the task "${taskname}" ?`;
        openModal('delete-popup');
    }

    document.getElementById("confirm-delete-btn").addEventListener('click',() => {
        if(!taskDelete) return;
        const key = taskDelete.dataset.id;
        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.filter(task => task.id !== key);
        localStorage.setItem('tasks',JSON.stringify(tasks));
        taskDelete.remove();
        taskDelete = null;
        closeModal('delete-popup');
        updateFilterCounts();
        updatePlaceholder();
        showNotification("Task deleted Successfully!!");
    });
    document.getElementById("cancel-delete-btn").addEventListener("click", () => {
        closeModal("delete-popup");
        taskDelete = null;
    });
    document.getElementById("delete-popup").addEventListener("click", e => {
        if (e.target.id === "delete-popup") {
            closeModal("delete-popup");
        }
    });
    
    function openEditModal(card) {
        const taskId = card.dataset.id;

        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById("editTaskId").value = taskId;
        document.getElementById("editTaskName").value = task.data.taskName;
        document.getElementById("editUserName").value = task.data.userName;
        document.getElementById("editEmail").value = task.data.email;
        document.getElementById("editDate").value = task.data.date;
        document.getElementById("editTime").value = task.data.time;
        document.getElementById("editEstimation").value = task.data.estimatedHours;
        document.getElementById("editProject").value = task.data.projectUrl;
        document.getElementById("editPriority").value = task.data.priority;
        document.getElementById("editDescription").value = task.data.description;
        if (editProgressSlider) editProgressSlider.value = task.data.progress ?? 0;
        if (editProgressText) editProgressText.textContent = `${editProgressSlider?.value ?? 0}%`;

        const editTypes = Array.isArray(task.data.taskType) ? task.data.taskType : [];
        document.querySelectorAll("#editTaskType input[type='checkbox']").forEach(cb => {
            cb.checked = editTypes.includes(cb.value);
        });

        const editStatus = task.data.status || "Pending";
        const radios = document.querySelectorAll('input[name="editStatus"]');

        for (let i = 0; i < radios.length; i++) {
            if (radios[i].value === editStatus) {
                radios[i].checked = true;
            } else {
                radios[i].checked = false;
            }
        }

        openModal("editModal");
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add("show");
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove("show");
    }

    document.getElementById("cancelEdit")?.addEventListener("click", () => closeModal("editModal"));
    document.getElementById("closeModal")?.addEventListener("click", () => closeModal("editModal"));
    
    document.getElementById("editForm").addEventListener("submit", e => {
        e.preventDefault();

        const modal = document.getElementById("editModal");

        if (modal.dataset.viewOnly === "true") {
            closeModal("editModal");
            delete modal.dataset.viewOnly;
            return;
        }

        const taskId = document.getElementById("editTaskId").value;

        const updatedData = {
            taskName: document.getElementById("editTaskName").value.trim(),
            userName: document.getElementById("editUserName").value.trim(),
            email: document.getElementById("editEmail").value.trim(),
            date: document.getElementById("editDate").value,
            time: document.getElementById("editTime").value,
            estimatedHours:document.getElementById("editEstimation").value,
            projectUrl:document.getElementById("editProject").value,
            priority: document.getElementById("editPriority").value,
            description: document.getElementById("editDescription").value,
            status: document.querySelector("input[name='editStatus']:checked")?.value || "Pending",
            progress: Number.parseInt(document.getElementById("editProgress")?.value ?? "0", 10) || 0,
            taskType: Array.from(document.querySelectorAll("#editTaskType input[type='checkbox']:checked")).map(el => el.value)
        };

        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.map(t =>
            t.id === taskId ? { ...t, data: updatedData } : t
        );

        localStorage.setItem("tasks", JSON.stringify(tasks));
        const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
        const newCard = createTask(updatedData, taskId);
        card.replaceWith(newCard);
        applyActiveFilter(newCard);
        updateFilterCounts();
        showNotification("Task Edited Successfully!!"); 

        closeModal("editModal");
    });

    document.addEventListener("click",e=>{
        if(e.target.classList.contains("delete-btn")){
            deleteTask(e.target);
            return;
        }
        if (e.target.classList.contains("edit-btn")) {
            const card = e.target.closest(".task-card");
            if (!card) return;

            const taskId = card.dataset.id;
            const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
            const existsinLS = taskId && tasks.some(t => t.id === taskId);

            if (existsinLS) {
                openEditModal(card);
            } else {
                staticCardView(card);
            }
            return;
        }
            
        const card = e.target.closest(".task-card");
        if (card && !e.target.closest(".card-actions")) {
            openViewModal(card);
        }
    });

    function openViewModal(card) {
        const taskId = card.dataset.id;
        
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.data) {
            const data = task.data;
            const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
            
            document.getElementById("viewTaskName").textContent = data.taskName || "Not provided";
            document.getElementById("viewUserName").textContent = data.userName || "Not provided";
            document.getElementById("viewEmail").textContent = data.email || "Not provided";
            document.getElementById("viewDate").textContent = formattedDate || "Not provided";
            document.getElementById("viewTime").textContent = data.time || "Not specified";
            
            const priorityKey = data.priority.toLowerCase().replace(" priority", "");
            const priorityBadge = `<span class="badge badge-${priorityKey}">● ${data.priority.split(" ")[0].toUpperCase()}</span>`;
            document.getElementById("viewPriority").innerHTML = priorityBadge;
            
            document.getElementById("viewEstimation").textContent = data.estimatedHours ? `${data.estimatedHours} hours` : "Not specified";
            
            if (data.projectUrl) {
                document.getElementById("viewProject").innerHTML = `<a href="${data.projectUrl}" target="_blank" rel="noopener noreferrer">${data.projectUrl}</a>`;
            } else {
                document.getElementById("viewProject").textContent = "Not provided";
            }
            
            document.getElementById("viewProgress").textContent = `${data.progress || 0}%`;
            
            const taskTypes = data.taskType.join(", ") || "Not specified";
            document.getElementById("viewTaskType").textContent = taskTypes;
            
            const statusKey = data.status.toLowerCase().replace("in ", "");
            const statusBadge = `<span class="badge badge-${statusKey}"><span class="dot-${statusKey}">●</span> ${data.status}</span>`;
            document.getElementById("viewStatus").innerHTML = statusBadge;
            
            document.getElementById("viewDescription").textContent = data.description || "No description provided.";
        } else {
            const title = card.querySelector(".task-title")?.textContent.trim() || "Not provided";
            const description = card.querySelector(".task-description")?.textContent.trim() || "No description provided.";
            const userName = card.querySelector(".user-name")?.textContent.replace("👤", "").trim() || "Not provided";
            const dateText = card.querySelector(".date-time")?.textContent.replace("📅 Due:", "").trim() || "";
            
            document.getElementById("viewTaskName").textContent = title;
            document.getElementById("viewUserName").textContent = userName;
            document.getElementById("viewEmail").textContent = "Not available";
            document.getElementById("viewDate").textContent = dateText || "Not provided";
            document.getElementById("viewTime").textContent = "Not specified";
            
            const priorityKey = getPriority(card);
            const priorityMap = {
                high: "High Priority",
                medium: "Medium Priority",
                low: "Low Priority"
            };
            const priorityBadge = `<span class="badge badge-${priorityKey}">● ${priorityMap[priorityKey]?.split(" ")[0].toUpperCase() || "MEDIUM"}</span>`;
            document.getElementById("viewPriority").innerHTML = priorityBadge;
            
            document.getElementById("viewEstimation").textContent = "Not specified";
            document.getElementById("viewProject").textContent = "Not provided";
            document.getElementById("viewProgress").textContent = "0%";
            document.getElementById("viewTaskType").textContent = "Not specified";
            
            const statusValue = getStatus(card);
            const statusKey = statusValue.toLowerCase().replace("in ", "");
            const statusBadge = `<span class="badge badge-${statusKey}"><span class="dot-${statusKey}">●</span> ${statusValue}</span>`;
            document.getElementById("viewStatus").innerHTML = statusBadge;
            
            document.getElementById("viewDescription").textContent = description;
        }
        
        openModal("viewModal");
    }

    document.getElementById("closeViewModal")?.addEventListener("click", () => closeModal("viewModal"));
    
    document.getElementById("viewModal")?.addEventListener("click", (e) => {
        if (e.target.id === "viewModal") {
            closeModal("viewModal");
        }
    });
    
    document.getElementById("editModal")?.addEventListener("click", (e) => {
        if (e.target.id === "editModal") {
            closeModal("editModal");
        }
    }); 

    function staticCardView(card) {
        const modal = document.getElementById("editModal");

        document.getElementById("editTaskName").value =
            card.querySelector(".task-title")?.textContent.trim() || "";

        document.getElementById("editDescription").value =
            card.querySelector(".task-description")?.textContent.trim() || "";

        const userText = card.querySelector(".user-name")?.textContent || "";
        document.getElementById("editUserName").value =
            userText.replace("👤", "").trim();

        const dateText = card.querySelector(".date-time")?.textContent || "";
        const rawDate = dateText.replace("📅 Due:", "").trim();

        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate)) {
            document.getElementById("editDate").value =
                parsedDate.toISOString().split("T")[0];
        }

        document.getElementById("editEmail").value = "";
        document.getElementById("editTime").value = "";
        const priorityKey = getPriority(card);

        const priorityMap = {
            high: "High Priority",
            medium: "Medium Priority",
            low: "Low Priority"
        };

        document.getElementById("editPriority").value =
            priorityMap[priorityKey] || "Low Priority";

        document.getElementById("editEstimation").value="";
        document.getElementById("editProject").value="";
        
        const statusValue = getStatus(card);

        const radios = document.querySelectorAll('input[name="editStatus"]');

        for (let i = 0; i < radios.length; i++) {
            if (radios[i].value === statusValue) {
                radios[i].checked = true;
            } else {
                radios[i].checked = false;
            }
        }

        document.getElementById("editTaskId").value = "";

        modal.dataset.viewOnly = "true";

        openModal("editModal");
    }

    function getStatus(card) {
        if(card.querySelector(".badge-pending")) return "Pending";
        if(card.querySelector(".badge-progress")) return "In Progress";
        if(card.querySelector(".badge-completed")) return "Completed";
        return "Pending"
    }

    function showNotification(message) {
        const notify = document.getElementById("notification");
        if (!notify) return;

        notify.textContent = message;
        notify.classList.add("show");

        setTimeout(() => {
            notify.classList.remove("show");
        }, 3000);
    }
});