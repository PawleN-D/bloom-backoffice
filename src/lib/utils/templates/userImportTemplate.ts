const templateRows = [
  "first_name,last_name,email,role,phone",
  "Ava,Byrne,ava.byrne@example.com,care_worker,+353870000001",
];

export function downloadImportTemplate() {
  const csv = `${templateRows.join("\n")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "bloom-user-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
