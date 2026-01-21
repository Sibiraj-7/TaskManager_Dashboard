document.addEventListener("DOMContentLoaded", () => {

    const filterButtons = document.querySelectorAll(".filter-btn");
    const tasksGrid = document.querySelector(".tasks-grid");
    const taskCards = document.querySelectorAll(".tasks-grid .task-card");

    taskCards.forEach(card => {
        card.dataset.priority = getPriority(card);
    });

    filterButtons.forEach(button => {
        button.addEventListener("click",() => {
            setActiveFilter(button);
            filterTasks(button.textContent.trim().toLowerCase());
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

    taskForm.addEventListener("submit",e =>{
        e.preventDefault();

        const taskData = taskFormData(taskForm);
        if(!taskData.isValid) return;
        const taskId = Date.now().toString();
        const taskCard = createTask(taskData, taskId);
        tasksGrid.appendChild(taskCard);
        storeTask(taskData, taskId);
        applyActiveFilter(taskCard);
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
            card.style.display = 
                filter === "all" || card.dataset.priority === filter ? "" : "none";
        });
    }

    function taskFormData(form){
        const taskName = form.querySelector("#taskName").value.trim();
        const userName = form.querySelector("#userName").value.trim();
        const email = form.querySelector("input[type='email']").value.trim();
        const date = form.querySelector("input[type='date']").value;
        const time = form.querySelector("input[type='time']").value;
        const priority = form.querySelector("select").value;
        const description = form.querySelector("textarea").value.trim();
        const status = form.querySelector("input[name='status']:checked")?.value || "Pending";
        const progress = Number.parseInt(form.querySelector(".progress-slider")?.value ?? "0", 10) || 0;
        const taskType = Array.from(form.querySelectorAll("input[name='taskType']:checked")).map(el => el.value);

        return {
            taskName,
            userName,
            email,
            date,
            time,
            priority,
            description,
            status,
            progress,
            taskType,
            isValid: taskName && userName && email && date && priority
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

        const filter = activeBtn.textContent.trim().toLowerCase();
        if(filter !== "all" && card.dataset.priority !== filter){
            card.style.display = "none";
        }
    }

    function deleteTask(button) {
        const card = button.closest(".task-card");
        if (!card) return;

        const key = card.dataset.id;

        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.filter(task => task.id !== key);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        card.remove();
    }
    
    function openEditModal(card) {
        const modal = document.getElementById("editModal");
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
        document.getElementById("editPriority").value = task.data.priority;
        document.getElementById("editDescription").value = task.data.description;
        if (editProgressSlider) editProgressSlider.value = task.data.progress ?? 0;
        if (editProgressText) editProgressText.textContent = `${editProgressSlider?.value ?? 0}%`;

        const editTypes = Array.isArray(task.data.taskType) ? task.data.taskType : [];
        document.querySelectorAll("#editTaskType input[type='checkbox']").forEach(cb => {
            cb.checked = editTypes.includes(cb.value);
        });

        const editStatus = task.data.status || "Pending";
        const statusRadio = document.querySelector(`#editTaskStatus input[type="radio"][value="${CSS.escape(editStatus)}"]`);
        if (statusRadio) statusRadio.checked = true;

        modal.classList.add("show");
    }

    document.getElementById("closeModal").addEventListener("click", () => {
        document.getElementById("editModal").classList.remove("show");
    });

    document.getElementById("editForm").addEventListener("submit", e => {
        e.preventDefault();

        const taskId = document.getElementById("editTaskId").value;

        const updatedData = {
            taskName: document.getElementById("editTaskName").value.trim(),
            userName: document.getElementById("editUserName").value.trim(),
            email: document.getElementById("editEmail").value.trim(),
            date: document.getElementById("editDate").value,
            time: document.getElementById("editTime").value,
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

        document.getElementById("editModal").classList.remove("show");
    });


    document.addEventListener("click",e=>{
        if(e.target.classList.contains("delete-btn")){
            deleteTask(e.target);
        }
        if (e.target.classList.contains("edit-btn")) {
            const card = e.target.closest(".task-card");
            openEditModal(card);
        }
    });
});