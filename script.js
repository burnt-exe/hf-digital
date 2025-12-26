// Lightweight progress persistence using localStorage
document.querySelectorAll("input[type='checkbox']").forEach((checkbox, index) => {
  const key = `day-task-${index}`;
  checkbox.checked = localStorage.getItem(key) === "true";

  checkbox.addEventListener("change", () => {
    localStorage.setItem(key, checkbox.checked);
  });
});
