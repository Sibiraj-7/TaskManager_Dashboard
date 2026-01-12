document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const taskCards = document.querySelectorAll(".tasks-grid .task-card");
    taskCards.forEach(card => {
        const highBadge = card.querySelector(".badge-high");
        const mediumBadge = card.querySelector(".badge-medium");
        const lowBadge = card.querySelector(".badge-low");

        let priority = "all";
        if (highBadge) priority = "high";
        else if (mediumBadge) priority = "medium";
        else if (lowBadge) priority = "low";

        card.dataset.priority = priority;
    });

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const filter = btn.textContent.trim().toLowerCase();
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            taskCards.forEach(card => {
                if (filter === "all" || card.dataset.priority === filter) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    const progressSlider = document.querySelector(".progress-slider");
    const progressText = document.querySelector(".progressText");
    
    if (progressSlider && progressText) {
        progressSlider.addEventListener("input", () => {
            progressText.textContent = `${progressSlider.value}%`;
        });
        
        progressText.textContent = `${progressSlider.value}%`;
    }
});