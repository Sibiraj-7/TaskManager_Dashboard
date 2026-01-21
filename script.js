document.addEventListener("DOMContentLoaded", () => {

    const tasksGrid = document.querySelector(".tasks-grid");
    const filterButtons = document.querySelectorAll(".filter-btn");

    const taskForm = document.querySelector(".task-form");
    const progressSlider = document.querySelector(".task-form .progress-slider");
    const progressText = document.querySelector(".task-form .progress-text");

    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const closeModalBtn = document.getElementById("closeModal");
    const cancelEditBtn = document.getElementById("cancelEdit");

    const editProgressSlider = document.getElementById("editProgress");
    const editProgressText = document.getElementById("editProgressText");

    if (!tasksGrid || !taskForm) return;

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add("show");
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove("show");
    }

    closeModalBtn?.addEventListener("click", () => closeModal(editModal));
    cancelEditBtn?.addEventListener("click", () => closeModal(editModal));

    function wireProgress(slider, text) {
        if (!slider || !text) return;
        const update = () => (text.textContent = `${slider.value}%`);
        slider.addEventListener("input", update);
        update();
    }

    wireProgress(progressSlider, progressText);
    wireProgress(editProgressSlider, editProgressText);

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setActiveFilter(btn);
            filterTasks(btn.textContent.trim().toLowerCase());
        });
    });

    function setActiveFilter(activeBtn) {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    function filterTasks(filter) {
        document.querySelectorAll(".task-card").forEach(card => {
            card.style.display =
                filter === "all" || card.dataset.priority === filter ? "" : "none";
        });
    }

    function applyActiveFilter(card) {
        const activeBtn = document.querySelector(".filter-btn.active");
        if (!activeBtn) return;
        const filter = activeBtn.textContent.trim().toLowerCase();
        if (filter !== "all" && card.dataset.priority !== filter) {
            card.style.display = "none";
        }
    }

    function getStoredTasks() {
        return JSON.parse(localStorage.getItem("tasks")) || [];
    }

    function saveTasks(tasks) {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function getTaskFormData(form) {
        const taskName = form.querySelector("#taskName").value.trim();
        const userName = form.querySelector("#userName").value.trim();
        const email = form.querySelector("input[type='email']").value.trim();
        const date = form.querySelector("input[type='date']").value;
        const time = form.querySelector("input[type='time']").value;
        const priority = form.querySelector("select").value;
        const description = form.querySelector("textarea").value.trim();
        const status = form.querySelector("input[name='status']:checked")?.value || "Pending";
        const progress = Number(form.querySelector(".progress-slider")?.value || 0);
        const taskType = Array.from(form.querySelectorAll("input[name='taskType']:checked"))
            .map(el => el.value);

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

    function createTask(data, id) {
        const priorityKey = data.priority.toLowerCase().replace(" priority", "");
        const statusKey = data.status.toLowerCase().replace("in ", "");

        const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "task-card";
        card.dataset.priority = priorityKey;
        card.dataset.id = id;

        card.innerHTML = `
            <div class="card-actions">
                <button class="edit-btn">🖍</button>
                <button class="delete-btn">🗑️</button>
            </div>

            <h3 class="task-title">${data.taskName}</h3>
            <p class="task-description">${data.description || "No description provided."}</p>

            <div class="task-meta">
                <div class="meta-item">📅 Due: ${formattedDate} ${data.time || ""}</div>
                <div class="meta-item">👤 ${data.userName}</div>
            </div>

            <div class="task-footer">
                <span class="badge badge-${priorityKey}">● ${priorityKey.toUpperCase()}</span>
                <span class="badge badge-${statusKey}">
                    <span class="dot-${statusKey}">●</span> ${data.status}
                </span>
            </div>
        `;

        return card;
    }

    getStoredTasks().forEach(task => {
        const card = createTask(task.data, task.id);
        tasksGrid.appendChild(card);
    });

    taskForm.addEventListener("submit", e => {
        e.preventDefault();

        const data = getTaskFormData(taskForm);
        if (!data.isValid) return;

        const id = Date.now().toString();
        const card = createTask(data, id);

        tasksGrid.appendChild(card);
        applyActiveFilter(card);

        const tasks = getStoredTasks();
        tasks.push({ id, data });
        saveTasks(tasks);

        taskForm.reset();
        progressSlider.value = 0;
        progressText.textContent = "0%";
    });

    document.addEventListener("click", e => {
        if (e.target.classList.contains("delete-btn")) {
            const card = e.target.closest(".task-card");
            const id = card.dataset.id;
            saveTasks(getStoredTasks().filter(t => t.id !== id));
            card.remove();
        }

        if (e.target.classList.contains("edit-btn")) {
            openEditModal(e.target.closest(".task-card"));
        }
    });
    function openEditModal(card) {
        const id = card.dataset.id;
        const task = getStoredTasks().find(t => t.id === id);
        if (!task) return;

        document.getElementById("editTaskId").value = id;
        document.getElementById("editTaskName").value = task.data.taskName;
        document.getElementById("editUserName").value = task.data.userName;
        document.getElementById("editEmail").value = task.data.email;
        document.getElementById("editDate").value = task.data.date;
        document.getElementById("editTime").value = task.data.time;
        document.getElementById("editPriority").value = task.data.priority;
        document.getElementById("editDescription").value = task.data.description;

        editProgressSlider.value = task.data.progress || 0;
        editProgressText.textContent = `${editProgressSlider.value}%`;

        document.querySelectorAll("#editTaskType input").forEach(cb => {
            cb.checked = task.data.taskType?.includes(cb.value);
        });

        const statusRadio = document.querySelector(
            `#editTaskStatus input[value="${CSS.escape(task.data.status)}"]`
        );
        statusRadio && (statusRadio.checked = true);

        openModal(editModal);
    }

    editForm.addEventListener("submit", e => {
        e.preventDefault();

        const id = document.getElementById("editTaskId").value;
        const tasks = getStoredTasks();

        const updated = {
            taskName: document.getElementById("editTaskName").value.trim(),
            userName: document.getElementById("editUserName").value.trim(),
            email: document.getElementById("editEmail").value.trim(),
            date: document.getElementById("editDate").value,
            time: document.getElementById("editTime").value,
            priority: document.getElementById("editPriority").value,
            description: document.getElementById("editDescription").value,
            status: document.querySelector("input[name='editStatus']:checked")?.value || "Pending",
            progress: Number(editProgressSlider.value || 0),
            taskType: Array.from(
                document.querySelectorAll("#editTaskType input:checked")
            ).map(el => el.value)
        };

        saveTasks(tasks.map(t => t.id === id ? { ...t, data: updated } : t));

        const oldCard = document.querySelector(`.task-card[data-id="${id}"]`);
        oldCard.replaceWith(createTask(updated, id));

        closeModal(editModal);
    });

});