const formatDateVN = (dateStr) => {
  if (!dateStr) return "Vừa xong";
  return new Date(dateStr).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
export default formatDateVN;