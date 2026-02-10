document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("year").textContent = new Date().getFullYear();
    const datePick = document.getElementById("dueDate");
    const today = new Date();
    datePick.min = today.toISOString().split('T')[0];

    const filterButtons = document.querySelectorAll(".filter-btn");
    const tasksGrid = document.querySelector(".tasks-grid");
    let priorityFilter = 'all';
    let statusFilter = 'all'

    filterButtons.forEach(button => {
        button.addEventListener("click",() => {
            setActiveFilter(button);
            const filterText = button.textContent.trim();
            priorityFilter = filterText.split(' ')[0].toLowerCase();
            allFilters();
        });
    });

    const statusDropdown = document.getElementById("task-status-filter");

    statusDropdown.addEventListener('change',() => {
        statusFilter = statusDropdown.value;
        allFilters();
    })

    function allFilters() {

        let visibleCount = 0;
        document.querySelectorAll(".tasks-grid .task-card").forEach(card => {
            const priorityMatch = priorityFilter === 'all' || card.dataset.priority === priorityFilter;
            const badge = card.querySelector('.badge-status');
            const cardStatus = badge.textContent.toLowerCase();

            let statusMatch = false;

            if(statusFilter === 'all' ) {
                statusMatch = true;
            }
            else if(statusFilter === 'active') {
                statusMatch = cardStatus.includes('progress');
            }
            else if(statusFilter == 'pending') {
                statusMatch = cardStatus.includes('pending');
            }
            else {
                statusMatch = cardStatus.includes('completed');
            }

            if(priorityMatch && statusMatch) {
                card.style.display = "";
                visibleCount++;
            }
            else {
                card.style.display = "none";
            }
        });
        const placeholder = document.getElementById('taskPlaceholder');
        const totalCards = tasksGrid.querySelectorAll('.task-card').length;

        if(visibleCount === 0) {
            placeholder.style.display = 'flex';

            if(totalCards === 0){
                placeholder.innerHTML = 'No tasks added yet &#128221;';
            }
            else {
                placeholder.innerHTML = 'No tasks match the selected filters &#128270';
            }
        }
        else {
            placeholder.style.display = "none";
        }
    }

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
    allFilters();

    taskForm.addEventListener("submit",e =>{

        e.preventDefault();
        if (!formValidation()) return;

        const taskData = taskFormData(taskForm);
        const taskId = Date.now().toString();
        const taskCard = createTask(taskData, taskId);
        tasksGrid.appendChild(taskCard);
        storeTask(taskData, taskId);
        allFilters();
        updateFilterCounts();
        showNotification("Task created successfully!!");
        taskForm.reset();
        if (progressSlider) progressSlider.value = 0;
        if (progressText) progressText.textContent = "0%";
    });

    function setActiveFilter(activeBtn){
        filterButtons.forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
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

    function clearAllError(){
        document.querySelectorAll(".error-message").forEach(error => {
            error.textContent = '';
        });
    }

    taskForm.addEventListener('reset',clearAllError);
    
    function setError(id,message){
        document.getElementById(id).innerHTML = '&#9432 ' + message;
    }

    function clearError(id){
        document.getElementById(id).textContent = '';
    }

    const userNameBox = document.getElementById("userName");
    const taskNameBox = document.getElementById("taskName");
    const emailBox = document.getElementById("email");
    const dateBox = document.getElementById("dueDate");
    const timeBox = document.getElementById("dueTime");
    const estimatedHoursBox = document.getElementById("estimatedHours");
    const projectUrlBox = document.getElementById("projectUrl");
    const descriptionBox =  document.getElementById("taskDescription");
    const priorityBox = document.querySelector(".task-form select");

    //Live error message deleting
    userNameBox.addEventListener("input", () => clearError('user-error'));
    taskNameBox.addEventListener("input", () => clearError('task-error'));
    emailBox.addEventListener("input", () => clearError('email-error'));
    dateBox.addEventListener("change", () => clearError('date-error'));
    timeBox.addEventListener("change", () => clearError('time-error'));
    estimatedHoursBox.addEventListener("input", () => clearError('estimate-error'));
    projectUrlBox.addEventListener("input", () => clearError('project-error'));
    descriptionBox.addEventListener("input", () => clearError('description-error'));
    priorityBox.addEventListener("change", () => clearError('priority-error'));
    document.querySelectorAll("input[name='taskType']").forEach(check => {
        check.addEventListener("change", () => clearError("tasktype-error"));
    });  
    document.querySelectorAll("input[name='status']").forEach(radio => {
        radio.addEventListener("change", () => clearError("status-error"));
    });
    const userNameRegex = /^[A-Za-z ]+$/;
    const taskNameRegex = /^[A-Za-z0-9 ]+$/;
    const emailRegex = /^[A-Za-z0-9.]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

    let isValid = true;
    let firstError = null;

    function userNameValidate(userName,userError,userBox){
        if(!userName){
            setError(userError,"Assignee Name is required");
            firstError ??= userBox;
            isValid = false;
        }
        else if(!userNameRegex.test(userName)){
            setError(userError,'Assignee Name must not contain any special characters or numbers.');
            firstError ??= userBox;
            isValid = false;
        }
        else if(userName.length < 3){
            setError(userError," Assignee Name must be 3 characters or more");
            firstError ??= userBox;
            isValid = false;
        }
        else{
            clearError(userError);
        }
    }

    function taskNameValidate(taskName,taskError,taskBox){
        if(!taskName){
            setError(taskError, "Task Name is required");
            firstError ??= taskBox;
            isValid = false;
        }
        else if(!taskNameRegex.test(taskName)){
            setError(taskError,"Task Name must not contain any special characters.");
            firstError ??= taskBox;
            isValid = false;
        }
        else if(taskName.length < 3) {
            setError(taskError, " TaskName must be 3 characters or more");
            firstError ??= taskBox;
            isValid = false;
        }
        else{
            clearError(taskError);
        }
    }

    function emailValidate(email,emailError,emailBox){
        if(!email){
            setError(emailError,'Email is required');
            firstError ??= emailBox;
            isValid = false;
        }
        else if(!emailRegex.test(email)){
            setError(emailError,"Enter an Valid email. Eg: abcd@gmail.com");
            firstError ??= emailBox;
            isValid = false;
        }
        else{
            clearError(emailError);
        }
    }

    function dateValidate(date,dateError,dateBox){
        if(!date){
            setError(dateError, 'Date is required');
            firstError ??= dateBox;
            isValid = false;
        }
        else{
            clearError(dateError);
        }
    }

    function timeValidate(time,timeError,nowDatetime,timeBox){
        if(!time){
            setError(timeError,'Time is required');
            firstError ??= timeBox;
            isValid = false;
        }
        else if(nowDatetime < today){
            setError(timeError,"Time can't be assigned in past");
            firstError ??= timeBox;
            isValid = false;
        }
        else{
            clearError(timeError);
        }
    }

    function estimateValidate(estimatedHours,estimateError,estimatedHoursBox){
        if(!estimatedHours){
            setError(estimateError,'Estimated Hours is required');
            firstError ??= estimatedHoursBox;
            isValid = false;
        }
        else if(estimatedHours < 1){
            setError(estimateError,'Invalid Estimated Hours');
            firstError ??= estimatedHoursBox;
            isValid = false;
        }
        else{
            clearError(estimateError);
        }
    }

    function projectUrlValidate(projectUrl,projectError,projectUrlBox){
        if(!projectUrl){
            setError(projectError,'Project URL is required');
            firstError ??= projectUrlBox;
            isValid = false;
        }
        else if(projectUrl){
            try{
                new URL(projectUrl);
                clearError(projectError);
            }catch{
                setError(projectError,'Enter a valid URL (e.g., https://example.com).');
                firstError ??= projectUrlBox;
                isValid = false;
            }
        }
        else{
            clearError(projectError);
        }
    }

    function descriptionValidate(description,descriptionError,descriptionBox){
        if(!description){
            setError(descriptionError,"Task Description is required");
            firstError ??= descriptionBox;
            isValid = false;
        }
        else{
            clearError(descriptionError);
        }
    }

    function priorityValidate(priority,priorityError,priorityBox){
        if(priority.length === 0){
            setError(priorityError,'Select a priority Level');
            firstError ??= priorityBox;
            isValid = false;
        }
        else{
            clearError(priorityError);
        }
    }

    function taskTypeValidate(taskTypes,valueError,valueBox){
        if(taskTypes.length === 0){
            setError(valueError,"Select a Task type");
            firstError ??= document.querySelector(valueBox);
            isValid = false;
        }
        else{
            clearError(valueError);
        }
    }

    function statusValidate(status,valueError,valueBox){
        if(status.length === 0){
            setError(valueError,"Select a Status");
            firstError ??= document.querySelector(valueBox);
            isValid = false;
        }
        else{
            clearError(valueError);
        }
    }

    function focusIntoFirstError(){
        if (firstError) {
            firstError.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            setTimeout(() => {
                firstError.focus();
            }, 300);
        }
    }

    function formValidation(){

        isValid = true;
        firstError = null;

        const userName = userNameBox.value.trim();
        const taskName = taskNameBox.value.trim();
        const email = emailBox.value.trim();
        const date = dateBox.value.trim();
        const time = timeBox.value.trim();
        const priority = priorityBox.value;
        const estimatedHours = estimatedHoursBox.value.trim();
        const projectUrl = projectUrlBox.value.trim();
        const description = descriptionBox.value.trim();
        const nowDatetime = new Date(`${date}T${time}`);

        const taskTypes = document.querySelectorAll("input[name='taskType']:checked");
        const status = document.querySelectorAll("input[name='status']:checked");

        userNameValidate(userName,'user-error',userNameBox);

        taskNameValidate(taskName,'task-error',taskNameBox);

        emailValidate(email,'email-error',emailBox);

        dateValidate(date,'date-error',dateBox);

        timeValidate(time,'time-error',nowDatetime,timeBox);

        priorityValidate(priority,'priority-error',priorityBox);

        estimateValidate(estimatedHours,'estimate-error',estimatedHoursBox);

        projectUrlValidate(projectUrl,'project-error',projectUrlBox);

        descriptionValidate(description,'description-error',descriptionBox);

        taskTypeValidate(taskTypes,'tasktype-error','.task-type');

        statusValidate(status,'status-error','.task-status');

        focusIntoFirstError();

        return isValid;
    }

    //Edit Form Validation
    const editDatePick = document.getElementById('editDate');
    editDatePick.min = today.toISOString().split('T')[0];

    const editUserNameBox = document.getElementById("editUserName");
    const editTaskNameBox = document.getElementById("editTaskName");
    const editEmailBox = document.getElementById("editEmail");
    const editDateBox = document.getElementById("editDate");
    const editTimeBox = document.getElementById("editTime");
    const editEstimatedHoursBox = document.getElementById("editEstimation");
    const editProjectUrlBox = document.getElementById("editProject");
    const editDescriptionBox =  document.getElementById("editDescription");
    const editPriorityBox = document.getElementById("editPriority");

    //Live error message deleting
    editUserNameBox.addEventListener("input", () => clearError('editUserError'));
    editTaskNameBox.addEventListener("input", () => clearError('editTaskError'));
    editEmailBox.addEventListener("input", () => clearError('editEmailError'));
    editDateBox.addEventListener("change", () => clearError('editDateError'));
    editTimeBox.addEventListener("change", () => clearError('editTimeError'));
    editEstimatedHoursBox.addEventListener("input", () => clearError('editEstimateError'));
    editProjectUrlBox.addEventListener("input", () => clearError('editProjectError'));
    editDescriptionBox.addEventListener("input", () => clearError('editDescriptionError'));
    editPriorityBox.addEventListener("change", () => clearError('editPriorityError'));
    document.querySelectorAll("input[name='editTaskType']").forEach(check => {
        check.addEventListener("change", () => clearError("editTasktypeError"));
    });  
    document.querySelectorAll("input[name='editStatus']").forEach(radio=> {
        radio.addEventListener('change', () => clearError('editStatusError'))
    })

    function editFormValidation(){
        isValid = true;
        firstError = null;

        const userName = editUserNameBox.value.trim();
        const taskName = editTaskNameBox.value.trim();
        const email = editEmailBox.value.trim();
        const date = editDateBox.value.trim();
        const time = editTimeBox.value.trim();
        const priority = editPriorityBox.value;
        const estimatedHours = editEstimatedHoursBox.value.trim();
        const projectUrl = editProjectUrlBox.value.trim();
        const description =  editDescriptionBox.value.trim();
        const nowDatetime = new Date (`${date}T${time}`);

        const taskTypes = document.querySelectorAll("input[name='editTaskType']:checked");
        const status = document.querySelectorAll("input[name='editStatus']:checked");

        userNameValidate(userName,'editUserError',editUserNameBox);
        taskNameValidate(taskName,'editTaskError',editTaskNameBox);
        emailValidate(email,'editEmailError',editEmailBox);
        dateValidate(date,'editDateError',editDateBox);
        timeValidate(time,'editTimeError',nowDatetime,editTimeBox);
        priorityValidate(priority,'editPriorityError',editPriorityBox);
        estimateValidate(estimatedHours,'editEstimateError',editEstimatedHoursBox);
        projectUrlValidate(projectUrl,'editProjectError',editProjectUrlBox);
        descriptionValidate(description,'editDescriptionError',editDescriptionBox);
        taskTypeValidate(taskTypes,'editTasktypeError','.task-type-modal');
        statusValidate(status,'editStatusError','.edit-status-modal');
        
        focusIntoFirstError();

        return isValid;
    }

    function taskFormData(form){
        const taskName = form.querySelector("#taskName").value.trim();
        const userName = form.querySelector("#userName").value.trim();
        const email = form.querySelector("#email").value.trim();
        const date = form.querySelector("#dueDate").value;
        const time = form.querySelector("#dueTime").value;
        const estimatedHours = form.querySelector("#estimatedHours").value;
        const projectUrl = form.querySelector("#projectUrl").value;
        const priority = form.querySelector("select").value;
        const description = form.querySelector("#taskDescription").value.trim();
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
                <button class="edit-btn" title="Edit">&#128397;</button>
                <button class="delete-btn" title="Delete">&#x1F5D1;&#xFE0F;</button>
            </div>

            <h3 class = "task-title">${data.taskName}</h3>
            <p class = "task-description">${data.description || "No description Provided."}</p>
            
            <div class = "task-meta">
                <div class ="meta-item">&#128197 Due: ${formattedDate} ${data.time ? `${data.time}`: ""}</div>
                <div class ="meta-item">&#128100 ${displayName}</div>
            </div>

            <div class ="task-footer">
                <span class="badge badge-${priorityKey}">
                    ● ${data.priority.split(" ")[0].toUpperCase()}
                </span>
                <span class="badge badge-${statusKey} badge-status">
                    <span class="dot-${statusKey}">●</span> ${data.status}
                </span>
            </div>
        `;

        return card;
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
        allFilters();
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

        if(!editFormValidation()) return;

        let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks = tasks.map(t =>
            t.id === taskId ? { ...t, data: updatedData } : t
        );

        localStorage.setItem("tasks", JSON.stringify(tasks));
        const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
        const newCard = createTask(updatedData, taskId);
        card.replaceWith(newCard);
        allFilters();
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

            if (existsinLS) openEditModal(card);
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